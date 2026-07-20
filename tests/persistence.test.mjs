import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

const storage = new Map();

globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
};

const {
  STORAGE_KEY,
  SCORE_FORMAT,
  normalizeScore,
  readSavedScores,
  persistSavedScores,
  safeName,
  cloneScore,
  personalScore,
} = await import("../src/lib/services/persistence.ts");
const { CURRENT_INSTRUMENT } = await import("../src/lib/types.ts");

const validScore = {
  title: "Teste",
  instrument: CURRENT_INSTRUMENT,
  genre: "Pessoal",
  bpm: 90,
  timeSignature: { beats: 2, subdivision: 4 },
  measures: 1,
  cells: [{ baixo: "P", meio: null, cima: null, durationSteps: 16 }],
  accents: [1],
};

beforeEach(() => {
  storage.clear();
});

describe("normalizeScore", () => {
  test("accepts a valid score object", () => {
    const score = normalizeScore(validScore);
    assert.ok(score);
    assert.equal(score.title, "Teste");
    assert.equal(score.instrument, CURRENT_INSTRUMENT);
  });

  test("rejects invalid payloads", () => {
    assert.equal(normalizeScore(null), null);
    assert.equal(normalizeScore("x"), null);
    assert.equal(normalizeScore({ title: "" }), null);
    assert.equal(normalizeScore({ ...validScore, cells: [] }), null);
    assert.equal(normalizeScore({ ...validScore, bpm: 0 }), null);
  });

  test("drops unknown stroke types in cells", () => {
    const score = normalizeScore({
      ...validScore,
      cells: [{ baixo: "NOT_A_STROKE", meio: null, cima: null }],
    });
    assert.ok(score);
    assert.equal(score.cells[0].baixo, null);
  });
});

describe("safeName", () => {
  test("sanitizes unsafe filename characters", () => {
    assert.equal(safeName("  samba/bamba  "), "samba-bamba");
  });

  test("falls back to levada for empty names", () => {
    assert.equal(safeName("   "), "levada");
  });
});

describe("cloneScore and personalScore", () => {
  test("cloneScore creates a deep copy", () => {
    const original = normalizeScore(validScore);
    const copy = cloneScore(original);
    copy.cells[0].baixo = "T";
    assert.equal(original.cells[0].baixo, "P");
    assert.notEqual(original.cells, copy.cells);
  });

  test("personalScore sets title and instrument", () => {
    const original = normalizeScore(validScore);
    const personal = personalScore(original, "Minha levada");
    assert.equal(personal.title, "Minha levada");
    assert.equal(personal.instrument, CURRENT_INSTRUMENT);
    assert.equal(personal.type, "personal");
  });
});

describe("readSavedScores", () => {
  test("returns empty list when storage is empty", () => {
    assert.deepEqual(readSavedScores(), []);
  });

  test("migrates legacy array format to envelope", () => {
    const score = normalizeScore(validScore);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "legacy-1",
          name: "Legado",
          score,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          formatVersion: 2,
        },
      ]),
    );

    const saved = readSavedScores();
    assert.equal(saved.length, 1);
    assert.equal(saved[0].name, "Legado");

    const envelope = JSON.parse(localStorage.getItem(STORAGE_KEY));
    assert.equal(envelope.schemaVersion, 1);
  });

  test("round-trips through persistSavedScores", () => {
    const score = normalizeScore(validScore);
    persistSavedScores([
      {
        id: "id-1",
        name: "Salva",
        score,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        formatVersion: 2,
      },
    ]);

    const saved = readSavedScores();
    assert.equal(saved.length, 1);
    assert.equal(saved[0].name, "Salva");
    assert.equal(saved[0].score.title, "Teste");
  });
});

describe("exported score format constants", () => {
  test("keeps stable format identifier", () => {
    assert.equal(SCORE_FORMAT, "pandeiro-de-bamba-score");
  });
});
