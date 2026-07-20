import type { Score, BeatCell, StrokeType, GenrePreset } from "../types";
import { CURRENT_INSTRUMENT, STROKES } from "../types";
import { GENRE_PRESETS, MAX_BPM, MAX_MEASURES, MIN_BPM } from "../presets";
import {
  expandCellsResolution,
  normalizeScoreResolution,
  PRESET_SOURCE_STEPS_PER_WHOLE,
  stepsPerBeatForSignature,
  WHOLE_NOTE_STEPS,
} from "../notation";
import { unlockAudio, playStrokeSound } from "../audio/engine";

function applyPreset(preset: GenrePreset): Score {
  const expansionFactor = WHOLE_NOTE_STEPS / PRESET_SOURCE_STEPS_PER_WHOLE;
  const expandedCells = expandCellsResolution(preset.cells, expansionFactor);
  return {
    title: preset.name,
    instrument: CURRENT_INSTRUMENT,
    genre: preset.name,
    bpm: preset.bpm,
    timeSignature: preset.timeSignature,
    measures: preset.measures,
    cells: expandedCells,
    accents: [...preset.accents],
  };
}

const emptyCell = (): BeatCell => ({ baixo: null, meio: null, cima: null });

const MAX_HISTORY = 50;

class ScoreState {
  value = $state<Score>(applyPreset(GENRE_PRESETS[0]));
  cursor = $state(0);
  canUndo = $state(false);
  canRedo = $state(false);

  private _history: Score[] = [];
  private _redoStack: Score[] = [];

  private snapshot() {
    const s = this.value;
    this._history.push({
      ...s,
      timeSignature: { ...s.timeSignature },
      cells: s.cells.map((c) => ({ ...c })),
      accents: [...s.accents],
    });
    if (this._history.length > MAX_HISTORY) this._history.shift();
    this._redoStack = [];
    this.canUndo = true;
    this.canRedo = false;
  }

  undo() {
    const prev = this._history.pop();
    if (!prev) return;
    const s = this.value;
    this._redoStack.push({
      ...s,
      timeSignature: { ...s.timeSignature },
      cells: s.cells.map((c) => ({ ...c })),
      accents: [...s.accents],
    });
    this.value = prev;
    this.cursor = Math.min(this.cursor, prev.cells.length - 1);
    this.canUndo = this._history.length > 0;
    this.canRedo = true;
  }

  redo() {
    const next = this._redoStack.pop();
    if (!next) return;
    const s = this.value;
    this._history.push({
      ...s,
      timeSignature: { ...s.timeSignature },
      cells: s.cells.map((c) => ({ ...c })),
      accents: [...s.accents],
    });
    this.value = next;
    this.cursor = Math.min(this.cursor, next.cells.length - 1);
    this.canUndo = true;
    this.canRedo = this._redoStack.length > 0;
  }

  private clearHistory() {
    this._history = [];
    this._redoStack = [];
    this.canUndo = false;
    this.canRedo = false;
  }

  loadPreset(preset: GenrePreset) {
    const next = this.normalizeVisibleBeats(applyPreset(preset));
    this.value = next;
    this.cursor = 0;
    this.clearHistory();
  }

  loadScore(nextScore: Score) {
    const normalizedScore = normalizeScoreResolution(nextScore);
    this.value = {
      ...normalizedScore,
      timeSignature: { ...normalizedScore.timeSignature },
      cells: normalizedScore.cells.map((cell) => ({ ...cell })),
      accents: [...normalizedScore.accents],
    };
    this.cursor = 0;
    this.clearHistory();
  }

  private normalizeVisibleBeats(s: Score): Score {
    const stepsPerBeat = stepsPerBeatForSignature(s.timeSignature);
    let nextScore: Score = {
      ...s,
      cells: Array.from({ length: s.cells.length }, emptyCell),
    };
    const totalSlots = s.measures * s.timeSignature.beats;

    for (let slot = 0; slot < totalSlots; slot++) {
      const step = slot * stepsPerBeat;
      const cell = s.cells[step];
      const stroke = cell?.cima || cell?.meio || cell?.baixo || null;
      if (stroke) {
        nextScore = this.writeNoteAt(nextScore, step, stroke, stepsPerBeat);
      }
    }

    return nextScore;
  }

  private writeNoteAt(
    s: Score,
    ci: number,
    stroke: StrokeType | null,
    duration = 4,
    accented = false,
  ): Score {
    const cells = [...s.cells];
    const start = Math.max(0, Math.min(s.cells.length - 1, ci));
    const safeDuration = Math.max(1, Math.min(duration, cells.length - start));

    for (let i = start - 1; i >= 0; i--) {
      const previous = cells[i];
      const previousDuration = previous?.durationSteps ?? 1;
      if (i + previousDuration <= start) break;
      cells[i] = { ...previous, durationSteps: start - i };
      break;
    }

    for (let i = 1; i < safeDuration; i++) {
      if (start + i < cells.length) {
        cells[start + i] = emptyCell();
      }
    }

    if (stroke === null) {
      cells[start] = {
        baixo: null,
        meio: null,
        cima: null,
        durationSteps: safeDuration,
        explicitRest: true,
      };
    } else {
      const cell = {
        baixo: null,
        meio: null,
        cima: null,
        durationSteps: safeDuration,
      } as BeatCell;
      const pos = STROKES[stroke].position;
      if (pos === "baixo") cell.baixo = stroke;
      if (pos === "meio") cell.meio = stroke;
      if (pos === "cima") cell.cima = stroke;
      if (accented) cell.accented = true;
      cells[start] = cell;
    }

    return { ...s, cells };
  }

