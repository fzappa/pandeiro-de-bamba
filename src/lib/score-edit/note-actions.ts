import type { StrokeType, VisualNote } from "../types";
import { scoreState } from "../state/score.svelte";
import { playbackState } from "../state/playback.svelte";
import { editorState } from "../state/editor.svelte";
import { notationService } from "../services/notation.svelte";

export function noteAtCursor(): VisualNote | undefined {
  return notationService.visualNotes.find(
    (note) =>
      scoreState.cursor >= note.step &&
      scoreState.cursor < note.step + note.duration,
  );
}

export function sourceStepFor(note: VisualNote): number {
  if (!scoreState.value || note.stroke === null) return note.step;
  const cursorStep = note.step;
  for (let step = cursorStep; step >= 0; step--) {
    const cell = scoreState.value.cells[step];
    const stroke = cell?.cima || cell?.meio || cell?.baixo || null;
    const duration = cell?.durationSteps ?? 1;
    if (stroke === note.stroke && step + duration > cursorStep) return step;
  }
  return note.step;
}

export function selectedWriteTarget() {
  if (!scoreState.value) return null;
  const note = noteAtCursor();
  if (!note || (note.isRest && !note.isExplicitRest)) return null;
  const step = sourceStepFor(note);
  const cell = scoreState.value.cells[step];
  const stroke = cell?.cima || cell?.meio || cell?.baixo || null;
  return {
    step,
    stroke,
    duration: Math.max(1, cell?.durationSteps ?? note.duration),
  };
}

export function selectedPlaybackStep(): number {
  const note = noteAtCursor();
  if (!note || (note.isRest && !note.isExplicitRest)) return scoreState.cursor;
  return sourceStepFor(note);
}

export function selectNote(note: VisualNote) {
  const step = sourceStepFor(note);
  scoreState.cursor = step;
  playbackState.notationAccented = note.stroke
    ? scoreState.value?.cells[step]?.accented === true
    : false;
  if (note.stroke) {
    editorState.setLibraryStatus(`Nota: ${note.stroke}`);
    scoreState.previewStroke(note.stroke);
    playbackState.flashStroke(note.stroke);
  }
}

export function moveCursorToNote(direction: -1 | 1) {
  if (!scoreState.value || notationService.visualNotes.length === 0) return;
  const currentIndex = notationService.visualNotes.findIndex(
    (note) =>
      scoreState.cursor >= note.step &&
      scoreState.cursor < note.step + note.duration,
  );
  let fallbackIndex = -1;
  if (direction > 0) {
    fallbackIndex = notationService.visualNotes.findIndex(
      (note) => note.step > scoreState.cursor,
    );
  } else {
    for (let i = notationService.visualNotes.length - 1; i >= 0; i--) {
      if (notationService.visualNotes[i].step < scoreState.cursor) {
        fallbackIndex = i;
        break;
      }
    }
  }
  const baseIndex = currentIndex >= 0 ? currentIndex : fallbackIndex;
  const nextIndex =
    baseIndex >= 0
      ? Math.max(
          0,
          Math.min(
            notationService.visualNotes.length - 1,
            baseIndex + direction,
          ),
        )
      : direction > 0
        ? 0
        : notationService.visualNotes.length - 1;
  selectNote(notationService.visualNotes[nextIndex]);
}

function effectiveStroke(stroke: StrokeType): StrokeType {
  if (stroke === "P" && playbackState.notationMuted) return "P_mut";
  if (stroke === "D" && playbackState.notationMuted) return "D_mut";
  return stroke;
}

export function writeSelected() {
  const actualStroke = effectiveStroke(editorState.selectedStroke);

  scoreState.insertNote(
    scoreState.cursor,
    playbackState.notationRestMode ? null : actualStroke,
    playbackState.notationDuration,
    playbackState.notationAccented,
  );
  if (!playbackState.notationRestMode) {
    playbackState.flashStroke(actualStroke);
  }
  scoreState.cursor += playbackState.notationDuration;
}

export function writeOnEmptyOrSelect(note: VisualNote) {
  if (note.isRest && !note.isExplicitRest) {
    const actualStroke = effectiveStroke(editorState.selectedStroke);

    scoreState.insertNote(
      note.step,
      playbackState.notationRestMode ? null : actualStroke,
      playbackState.notationDuration,
      playbackState.notationAccented,
    );
    if (!playbackState.notationRestMode) {
      playbackState.flashStroke(actualStroke);
    }
    scoreState.cursor = note.step + playbackState.notationDuration;
    return;
  }
  selectNote(note);
}

export function insertRestAtCursor() {
  scoreState.insertNote(
    scoreState.cursor,
    null,
    playbackState.notationDuration,
  );
  scoreState.cursor += playbackState.notationDuration;
}

export function replaceSelectedWithRest(duration?: number): boolean {
  if (!scoreState.value) return false;
  const target = selectedWriteTarget();
  if (!target) return false;
  scoreState.insertNote(target.step, null, duration ?? target.duration);
  scoreState.cursor = target.step;
  return true;
}

export function removeSelected() {
  if (!scoreState.value) return;
  const note = noteAtCursor();
  if (note && (!note.isRest || note.isExplicitRest)) {
    scoreState.clearCell(sourceStepFor(note));
    return;
  }
  scoreState.clearCell(scoreState.cursor);
}

export function toggleAccent() {
  playbackState.notationAccented = !playbackState.notationAccented;
  const target = selectedWriteTarget();
  if (target?.stroke) {
    scoreState.setAccent(target.step, playbackState.notationAccented);
  }
}

export function togglePlayback() {
  if (playbackState.isPlaying) {
    playbackState.pause();
    return;
  }
  playbackState.start(selectedPlaybackStep());
}
