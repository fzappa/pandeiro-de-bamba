import { STROKES } from "./types.ts";

export const OPEN_SKIN_COLOR = STROKES.D.color;
export const MUTED_SKIN_COLOR = STROKES.P.color;

export const THUMB_SKIN_PATH = `M 74 288
               A 150 150 0 0 0 326 288
               L 296 252
               A 112 112 0 0 1 104 252
               Z`;

export const UPPER_SKIN_PATH = `M 74 112
               A 150 150 0 0 1 326 112
               L 296 148
               A 112 112 0 0 0 104 148
               Z`;

export const MUTED_THUMB_SKIN_TRANSFORM =
  "translate(200 304) scale(0.5) translate(-200 -304)";

export const MUTED_UPPER_SKIN_TRANSFORM =
  "translate(200 96) scale(0.5) translate(-200 -96)";
