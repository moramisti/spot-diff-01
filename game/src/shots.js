// Deterministic screenshot states, driven by ?shot= in the URL:
//   ?shot=start  title screen
//   ?shot=play   mid-game: exactly 3 differences found and marked, 4 still
//                unfound, counter visible, timer at 1:27
//   ?shot=end    win screen with a final score
// In shot mode the timer is frozen and no sound plays, so every render of
// the same state is identical. main.js sets window.__shotReady once the
// first frame of the shot state has been drawn.

import { ROUND_TIMES } from './config.js';
import { ROUNDS } from './scenes.js';

export function readShot() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}

export function applyShot(state, shot) {
  state.shotMode = true;
  if (shot === 'play') {
    state.screen = 'playing';
    state.round = 0;
    state.timeLeft = 87;
    state.score = 300;
    state.hintsLeft = 3;
    state.found = new Set(ROUNDS[0].diffs.slice(0, 3).map((d) => d.id));
    state.misses = [];
    state.hint = null;
  } else if (shot === 'end') {
    state.screen = 'win';
    state.round = 2;
    state.timeLeft = 34;
    state.score = 2450;
    state.hintsLeft = 1;
    state.found = new Set(ROUNDS[2].diffs.map((d) => d.id));
    state.bestRoundLabel = 'Ronde 1 — 58 detik tersisa';
    state.misses = [];
    state.hint = null;
  } else {
    // start (and any unknown value): the title screen.
    state.screen = 'title';
    state.round = 0;
    state.timeLeft = ROUND_TIMES[0];
    state.score = 0;
    state.hintsLeft = 3;
    state.found = new Set();
    state.misses = [];
    state.hint = null;
  }
}
