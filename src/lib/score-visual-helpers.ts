import { STROKES } from "./types.ts";
import type { StrokeType } from "./types.ts";

export function generateWavyLine(
  startX: number,
  y: number,
  width: number,
): string {
  let d = `M ${startX} ${y}`;
  const p = 6;
  const h = 3;
  let currX = startX;
  let up = true;
  while (currX < startX + width) {
    const nextX = Math.min(currX + p, startX + width);
    const midX = currX + (nextX - currX) / 2;
    const cy = up ? y - h : y + h;
    d += ` Q ${midX} ${cy} ${nextX} ${y}`;
    currX = nextX;
    up = !up;
  }
  return d;
}

export function noteY(stroke: StrokeType, lineY: number) {
  const position = STROKES[stroke].position;
  if (position === "cima") return lineY - 24;
  if (position === "baixo") return lineY + 24;
  return lineY;
}

export function systemForSlot(slot: number, slotsPerSystem: number) {
  return Math.floor(slot / slotsPerSystem);
}

export function systemForStep(
  step: number,
  slotsPerSystem: number,
  stepsPerBeat: number,
) {
  return systemForSlot(Math.floor(step / stepsPerBeat), slotsPerSystem);
}

export function yOffsetForSystem(
  system: number,
  height: number,
  systemGap: number,
  topMargin: number,
) {
  return system * (height + systemGap) + topMargin;
}

export function yOffsetForSlot(
  slot: number,
  slotsPerSystem: number,
  height: number,
  systemGap: number,
  topMargin: number,
) {
  return yOffsetForSystem(
    systemForSlot(slot, slotsPerSystem),
    height,
    systemGap,
    topMargin,
  );
}

export function yOffsetForStep(
  step: number,
  slotsPerSystem: number,
  stepsPerBeat: number,
  height: number,
  systemGap: number,
  topMargin: number,
) {
  return yOffsetForSystem(
    systemForStep(step, slotsPerSystem, stepsPerBeat),
    height,
    systemGap,
    topMargin,
  );
}

export function noteYAt(
  stroke: StrokeType,
  step: number,
  slotsPerSystem: number,
  stepsPerBeat: number,
  height: number,
  systemGap: number,
  topMargin: number,
  lineY: number,
) {
  return (
    yOffsetForStep(
      step,
      slotsPerSystem,
      stepsPerBeat,
      height,
      systemGap,
      topMargin,
    ) + noteY(stroke, lineY)
  );
}

export function forwardBeamHookEndX(stemX: number, nextStemX: number) {
  const gap = Math.max(0, nextStemX - stemX);
  return stemX + Math.min(10, gap * 0.45);
}

export function backwardBeamHookEndX(stemX: number, previousStemX: number) {
  const gap = Math.max(0, stemX - previousStemX);
  return stemX - Math.min(10, gap * 0.45);
}

export function beamStartInsideStem(stemX: number) {
  return stemX + 1;
}

export function beamEndInsideStem(stemX: number) {
  return stemX - 1;
}

export function beamRectX(startX: number, endX: number) {
  return Math.min(startX, endX);
}

export function beamRectWidth(startX: number, endX: number) {
  return Math.abs(endX - startX);
}

export function systemLeftPadForSystem(
  system: number,
  firstSystemLeftPad: number,
  systemLeftPad: number,
) {
  return system === 0 ? firstSystemLeftPad : systemLeftPad;
}

export function systemLeftPadForSlot(
  slot: number,
  slotsPerSystem: number,
  firstSystemLeftPad: number,
  systemLeftPad: number,
) {
  return systemLeftPadForSystem(
    systemForSlot(slot, slotsPerSystem),
    firstSystemLeftPad,
    systemLeftPad,
  );
}

export function slotX(
  slot: number,
  slotsPerSystem: number,
  slotW: number,
  barlineNoteGap: number,
  firstSystemLeftPad: number,
  systemLeftPad: number,
) {
  return (
    systemLeftPadForSlot(
      slot,
      slotsPerSystem,
      firstSystemLeftPad,
      systemLeftPad,
    ) +
    (slot % slotsPerSystem) * slotW +
    barlineNoteGap
  );
}

export function xForStep(
  step: number,
  stepsPerBeat: number,
  slotsPerSystem: number,
  slotW: number,
  barlineNoteGap: number,
  totalSlots: number,
  endRepeatNoteGap: number,
  firstSystemLeftPad: number,
  systemLeftPad: number,
) {
  const slot = Math.floor(step / stepsPerBeat);
  const stepInSlot = step % stepsPerBeat;
  const slotStart =
    systemLeftPadForSlot(
      slot,
      slotsPerSystem,
      firstSystemLeftPad,
      systemLeftPad,
    ) +
    (slot % slotsPerSystem) * slotW;
  const firstStepX = slotStart + barlineNoteGap;
  if (stepsPerBeat <= 1) return firstStepX;

  const endGap = slot === totalSlots - 1 ? endRepeatNoteGap : barlineNoteGap;
  const usableWidth = Math.max(0, slotW - barlineNoteGap - endGap);
  const offset = (stepInSlot / (stepsPerBeat - 1)) * usableWidth;
  return firstStepX + offset;
}

export function systemWidthForSystem(
  system: number,
  firstSystemSvgWidth: number,
  svgWidth: number,
) {
  return system === 0 ? firstSystemSvgWidth : svgWidth;
}
