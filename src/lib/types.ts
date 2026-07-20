export type StrokeType =
  "P" | "Pm" | "D" | "Dm" | "T" | "H" | "F" | "P_mut" | "D_mut" | "R";
export type NotePosition = "baixo" | "meio" | "cima";
export type NoteheadShape = "filled" | "x" | "headless" | "ghost" | "none";

export type BeamType = "none" | "start" | "continue" | "end";

export type VisualNote = {
  step: number;
  stroke: StrokeType | null;
  duration: number;
  baseDuration: number;
  isRest: boolean;
  isExplicitRest: boolean;
  isDotted: boolean;
  isAccented: boolean;
  tieFromPrevious: boolean;
  tieToNext: boolean;
  nextTieStep?: number;
  beamType: BeamType;
  beamY: number;
  nextBeamStep?: number;
};

export const CURRENT_INSTRUMENT = "pandeiro";

export interface StrokeInfo {
  type: StrokeType;
  label: string;
  description: string;
  position: NotePosition;
  notehead: NoteheadShape;
  color: string;
  pandeiroRegion:
    | "thumb-skin"
    | "upper-skin"
    | "center-dot"
    | "full-skin"
    | "bottom-rim"
    | "top-rim";
}

export const STROKES: Record<StrokeType, StrokeInfo> = {
  P: {
    type: "P",
    label: "P",
    description: "Polegar",
    position: "baixo",
    notehead: "filled",
    color: "#ef476f",
    pandeiroRegion: "thumb-skin",
  },
  H: {
    type: "H",
    label: "H",
    description: "Heel (Pulso)",
    position: "baixo",
    notehead: "headless",
    color: "#f8961e",
    pandeiroRegion: "bottom-rim",
  },
  Pm: {
    type: "Pm",
    label: "Pm",
    description: "Polegar no meio",
    position: "meio",
    notehead: "ghost",
    color: "#9b5de5",
    pandeiroRegion: "center-dot",
  },
  Dm: {
    type: "Dm",
    label: "Dm",
    description: "Dedos no meio",
    position: "meio",
    notehead: "ghost",
    color: "#00bbf9",
    pandeiroRegion: "center-dot",
  },
  T: {
    type: "T",
    label: "T",
    description: "Tapa",
    position: "meio",
    notehead: "x",
    color: "#06d6a0",
    pandeiroRegion: "full-skin",
  },
  D: {
    type: "D",
    label: "D",
    description: "Grave (ponta dedos)",
    position: "cima",
    notehead: "filled",
    color: "#8ac926",
    pandeiroRegion: "upper-skin",
  },
  F: {
    type: "F",
    label: "F",
    description: "Finger (Dedos)",
    position: "cima",
    notehead: "headless",
    color: "#ffd166",
    pandeiroRegion: "top-rim",
  },
  R: {
    type: "R",
    label: "R",
    description: "Rulo",
    position: "cima",
    notehead: "none",
    color: "#f72585",
    pandeiroRegion: "upper-skin",
  },
  P_mut: {
    type: "P_mut",
    label: "P",
    description: "Polegar Abafado",
    position: "baixo",
    notehead: "ghost",
    color: "#ef476f",
    pandeiroRegion: "thumb-skin",
  },
  D_mut: {
    type: "D_mut",
    label: "D",
    description: "Grave Abafado",
    position: "cima",
    notehead: "ghost",
    color: "#8ac926",
    pandeiroRegion: "upper-skin",
  },
};

export interface BeatCell {
  baixo: StrokeType | null;
  meio: StrokeType | null;
  cima: StrokeType | null;
  durationSteps?: number; // Duração visual em steps (1=semifusa, 2=fusa, 4=semicolcheia)
  explicitRest?: boolean;
  accented?: boolean;
}

export interface TimeSignature {
  beats: number;
  subdivision: number;
}

export interface Score {
  title: string;
  subtitle?: string;
  author?: string;
  genre: string;
  type?: string;
  instrument: string;
  bpm: number;
  timeSignature: TimeSignature;
  measures: number;
  cells: BeatCell[];
  accents: number[];
}

export interface GenrePreset {
  name: string;
  bpm: number;
  timeSignature: TimeSignature;
  measures: number;
  accents: number[];
  cells: BeatCell[];
}
