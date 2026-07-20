import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { GENRE_PRESETS, MAX_BPM, MIN_BPM } from "../src/lib/presets.ts";
import {
  expandCellsResolution,
  normalizeScoreResolution,
  stepsPerBeatForSignature,
  WHOLE_NOTE_STEPS,
} from "../src/lib/notation.ts";
import { computePlaybackSteps } from "../src/lib/playback-domain.ts";
import {
  MUTED_SKIN_COLOR,
  MUTED_THUMB_SKIN_TRANSFORM,
  MUTED_UPPER_SKIN_TRANSFORM,
  OPEN_SKIN_COLOR,
  THUMB_SKIN_PATH,
  UPPER_SKIN_PATH,
} from "../src/lib/pandeiroGeometry.ts";
import { STROKES } from "../src/lib/types.ts";

const NOTE_POSITIONS = new Set(["baixo", "meio", "cima"]);
const NOTEHEAD_SHAPES = new Set(["filled", "x", "headless", "ghost", "none"]);

function strokesInCell(cell) {
  return [cell.baixo, cell.meio, cell.cima].filter((stroke) => stroke !== null);
}

describe("stroke catalog", () => {
  test("all strokes have valid metadata", () => {
    for (const [key, stroke] of Object.entries(STROKES)) {
      assert.equal(stroke.type, key);
      assert.ok(stroke.label.length > 0, `${key} should have a label`);
      assert.ok(
        stroke.description.length > 0,
        `${key} should have a description`,
      );
      assert.ok(
        NOTE_POSITIONS.has(stroke.position),
        `${key} has an invalid position`,
      );
      assert.ok(
        NOTEHEAD_SHAPES.has(stroke.notehead),
        `${key} has an invalid notehead`,
      );
      assert.match(
        stroke.color,
        /^#[0-9a-f]{6}$/i,
        `${key} should use a hex color`,
      );
    }
  });

  test("muted strokes keep their base note identity", () => {
    assert.equal(STROKES.P_mut.label, STROKES.P.label);
    assert.equal(STROKES.P_mut.position, STROKES.P.position);
    assert.equal(STROKES.D_mut.label, STROKES.D.label);
    assert.equal(STROKES.D_mut.position, STROKES.D.position);
  });

  test("rulo keeps the continuous-note notation contract", () => {
    assert.equal(STROKES.R.notehead, "none");
    assert.equal(STROKES.R.position, "cima");
  });
});

describe("genre presets", () => {
  test("preset names are unique", () => {
    const names = GENRE_PRESETS.map((preset) => preset.name);
    assert.equal(new Set(names).size, names.length);
  });

  test("all presets have valid dimensions and accents", () => {
    for (const preset of GENRE_PRESETS) {
      const expandedStepsPerBeat =
        WHOLE_NOTE_STEPS / preset.timeSignature.subdivision;
      const expectedExpandedSteps =
        preset.measures * preset.timeSignature.beats * expandedStepsPerBeat;
      const expectedPresetCells = expectedExpandedSteps / 4;
      const totalBeats = preset.measures * preset.timeSignature.beats;

      assert.equal(
        preset.cells.length,
        expectedPresetCells,
        `${preset.name} has an unexpected cell count`,
      );
      assert.ok(
        preset.bpm >= MIN_BPM && preset.bpm <= MAX_BPM,
        `${preset.name} BPM is out of range`,
      );

      for (const accent of preset.accents) {
        assert.ok(
          Number.isInteger(accent),
          `${preset.name} accent should be an integer`,
        );
        assert.ok(
          accent >= 1 && accent <= totalBeats,
          `${preset.name} accent ${accent} is out of range`,
        );
      }
    }
  });

  test("preset cells only reference known strokes in the correct position", () => {
    for (const preset of GENRE_PRESETS) {
      for (const [index, cell] of preset.cells.entries()) {
        for (const stroke of strokesInCell(cell)) {
          assert.ok(
            STROKES[stroke],
            `${preset.name} cell ${index} references an unknown stroke`,
          );
        }

        if (cell.baixo)
          assert.equal(
            STROKES[cell.baixo].position,
            "baixo",
            `${preset.name} cell ${index} has baixo mismatch`,
          );
        if (cell.meio)
          assert.equal(
            STROKES[cell.meio].position,
            "meio",
            `${preset.name} cell ${index} has meio mismatch`,
          );
        if (cell.cima)
          assert.equal(
            STROKES[cell.cima].position,
            "cima",
            `${preset.name} cell ${index} has cima mismatch`,
          );
      }
    }
  });
});

