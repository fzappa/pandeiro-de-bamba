import type { StrokeType, BeatCell } from "../types";

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let audioUnlock: Promise<AudioContext> | null = null;

// D shares P's sample and Dm shares Pm's sample intentionally: the grave and
// polegar strokes are acoustically equivalent on the pandeiro.
const STROKE_SAMPLE_PATHS: Record<StrokeType, string> = {
  P: "/sounds/pandeiro/P.wav",
  P_mut: "/sounds/pandeiro/P_mut.wav",
  Pm: "/sounds/pandeiro/Pm.wav",
  D: "/sounds/pandeiro/P.wav",
  D_mut: "/sounds/pandeiro/D_mut.wav",
  Dm: "/sounds/pandeiro/Pm.wav",
  T: "/sounds/pandeiro/T.wav",
  H: "/sounds/pandeiro/H.wav",
  F: "/sounds/pandeiro/F.wav",
  R: "/sounds/pandeiro/R.wav",
};

const sampleBuffers = new Map<StrokeType, AudioBuffer>();
const missingSamples = new Set<StrokeType>();
const sampleLoads = new Map<StrokeType, Promise<AudioBuffer | null>>();

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function getCtx(): AudioContext {
  if (!audioCtx) {
    const AudioContextConstructor =
      window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    audioCtx = new AudioContextConstructor();
  }
  return audioCtx;
}

export function unlockAudio(): Promise<AudioContext> {
  if (audioUnlock) return audioUnlock;

  audioUnlock = (async () => {
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();

    const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = silent;
    gain.gain.value = 0;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(0);

    return ctx;
  })().catch((error) => {
    audioUnlock = null;
    throw error;
  });

  return audioUnlock;
}

export function loadStrokeSample(
  ctx: AudioContext,
  stroke: StrokeType,
): Promise<AudioBuffer | null> {
  const cached = sampleBuffers.get(stroke);
  if (cached) return Promise.resolve(cached);
  if (missingSamples.has(stroke)) return Promise.resolve(null);

  const pending = sampleLoads.get(stroke);
  if (pending) return pending;

  const load = fetch(STROKE_SAMPLE_PATHS[stroke])
    .then((response) => {
      if (!response.ok)
        throw new Error(`Sample not found: ${STROKE_SAMPLE_PATHS[stroke]}`);
      return response.arrayBuffer();
    })
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      sampleBuffers.set(stroke, buffer);
      return buffer;
    })
    .catch(() => {
      missingSamples.add(stroke);
      return null;
    })
    .finally(() => sampleLoads.delete(stroke));

  sampleLoads.set(stroke, load);
  return load;
}

export function preloadStrokeSamples(ctx: AudioContext) {
  for (const stroke of Object.keys(STROKE_SAMPLE_PATHS) as StrokeType[]) {
    void loadStrokeSample(ctx, stroke);
  }
}

export function beep(
  ctx: AudioContext,
  time: number,
  freq: number,
  dur: number,
  vol = 0.25,
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = "sine";
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.start(time);
  osc.stop(time + dur);
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(ctx.sampleRate * 0.25);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

function playTone(
  ctx: AudioContext,
  time: number,
  freq: number,
  dur: number,
  vol: number,
  type: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + dur);
}

function playNoise(
  ctx: AudioContext,
  time: number,
  dur: number,
  vol: number,
  hp = 1200,
  lp = 9000,
) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = "highpass";
  hpFilter.frequency.setValueAtTime(hp, time);
  const lpFilter = ctx.createBiquadFilter();
  lpFilter.type = "lowpass";
  lpFilter.frequency.setValueAtTime(lp, time);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  src.connect(hpFilter);
  hpFilter.connect(lpFilter);
  lpFilter.connect(gain);
  gain.connect(ctx.destination);
  src.start(time);
  src.stop(time + dur);
}

export function playSample(
  ctx: AudioContext,
  buffer: AudioBuffer,
  time: number,
  preview: boolean,
) {
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  const v = preview ? 0.85 : 1;
  gain.gain.setValueAtTime(v, time);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(time);
}

export function playSyntheticStrokeSound(
  ctx: AudioContext,
  stroke: StrokeType,
  time: number,
  preview = false,
  accented = false,
) {
  const accentMod = accented ? 1.45 : 1.0;
  const v = (preview ? 0.75 : 1) * accentMod;
  switch (stroke) {
    case "P":
      playTone(ctx, time, 120, 0.11, 0.35 * v, "triangle");
      playTone(ctx, time, 220, 0.06, 0.08 * v, "sine");
      break;
    case "P_mut":
      playTone(ctx, time, 115, 0.05, 0.22 * v, "triangle");
      break;
    case "D":
      playTone(ctx, time, 170, 0.09, 0.28 * v, "triangle");
      playTone(ctx, time, 330, 0.05, 0.07 * v, "sine");
      break;
    case "D_mut":
      playTone(ctx, time, 165, 0.04, 0.2 * v, "triangle");
      break;
    case "Pm":
    case "Dm":
      playTone(ctx, time, stroke === "Pm" ? 250 : 300, 0.06, 0.14 * v, "sine");
      playNoise(ctx, time, 0.035, 0.04 * v, 1800, 6500);
      break;
    case "T":
      playNoise(ctx, time, 0.07, 0.23 * v, 1500, 9500);
      playTone(ctx, time, 420, 0.035, 0.06 * v, "square");
      break;
    case "H":
      playNoise(ctx, time, 0.03, 0.12 * v, 2400, 8500);
      break;
    case "F":
      playNoise(ctx, time, 0.045, 0.16 * v, 2200, 9000);
      break;
    case "R": {
      const dt = 0.025;
      playNoise(ctx, time, 0.03, 0.12 * v, 2300, 9200);
      playNoise(ctx, time + dt, 0.03, 0.1 * v, 2300, 9200);
      playNoise(ctx, time + dt * 2, 0.03, 0.08 * v, 2300, 9200);
      break;
    }
  }
}

export function playStrokeSound(
  ctx: AudioContext,
  stroke: StrokeType,
  time: number,
  preview = false,
  accented = false,
) {
  const sample = sampleBuffers.get(stroke);
  if (sample) {
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = sample;
    const accentMod = accented ? 1.45 : 1.0;
    const v = (preview ? 0.85 : 1) * accentMod;
    gain.gain.setValueAtTime(v, time);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(time);
    return;
  }

  void loadStrokeSample(ctx, stroke);
  playSyntheticStrokeSound(ctx, stroke, time, preview, accented);
}

export function playCellSounds(
  ctx: AudioContext,
  cell: BeatCell,
  time: number,
) {
  const acc = !!cell.accented;
  if (cell.baixo) playStrokeSound(ctx, cell.baixo, time, false, acc);
  if (cell.meio) playStrokeSound(ctx, cell.meio, time + 0.004, false, acc);
  if (cell.cima) playStrokeSound(ctx, cell.cima, time + 0.007, false, acc);
}
