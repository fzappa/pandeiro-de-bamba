import type { StrokeType } from "../types";
import { scoreState } from "../state/score.svelte";
import { playbackState } from "../state/playback.svelte";
import { editorState } from "../state/editor.svelte";
import {
  insertRestAtCursor,
  moveCursorToNote,
  removeSelected,
  toggleAccent,
  togglePlayback,
  writeSelected,
} from "./note-actions";

export const STROKE_ORDER: StrokeType[] = [
  "P",
  "Pm",
  "D",
  "Dm",
  "T",
  "H",
  "F",
  "R",
];

export type DurationOption = {
  value: number;
  noteTitle: string;
  restTitle: string;
};

export const DURATION_OPTIONS: DurationOption[] = [
  { value: 64, noteTitle: "Semibreve", restTitle: "Pausa Semibreve" },
  { value: 32, noteTitle: "Mínima", restTitle: "Pausa Mínima" },
  { value: 16, noteTitle: "Semínima", restTitle: "Pausa Semínima" },
  { value: 8, noteTitle: "Colcheia", restTitle: "Pausa Colcheia" },
  { value: 4, noteTitle: "Semicolcheia", restTitle: "Pausa Semicolcheia" },
  { value: 2, noteTitle: "Fusa", restTitle: "Pausa Fusa" },
  { value: 1, noteTitle: "Semifusa", restTitle: "Pausa Semifusa" },
];

function isEditingControl(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return (
    target.closest(
      'input, textarea, select, button, a, [contenteditable="true"]',
    ) !== null ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function handleScoreKeydown(e: KeyboardEvent) {
  if (isEditingControl(e.target)) return;
  if (!scoreState.value) return;
  const shortcutIndex = Number(e.key) - 1;
  if (shortcutIndex >= 0 && shortcutIndex < STROKE_ORDER.length) {
    e.preventDefault();
    editorState.selectedStroke = STROKE_ORDER[shortcutIndex];
    if (!["P", "D"].includes(editorState.selectedStroke))
      playbackState.notationMuted = false;
    playbackState.notationRestMode = false;
    writeSelected();
  } else if (e.key.toLowerCase() === "r" || e.key === "0") {
    e.preventDefault();
    insertRestAtCursor();
  } else if (e.key === " ") {
    e.preventDefault();
    togglePlayback();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    moveCursorToNote(-1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    moveCursorToNote(1);
  } else if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    removeSelected();
  } else if (e.key === "Enter") {
    e.preventDefault();
    writeSelected();
  } else if (e.key === ">") {
    e.preventDefault();
    toggleAccent();
  } else if (e.key === ".") {
    e.preventDefault();
    playbackState.notationDotted = !playbackState.notationDotted;
  } else if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault();
    scoreState.undo();
  } else if (
    (e.key === "y" && (e.ctrlKey || e.metaKey)) ||
    (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)
  ) {
    e.preventDefault();
    scoreState.redo();
  }
}
