export const LINE_Y = 132;
export const TOP_PAD = 52;
export const FIRST_SYSTEM_LEFT_PAD = 112;
export const SYSTEM_LEFT_PAD = 42;
export const DEFAULT_SLOT_W = 112;
export const MIN_SLOT_W = 72;
export const TARGET_STEP_GAP = 18;
export const BARLINE_NOTE_GAP = 30;
export const END_REPEAT_NOTE_GAP = 44;
export const RIGHT_PAD = 50;
export const HEIGHT = 214;
export const SYSTEM_GAP = 18;
export const TOP_MARGIN = 50;
export const MAX_MEASURES_PER_SYSTEM = 4;

export function computeMeasuresPerSystem(
  viewportWidth: number,
  beats: number,
  stepsPerBeat: number,
): number {
  if (viewportWidth <= 0) return MAX_MEASURES_PER_SYSTEM;
  const availableWidth = Math.max(
    0,
    viewportWidth - SYSTEM_LEFT_PAD - RIGHT_PAD,
  );
  const readableSlotW =
    BARLINE_NOTE_GAP * 2 + Math.max(1, stepsPerBeat - 1) * TARGET_STEP_GAP;
  for (let measures = MAX_MEASURES_PER_SYSTEM; measures > 1; measures--) {
    if (availableWidth / (beats * measures) >= readableSlotW) return measures;
  }
  return 1;
}

export function computeSlotW(
  viewportWidth: number,
  slotsPerSystem: number,
): number {
  if (slotsPerSystem <= 0 || viewportWidth <= 0) return DEFAULT_SLOT_W;
  const availableWidth = Math.max(
    MIN_SLOT_W * slotsPerSystem,
    viewportWidth - SYSTEM_LEFT_PAD - RIGHT_PAD,
  );
  return Math.max(MIN_SLOT_W, availableWidth / slotsPerSystem);
}

export function computeSvgHeight(totalSystems: number): number {
  return (
    totalSystems * HEIGHT +
    Math.max(0, totalSystems - 1) * SYSTEM_GAP +
    TOP_MARGIN
  );
}

export function computeSvgWidth(slotsPerSystem: number, slotW: number): number {
  return SYSTEM_LEFT_PAD + slotsPerSystem * slotW + RIGHT_PAD;
}

export function computeFirstSystemSvgWidth(
  slotsPerSystem: number,
  slotW: number,
): number {
  return FIRST_SYSTEM_LEFT_PAD + slotsPerSystem * slotW + RIGHT_PAD;
}
