// Shared constants: canvas layout, round rules and scoring.
// One job only: numbers the rest of the game agrees on.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;
export const BOTTOM_H = 56;

// Two scene panels, each 600x560, with a gap between them.
export const PANEL = {
  w: 600,
  h: 560,
  y: 84,
  leftX: 20,
  rightX: 660,
};
export const SCENE_W = 600;
export const SCENE_H = 560;

export const ROUND_NAMES = ['Pasar Lampion', 'Warung Teh Senja', 'Pasar Bintang'];
export const ROUND_TIMES = [120, 100, 90];
export const DIFFERENCES_PER_ROUND = 7;
export const HINTS_PER_ROUND = 3;
export const HINT_SECONDS = 2.5;
export const MISS_TIME_PENALTY = 5;
export const FIND_SCORE = 100;
export const MISS_SCORE = 10;
export const ROUND_CLEAR_BONUS_PER_SECOND = 5;
export const MISS_FADE_SECONDS = 0.7;
