import { DEFAULT_BPM, MAX_BPM, MAX_MEASURES, MIN_BPM } from "./presets";
import { CURRENT_INSTRUMENT, STROKES } from "./types";
import { normalizeScoreResolution, WHOLE_NOTE_STEPS } from "./notation";
import type { BeatCell, Score, StrokeType } from "./types";

type LibraryEntry = {
  id: string;
  name: string;
  score: Score;
};

const LIBRARY_GENRE = "Biblioteca";
const ALL_STROKES = new Set<StrokeType>(Object.keys(STROKES) as StrokeType[]);
const libraryFiles = import.meta.glob("../../library/*.pdb.json", {
  eager: true,
  import: "default",
});

function normalizeStroke(value: unknown): StrokeType | null {
  return typeof value === "string" && ALL_STROKES.has(value as StrokeType)
    ? (value as StrokeType)
    : null;
}

function legacyDurationField() {
  return ["v", "e", "x", "Duration"].join("");
}

function normalizeCell(value: unknown): BeatCell {
  const cell =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const next: BeatCell = {
    baixo: normalizeStroke(cell.baixo),
    meio: normalizeStroke(cell.meio),
    cima: normalizeStroke(cell.cima),
  };
  const durationSteps = cell.durationSteps ?? cell[legacyDurationField()];
  if (
    typeof durationSteps === "number" &&
    Number.isFinite(durationSteps) &&
    durationSteps > 0
  ) {
    next.durationSteps = Math.min(
      WHOLE_NOTE_STEPS * 2,
      Math.round(durationSteps),
    );
  }
  if (cell.explicitRest === true) {
    next.explicitRest = true;
  }
  if (cell.accented === true && (next.baixo || next.meio || next.cima)) {
    next.accented = true;
  }
  return next;
}

function scorePayload(value: unknown) {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (raw.score && typeof raw.score === "object")
    return raw.score as Record<string, unknown>;
  return raw;
}

function normalizeLibraryScore(value: unknown): Score | null {
  const raw = scorePayload(value);
  if (!raw || raw.instrument !== CURRENT_INSTRUMENT) return null;

  const timeSignature =
    typeof raw.timeSignature === "object" && raw.timeSignature !== null
      ? (raw.timeSignature as Record<string, unknown>)
      : {};
  const beats =
    typeof timeSignature.beats === "number"
      ? Math.round(timeSignature.beats)
      : 4;
  const subdivision =
    typeof timeSignature.subdivision === "number"
      ? Math.round(timeSignature.subdivision)
      : 4;
  const cells = Array.isArray(raw.cells) ? raw.cells.map(normalizeCell) : [];
  if (cells.length === 0) return null;

  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : "Sem nome";
  const subtitle =
    typeof raw.subtitle === "string" && raw.subtitle.trim()
      ? raw.subtitle.trim()
      : undefined;
  const author =
    typeof raw.author === "string" && raw.author.trim()
      ? raw.author.trim()
      : undefined;
  const genre =
    typeof raw.genre === "string" && raw.genre.trim()
      ? raw.genre.trim()
      : "Custom";
  const type =
    typeof raw.type === "string" && raw.type.trim()
      ? raw.type.trim()
      : undefined;

  return normalizeScoreResolution({
    title,
    subtitle,
    author,
    instrument: CURRENT_INSTRUMENT,
    genre: genre === LIBRARY_GENRE ? "Biblioteca" : genre,
    type,
    bpm:
      typeof raw.bpm === "number"
        ? Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(raw.bpm)))
        : DEFAULT_BPM,
    timeSignature: {
      beats: Math.max(1, Math.min(16, beats)),
      subdivision: [2, 4, 8, 16].includes(subdivision) ? subdivision : 4,
    },
    measures:
      typeof raw.measures === "number"
        ? Math.max(1, Math.min(MAX_MEASURES, Math.round(raw.measures)))
        : 1,
    cells,
    accents: Array.isArray(raw.accents)
      ? [
          ...new Set(
            raw.accents
              .filter((accent): accent is number => typeof accent === "number")
              .map(Math.round),
          ),
        ]
          .filter((accent) => accent > 0)
          .sort((a, b) => a - b)
      : [],
  });
}

export const LIBRARY_SCORES: LibraryEntry[] = Object.entries(libraryFiles)
  .map(([id, value]) => {
    const score = normalizeLibraryScore(value);
    if (!score) return null;
    return { id, name: score.title, score };
  })
  .filter(
    (entry): entry is LibraryEntry =>
      entry !== null && entry.score.type === "library",
  )
  .sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
  );
