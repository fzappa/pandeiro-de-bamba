import { scoreState } from "../state/score.svelte";
import { stepsPerBeatForSignature } from "../notation";
import type { StrokeType, BeatCell, VisualNote } from "../types";
import { noteY } from "../score-visual-helpers";

const LINE_Y = 132;

class NotationService {
  visualNotes = $derived.by(() => {
    const s = scoreState.value;
    if (!s) return [] as VisualNote[];

    const stepsPerBeat = stepsPerBeatForSignature(s.timeSignature);
    const notes: VisualNote[] = [];

    function hasVisibleContent(cell: BeatCell | undefined) {
      if (!cell) return false;
      const stroke = cell.cima || cell.meio || cell.baixo || null;
      return stroke !== null || cell.explicitRest === true;
    }

    function clampDurationToNextContent(start: number, duration: number) {
      const end = Math.min(s.cells.length, start + duration);
      for (let i = start + 1; i < end; i++) {
        if (hasVisibleContent(s.cells[i])) return i - start;
      }
      return duration;
    }

    function baseDurationFor(duration: number) {
      if ([3, 6, 12, 24, 48, 96].includes(duration)) {
        return { baseDuration: (duration / 3) * 2, isDotted: true };
      }
      return { baseDuration: duration, isDotted: false };
    }

    function notationSegmentDuration(maxDuration: number) {
      if (maxDuration === 15 || maxDuration === 14 || maxDuration === 13)
        return 12;
      if (maxDuration === 11 || maxDuration === 10 || maxDuration === 9)
        return 8;
      if (maxDuration === 7 || maxDuration === 5) return 4;
      const supportedDurations = [96, 64, 48, 32, 24, 16, 12, 8, 6, 4, 3, 2, 1];
      return (
        supportedDurations.find((duration) => duration <= maxDuration) ?? 1
      );
    }

    function pushVisualNote(
      step: number,
      stroke: StrokeType | null,
      duration: number,
      isExplicitRest: boolean,
      isAccented: boolean,
    ) {
      const stepsPerMeasure = stepsPerBeat * s.timeSignature.beats;
      let remaining = duration;
      let segmentStep = step;
      let segmentIndex = 0;

      while (remaining > 0) {
        const nextMeasureBoundary =
          Math.floor(segmentStep / stepsPerMeasure) * stepsPerMeasure +
          stepsPerMeasure;
        const maxSegmentDuration =
          stroke === null
            ? remaining
            : Math.min(remaining, nextMeasureBoundary - segmentStep);
        const segmentDuration =
          stroke === null
            ? remaining
            : notationSegmentDuration(maxSegmentDuration);
        const { baseDuration, isDotted } = baseDurationFor(segmentDuration);
        const hasNextTie = stroke !== null && segmentDuration < remaining;

        notes.push({
          step: segmentStep,
          stroke,
          duration: segmentDuration,
          baseDuration,
          isRest: stroke === null,
          isExplicitRest,
          isDotted,
          isAccented: stroke !== null && isAccented && segmentIndex === 0,
          tieFromPrevious: stroke !== null && segmentIndex > 0,
          tieToNext: hasNextTie,
          nextTieStep: hasNextTie ? segmentStep + segmentDuration : undefined,
          beamType: "none",
          beamY: 0,
        });

        remaining -= segmentDuration;
        segmentStep += segmentDuration;
        segmentIndex++;
      }
    }

    let step = 0;
    while (step < s.cells.length) {
      const cell = s.cells[step];
      const stroke = cell?.cima || cell?.meio || cell?.baixo || null;
      const isAccented = cell?.accented === true;
      const isExplicitRest =
        stroke === null &&
        (cell?.explicitRest === true ||
          (typeof cell?.durationSteps === "number" && cell.durationSteps > 1));
      let dur = Math.min(cell?.durationSteps || 1, s.cells.length - step);
      if (stroke !== null || isExplicitRest) {
        dur = clampDurationToNextContent(step, dur);
      }

      if (stroke === null && !isExplicitRest) {
        let restDur = 0;
        let limit = Math.min(
          s.cells.length,
          step + stepsPerBeat - (step % stepsPerBeat),
        );
        if (limit === step) limit = step + stepsPerBeat;
        for (let i = step; i < limit; i++) {
          const c = s.cells[i];
          const s_ = c?.cima || c?.meio || c?.baixo || null;
          const explicitRest =
            c?.explicitRest === true ||
            (s_ === null &&
              typeof c?.durationSteps === "number" &&
              c.durationSteps > 1);
          if (s_ !== null || explicitRest) break;
          restDur++;
        }
        if (restDur === 0) restDur = 1;
        dur = restDur;
      }

      pushVisualNote(step, stroke, dur, isExplicitRest, isAccented);
      step += dur;
    }

    // Beaming pass
    let currentBeamGroup: VisualNote[] = [];
    let prevBeat = -1;

    const flushBeams = () => {
      if (currentBeamGroup.length === 1) {
        currentBeamGroup[0].beamType = "none";
      } else if (currentBeamGroup.length > 1) {
        const beamY = Math.min(
          ...currentBeamGroup.map((n) => noteY(n.stroke!, LINE_Y) - 42),
        );
        for (let j = 0; j < currentBeamGroup.length; j++) {
          currentBeamGroup[j].beamType =
            j === 0
              ? "start"
              : j === currentBeamGroup.length - 1
                ? "end"
                : "continue";
          currentBeamGroup[j].beamY = beamY;
          if (j < currentBeamGroup.length - 1) {
            currentBeamGroup[j].nextBeamStep = currentBeamGroup[j + 1].step;
          }
        }
      }
      currentBeamGroup = [];
    };

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      const currentBeat = Math.floor(n.step / stepsPerBeat);
      if (currentBeat !== prevBeat) {
        flushBeams();
        prevBeat = currentBeat;
      }
      if (n.isRest || n.stroke === "R" || n.baseDuration > 8) {
        flushBeams();
        n.beamType = "none";
      } else {
        currentBeamGroup.push(n);
      }
    }
    flushBeams();

    return notes;
  });
}

export const notationService = new NotationService();
