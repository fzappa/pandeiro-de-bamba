import type { BeatCell, Score, StrokeType, TimeSignature } from "../types.ts";
import { CURRENT_INSTRUMENT, STROKES } from "../types.ts";
import { normalizeScoreResolution } from "../notation.ts";
import { createId } from "../utils.ts";

export { createId };

export const STORAGE_KEY = "pandeiro-de-bamba:saved-scores";
export const SCORE_FORMAT = "pandeiro-de-bamba-score";
export const SCORE_FORMAT_VERSION = 2;
export const SAVED_SCORES_SCHEMA_VERSION = 1;

export type SavedScore = {
  id: string;
  name: string;
  score: Score;
  createdAt: string;
  updatedAt: string;
  formatVersion: number;
};

export type ExportedScore = {
  format: typeof SCORE_FORMAT;
  formatVersion: number;
  exportedAt: string;
  score: Score;
};

type SavedScoresEnvelope = {
  schemaVersion: number;
  savedScores: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStrokeType(value: unknown): value is StrokeType {
  return typeof value === "string" && value in STROKES;
}

function parseStrokeSlot(value: unknown): StrokeType | null {
  if (value === null) return null;
  return isStrokeType(value) ? value : null;
}

function parseBeatCell(value: unknown): BeatCell | null {
  if (!isRecord(value)) return null;
  const cell: BeatCell = {
    baixo: parseStrokeSlot(value.baixo),
    meio: parseStrokeSlot(value.meio),
    cima: parseStrokeSlot(value.cima),
  };
  if (typeof value.durationSteps === "number" && value.durationSteps > 0) {
    cell.durationSteps = value.durationSteps;
  }
  if (value.explicitRest === true) cell.explicitRest = true;
  if (value.accented === true) cell.accented = true;
  return cell;
}

function parseTimeSignature(value: unknown): TimeSignature | null {
  if (!isRecord(value)) return null;
  if (typeof value.beats !== "number" || typeof value.subdivision !== "number")
    return null;
  if (value.beats < 1 || value.subdivision < 1) return null;
  return { beats: value.beats, subdivision: value.subdivision };
}

export function normalizeScore(value: unknown): Score | null {
  if (!isRecord(value)) return null;
  if (typeof value.title !== "string" || !value.title.trim()) return null;
  if (typeof value.genre !== "string") return null;
  if (typeof value.bpm !== "number" || value.bpm < 1) return null;
  if (typeof value.measures !== "number" || value.measures < 1) return null;
  if (!Array.isArray(value.cells)) return null;

  const timeSignature = parseTimeSignature(value.timeSignature);
  if (!timeSignature) return null;

  const cells = value.cells
    .map(parseBeatCell)
    .filter((cell): cell is BeatCell => cell !== null);
  if (cells.length === 0) return null;

  const accents = Array.isArray(value.accents)
    ? value.accents.filter(
        (accent): accent is number => typeof accent === "number",
      )
    : [];

  const score: Score = {
    title: value.title.trim(),
    genre: value.genre,
    instrument:
      typeof value.instrument === "string"
        ? value.instrument
        : CURRENT_INSTRUMENT,
    bpm: value.bpm,
    timeSignature,
    measures: value.measures,
    cells,
    accents,
    ...(typeof value.subtitle === "string" ? { subtitle: value.subtitle } : {}),
    ...(typeof value.author === "string" ? { author: value.author } : {}),
    ...(typeof value.type === "string" ? { type: value.type } : {}),
  };

  return normalizeScoreResolution(score);
}

function normalizeSavedScores(rawItems: unknown[]): SavedScore[] {
  return rawItems
    .map((item): SavedScore | null => {
      if (typeof item !== "object" || item === null) return null;
      const rawItem = item as Record<string, unknown>;
      const savedScore = normalizeScore(rawItem.score);
      if (!savedScore) return null;
      if (savedScore.instrument !== CURRENT_INSTRUMENT) return null;
      return {
        id: typeof rawItem.id === "string" ? rawItem.id : createId(),
        name:
          typeof rawItem.name === "string" && rawItem.name.trim()
            ? rawItem.name.trim()
            : savedScore.title,
        score: savedScore,
        createdAt:
          typeof rawItem.createdAt === "string"
            ? rawItem.createdAt
            : new Date().toISOString(),
        updatedAt:
          typeof rawItem.updatedAt === "string"
            ? rawItem.updatedAt
            : new Date().toISOString(),
        formatVersion:
          typeof rawItem.formatVersion === "number"
            ? rawItem.formatVersion
            : SCORE_FORMAT_VERSION,
      };
    })
    .filter((item): item is SavedScore => item !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function readEnvelope(parsed: unknown): SavedScoresEnvelope | null {
  if (Array.isArray(parsed)) {
    return {
      schemaVersion: 0,
      savedScores: parsed,
    };
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const maybeEnvelope = parsed as Record<string, unknown>;
  if (
    typeof maybeEnvelope.schemaVersion !== "number" ||
    !Array.isArray(maybeEnvelope.savedScores)
  ) {
    return null;
  }
  return {
    schemaVersion: maybeEnvelope.schemaVersion,
    savedScores: maybeEnvelope.savedScores,
  };
}

export function readSavedScores(): SavedScore[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const envelope = readEnvelope(parsed);
    if (!envelope) return [];

    const normalized = normalizeSavedScores(envelope.savedScores);
    // Auto-migrate legacy/older schema to current envelope format.
    if (envelope.schemaVersion !== SAVED_SCORES_SCHEMA_VERSION) {
      persistSavedScores(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

export function persistSavedScores(nextScores: SavedScore[]) {
  const envelope = {
    schemaVersion: SAVED_SCORES_SCHEMA_VERSION,
    savedScores: nextScores,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export function safeName(name: string) {
  return (
    name
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ") || "levada"
  );
}

export function cloneScore(sc: Score): Score {
  return {
    ...sc,
    timeSignature: { ...sc.timeSignature },
    cells: sc.cells.map((cell) => ({ ...cell })),
    accents: [...sc.accents],
  };
}

export function personalScore(sc: Score, title: string): Score {
  return {
    ...cloneScore(sc),
    title,
    instrument: CURRENT_INSTRUMENT,
    type: "personal",
  };
}
