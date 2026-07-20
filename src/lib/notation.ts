import type { BeatCell, Score, TimeSignature } from "./types";

export const WHOLE_NOTE_STEPS = 64;
export const LEGACY_WHOLE_NOTE_STEPS = 32;
export const PRESET_SOURCE_STEPS_PER_WHOLE = 16;

export function stepsPerBeatForSignature(timeSignature: TimeSignature) {
  return WHOLE_NOTE_STEPS / timeSignature.subdivision;
}

function emptyCell(): BeatCell {
  return { baixo: null, meio: null, cima: null };
}

function scaleCellDuration(cell: BeatCell, factor: number): BeatCell {
  if (typeof cell.durationSteps !== "number") return { ...cell };
  return {
    ...cell,
    durationSteps: Math.max(1, Math.round(cell.durationSteps * factor)),
  };
}

export function expandCellsResolution(cells: BeatCell[], factor: number) {
  return cells.flatMap((cell) => [
    scaleCellDuration(cell, factor),
    ...Array.from({ length: Math.max(0, factor - 1) }, emptyCell),
  ]);
}

export function normalizeScoreResolution(score: Score): Score {
  const expectedSteps =
    score.measures *
    score.timeSignature.beats *
    stepsPerBeatForSignature(score.timeSignature);
  const legacySteps =
    score.measures *
    score.timeSignature.beats *
    (LEGACY_WHOLE_NOTE_STEPS / score.timeSignature.subdivision);

  let cells =
    score.cells.length === legacySteps
      ? expandCellsResolution(score.cells, 2)
      : [...score.cells];

  if (cells.length < expectedSteps) {
    cells = [
      ...cells,
      ...Array.from({ length: expectedSteps - cells.length }, emptyCell),
    ];
  } else if (cells.length > expectedSteps) {
    cells = cells.slice(0, expectedSteps);
  }

  cells = cells.map((cell, index) => {
    if (!cell.durationSteps || index + cell.durationSteps <= expectedSteps)
      return cell;
    return { ...cell, durationSteps: expectedSteps - index };
  });

  return { ...score, cells };
}
