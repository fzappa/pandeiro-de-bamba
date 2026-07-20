import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  generateWavyLine,
  noteY,
  systemForSlot,
  systemForStep,
  yOffsetForSystem,
} from "../src/lib/score-visual-helpers.ts";
import { STROKES } from "../src/lib/types.ts";

describe("score visual helpers", () => {
  test("generateWavyLine returns an SVG path starting at the given point", () => {
    const path = generateWavyLine(10, 40, 24);
    assert.match(path, /^M 10 40/);
    assert.ok(path.includes("Q"));
  });

  test("noteY maps stroke positions relative to the staff line", () => {
    const lineY = 100;
    assert.equal(noteY("D", lineY), lineY - 24);
    assert.equal(noteY("P", lineY), lineY + 24);
    assert.equal(noteY("T", lineY), lineY);
  });

  test("system helpers partition slots and steps consistently", () => {
    assert.equal(systemForSlot(0, 4), 0);
    assert.equal(systemForSlot(4, 4), 1);
    assert.equal(systemForStep(8, 4, 2), 1);
    assert.equal(yOffsetForSystem(2, 80, 20, 10), 210);
  });

  test("every stroke has a drawable vertical position", () => {
    for (const stroke of Object.keys(STROKES)) {
      const y = noteY(stroke, 120);
      assert.ok(Number.isFinite(y));
    }
  });
});