  setBpm(bpm: number) {
    this.value.bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
  }

  setTitle(title: string) {
    this.value.title = title.trimStart().slice(0, 80);
  }

  setSubtitle(subtitle: string) {
    this.value.subtitle = subtitle.trimStart().slice(0, 80) || undefined;
  }

  setAuthor(author: string) {
    this.value.author = author.trimStart().slice(0, 80) || undefined;
  }

  setGenre(genre: string) {
    this.value.genre = genre.trimStart().slice(0, 40);
  }

  previewStroke(stroke: StrokeType) {
    void unlockAudio().then((ctx) =>
      playStrokeSound(ctx, stroke, ctx.currentTime, true),
    );
    // A visualização ativa será tratada pelo playbackState
  }

  setMeasures(m: number) {
    this.snapshot();
    const measures = Math.max(1, Math.min(MAX_MEASURES, m));
    const stepsPerBeat = stepsPerBeatForSignature(this.value.timeSignature);
    const totalSteps = measures * this.value.timeSignature.beats * stepsPerBeat;
    let cells = [...this.value.cells];

    if (totalSteps > cells.length) {
      const empty = Array.from(
        { length: totalSteps - cells.length },
        emptyCell,
      );
      cells = [...cells, ...empty];
    } else if (totalSteps < cells.length) {
      cells = cells.slice(0, totalSteps);
    }
    cells = cells.map((cell, index) => {
      if (!cell.durationSteps || index + cell.durationSteps <= totalSteps)
        return cell;
      return { ...cell, durationSteps: totalSteps - index };
    });

    this.value.measures = measures;
    this.value.cells = cells;
    this.cursor = Math.max(
      0,
      Math.min(this.value.cells.length - 1, this.cursor),
    );
  }

  setTimeSignature(beats: number, subdivision: number) {
    this.snapshot();
    const nextBeats = Math.max(1, Math.min(16, Math.round(beats)));
    const nextSubdivision = [2, 4, 8, 16].includes(subdivision)
      ? subdivision
      : 4;
    const oldStepsPerBeat = stepsPerBeatForSignature(this.value.timeSignature);
    const nextStepsPerBeat = WHOLE_NOTE_STEPS / nextSubdivision;
    const oldSlots = this.value.measures * this.value.timeSignature.beats;
    const nextSlots = this.value.measures * nextBeats;
    const nextCells = Array.from(
      { length: nextSlots * nextStepsPerBeat },
      emptyCell,
    );

    let nextScore: Score = {
      ...this.value,
      timeSignature: { beats: nextBeats, subdivision: nextSubdivision },
      cells: nextCells,
    };

    for (let slot = 0; slot < Math.min(oldSlots, nextSlots); slot++) {
      const oldCell = this.value.cells[slot * oldStepsPerBeat];
      const stroke = oldCell?.cima || oldCell?.meio || oldCell?.baixo || null;
      if (stroke) {
        nextScore = this.writeNoteAt(
          nextScore,
          slot * nextStepsPerBeat,
          stroke,
          nextStepsPerBeat,
        );
      }
    }

    this.value = nextScore;
    this.cursor =
      Math.floor(
        Math.max(0, Math.min(this.value.cells.length - 1, this.cursor)) /
          nextStepsPerBeat,
      ) * nextStepsPerBeat;
  }

  private writeNoteNoSnapshot(
    ci: number,
    stroke: StrokeType | null,
    duration: number,
    accented = false,
  ) {
    if (ci >= this.value.cells.length) return;
    if (stroke) this.previewStroke(stroke);
    this.value = this.writeNoteAt(this.value, ci, stroke, duration, accented);
  }

  insertNote(
    ci: number,
    stroke: StrokeType | null,
    duration: number,
    accented = false,
  ) {
    this.snapshot();
    this.writeNoteNoSnapshot(ci, stroke, duration, accented);
  }

  setAccent(ci: number, accented: boolean) {
    if (ci < 0 || ci >= this.value.cells.length) return;
    const cell = this.value.cells[ci];
    const stroke = cell?.cima || cell?.meio || cell?.baixo || null;
    if (!stroke) return;
    this.snapshot();
    this.value.cells[ci] = { ...cell, accented: accented || undefined };
  }

  insertStrokeAtCursor(stroke: StrokeType, duration: number, accented = false) {
    const cursor = Math.max(
      0,
      Math.min(this.value.cells.length - 1, this.cursor),
    );
    const safeDuration = Math.max(1, Math.round(duration));
    const isLastStep = cursor >= this.value.cells.length - 1;

    this.snapshot();

    if (isLastStep && this.value.measures < MAX_MEASURES) {
      const stepsPerBeat = stepsPerBeatForSignature(this.value.timeSignature);
      const stepsToAdd = this.value.timeSignature.beats * stepsPerBeat;
      const empty = Array.from({ length: stepsToAdd }, emptyCell);
      this.value.measures += 1;
      this.value.cells = [...this.value.cells, ...empty];
    }

    this.writeNoteNoSnapshot(cursor, stroke, safeDuration, accented);
    this.cursor = Math.max(
      0,
      Math.min(this.value.cells.length - 1, cursor + safeDuration),
    );
  }

  clearCell(ci: number) {
    if (ci >= 0 && ci < this.value.cells.length) {
      this.snapshot();
      this.value.cells[ci] = emptyCell();
    }
  }

  clearAll() {
    this.snapshot();
    this.value.cells = Array.from(
      { length: this.value.cells.length },
      emptyCell,
    );
    this.cursor = 0;
  }
}

export const scoreState = new ScoreState();
