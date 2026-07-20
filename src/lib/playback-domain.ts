import { stepsPerBeatForSignature } from "./notation.ts";
import type { Score } from "./types.ts";

export function computePlaybackSteps(s: Score) {
  const gridSteps =
    s.measures *
    s.timeSignature.beats *
    stepsPerBeatForSignature(s.timeSignature);
  let lastContentEnd = 0;

  for (let i = 0; i < Math.min(s.cells.length, gridSteps); i++) {
    const cell = s.cells[i];
    if (cell.baixo || cell.meio || cell.cima || cell.explicitRest) {
      const duration = Math.max(1, cell.durationSteps ?? 1);
      lastContentEnd = Math.max(lastContentEnd, i + duration);
    }
  }

  return Math.max(1, Math.min(gridSteps, lastContentEnd || gridSteps));
}