describe("notation resolution", () => {
  test("uses 64 whole-note steps so semifusa is representable", () => {
    assert.equal(WHOLE_NOTE_STEPS, 64);
    assert.equal(stepsPerBeatForSignature({ beats: 4, subdivision: 4 }), 16);
    assert.equal(stepsPerBeatForSignature({ beats: 2, subdivision: 8 }), 8);
  });

  test("expands old preset cells without changing musical durations", () => {
    const cells = [
      { baixo: "P", meio: null, cima: null, durationSteps: 2 },
      { baixo: null, meio: null, cima: null },
    ];
    const expanded = expandCellsResolution(cells, 4);

    assert.equal(expanded.length, 8);
    assert.equal(expanded[0].baixo, "P");
    assert.equal(expanded[0].durationSteps, 8);
    assert.deepEqual(expanded.slice(1, 4), [
      { baixo: null, meio: null, cima: null },
      { baixo: null, meio: null, cima: null },
      { baixo: null, meio: null, cima: null },
    ]);
  });

  test("normalizes legacy 32-step scores into the current 64-step grid", () => {
    const legacyScore = {
      title: "Legacy",
      instrument: "pandeiro",
      genre: "Pessoal",
      bpm: 80,
      timeSignature: { beats: 4, subdivision: 4 },
      measures: 1,
      cells: Array.from({ length: 32 }, (_, index) => ({
        baixo: index === 0 ? "P" : null,
        meio: null,
        cima: null,
        ...(index === 0 ? { durationSteps: 4 } : {}),
      })),
      accents: [1],
    };

    const normalized = normalizeScoreResolution(legacyScore);

    assert.equal(normalized.cells.length, 64);
    assert.equal(normalized.cells[0].baixo, "P");
    assert.equal(normalized.cells[0].durationSteps, 8);
  });
});

describe("playback engine domain logic", () => {
  test("uses content end instead of full grid when score has trailing empty space", () => {
    const score = normalizeScoreResolution({
      title: "Playback window",
      instrument: "pandeiro",
      genre: "Teste",
      bpm: 96,
      timeSignature: { beats: 4, subdivision: 4 },
      measures: 2,
      cells: Array.from({ length: 128 }, (_, index) => ({
        baixo: index === 0 ? "P" : null,
        meio: null,
        cima: null,
        ...(index === 0 ? { durationSteps: 16 } : {}),
      })),
      accents: [],
    });

    assert.equal(computePlaybackSteps(score), 16);
  });

  test("uses the full grid when score has no explicit content", () => {
    const score = normalizeScoreResolution({
      title: "Empty playback",
      instrument: "pandeiro",
      genre: "Teste",
      bpm: 96,
      timeSignature: { beats: 2, subdivision: 4 },
      measures: 1,
      cells: Array.from({ length: 32 }, () => ({
        baixo: null,
        meio: null,
        cima: null,
      })),
      accents: [],
    });

    assert.equal(computePlaybackSteps(score), 32);
  });
});

describe("pandeiro skin geometry", () => {
  test("open skin regions share the grave color and muted regions use the pressed color", () => {
    assert.equal(OPEN_SKIN_COLOR, STROKES.D.color);
    assert.equal(MUTED_SKIN_COLOR, STROKES.P.color);
  });

  test("muted grave regions reuse the open geometry at exactly 50 percent scale", () => {
    assert.match(THUMB_SKIN_PATH, /A 150 150 0 0 0/);
    assert.match(UPPER_SKIN_PATH, /A 150 150 0 0 1/);
    assert.match(MUTED_THUMB_SKIN_TRANSFORM, /scale\(0\.5\)/);
    assert.match(MUTED_UPPER_SKIN_TRANSFORM, /scale\(0\.5\)/);
    assert.equal(
      MUTED_THUMB_SKIN_TRANSFORM,
      "translate(200 304) scale(0.5) translate(-200 -304)",
    );
    assert.equal(
      MUTED_UPPER_SKIN_TRANSFORM,
      "translate(200 96) scale(0.5) translate(-200 -96)",
    );
  });
});
