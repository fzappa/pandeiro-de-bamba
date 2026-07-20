import { scoreState } from "./score.svelte";
import { stepsPerBeatForSignature } from "../notation";
import type { StrokeType } from "../types";
import {
  getCtx,
  unlockAudio,
  preloadStrokeSamples,
  beep,
  playCellSounds,
} from "../audio/engine";
import { computePlaybackSteps } from "../playback-domain";

type ActiveStrokeWindow = {
  strokes: Set<StrokeType>;
  startTime: number;
  endTime: number;
  generation: number;
  accented: boolean;
};

class PlaybackState {
  isPlaying = $state(false);
  currentStep = $state(-1);
  schedulerStrokes = $state<Set<StrokeType>>(new Set());
  manualStrokes = $state<StrokeType[]>([]);
  activeStrokes = $derived.by(() => {
    const combined = new Set<StrokeType>(this.schedulerStrokes);
    for (const s of this.manualStrokes) combined.add(s);
    return combined;
  });
  isAccented = $state(false);
  isMetronomeMuted = $state(false);

  // Configurações de notação (migradas do store)
  notationDuration = $state(16);
  notationMuted = $state(false);
  notationRestMode = $state(false);
  notationAccented = $state(false);
  notationDotted = $state(false);

  private schedulerId: number | null = null;
  private nextStepTime = 0;
  private step = 0;
  private activeStrokesGeneration = 0;
  private activeStrokeWindows: ActiveStrokeWindow[] = [];

  constructor() {}

  async start(startStep?: number) {
    const ctx = await unlockAudio();
    const totalSteps = computePlaybackSteps(scoreState.value);
    preloadStrokeSamples(ctx);

    if (this.schedulerId !== null) cancelAnimationFrame(this.schedulerId);

    this.activeStrokesGeneration++;
    this.clearActiveStrokeWindows();

    this.step =
      startStep !== undefined
        ? Math.max(0, Math.min(startStep, totalSteps - 1))
        : this.currentStep >= 0
          ? Math.min(this.currentStep, totalSteps - 1)
          : 0;

    this.nextStepTime = ctx.currentTime + 0.05;
    this.isPlaying = true;
    this.runScheduler();
  }

  pause() {
    if (this.schedulerId !== null) {
      cancelAnimationFrame(this.schedulerId);
      this.schedulerId = null;
    }
    this.isPlaying = false;
    this.activeStrokesGeneration++;
    this.clearActiveStrokeWindows();
  }

  stop() {
    this.pause();
    this.currentStep = -1;
    this.step = 0;
  }

  /**
   * Destaca um stroke manualmente por um curto período (ex: ao clicar na partitura)
   */
  flashStroke(stroke: StrokeType, duration = 600) {
    this.manualStrokes.push(stroke);
    setTimeout(() => {
      this.manualStrokes = this.manualStrokes.filter((s) => s !== stroke);
    }, duration);
  }

  private runScheduler() {
    const ctx = getCtx();
    const lookahead = 0.1;

    const tick = () => {
      while (this.nextStepTime < ctx.currentTime + lookahead) {
        const currentScore = scoreState.value;
        const stepsPerBeat = stepsPerBeatForSignature(
          currentScore.timeSignature,
        );
        const totalSteps = computePlaybackSteps(currentScore);
        const secPerStep = 60 / currentScore.bpm / stepsPerBeat;

        if (this.step >= totalSteps) this.step = 0;

        const thisStep = this.step;
        const thisTime = this.nextStepTime;
        const cell = currentScore.cells[thisStep];

        // Gerenciar strokes ativos para o PandeiroView
        const active = new Set<StrokeType>();
        if (cell?.baixo) active.add(cell.baixo);
        if (cell?.meio) active.add(cell.meio);
        if (cell?.cima) active.add(cell.cima);

        const generation = this.activeStrokesGeneration;
        if (active.size > 0) {
          const durationSteps = Math.max(1, cell?.durationSteps ?? 1);
          this.activeStrokeWindows.push({
            strokes: active,
            startTime: thisTime,
            endTime: thisTime + durationSteps * secPerStep,
            generation,
            accented: !!cell?.accented,
          });
        }

        // Agendar atualização do cursor visual
        setTimeout(
          () => {
            if (generation === this.activeStrokesGeneration) {
              this.currentStep = thisStep;
            }
          },
          (thisTime - ctx.currentTime) * 1000,
        );

        // Metrônomo
        if (thisStep % stepsPerBeat === 0) {
          if (!this.isMetronomeMuted) {
            beep(ctx, thisTime, 900, 0.08, 0.2);
          }
        }

        // Sons do pandeiro
        if (cell) playCellSounds(ctx, cell, thisTime);

        this.step = (this.step + 1) % totalSteps;
        this.nextStepTime += secPerStep;
      }

      this.syncActiveStrokes(ctx);
      this.schedulerId = requestAnimationFrame(tick);
    };
    tick();
  }

  private syncActiveStrokes(ctx: AudioContext) {
    const now = ctx.currentTime;
    const active = new Set<StrokeType>();

    this.activeStrokeWindows = this.activeStrokeWindows.filter(
      (w) => w.generation === this.activeStrokesGeneration && w.endTime > now,
    );

    let activeAccented = false;
    for (const w of this.activeStrokeWindows) {
      if (w.startTime <= now && now < w.endTime) {
        for (const s of w.strokes) active.add(s);
        if (w.accented) activeAccented = true;
      }
    }
    this.schedulerStrokes = active;
    this.isAccented = activeAccented;
  }

  private clearActiveStrokeWindows() {
    this.activeStrokeWindows = [];
    this.schedulerStrokes = new Set();
    this.isAccented = false;
  }
}

export const playbackState = new PlaybackState();
