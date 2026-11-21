// Game state machine and main loop: title → playing → round clear →
// next round → win, or playing → lose on timeout. Clicks, hints and the
// countdown live here; drawing lives in render.js, art in scenes.js.

import {
  VIEW_W, VIEW_H, ROUND_TIMES, HINTS_PER_ROUND, HINT_SECONDS,
  MISS_TIME_PENALTY, FIND_SCORE, MISS_SCORE, ROUND_CLEAR_BONUS_PER_SECOND,
  DIFFERENCES_PER_ROUND,
} from './config.js';
import { ROUNDS } from './scenes.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { sounds } from './audio.js';
import { readShot, applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function freshState() {
  return {
    screen: 'title',
    round: 0,
    score: 0,
    timeLeft: ROUND_TIMES[0],
    hintsLeft: HINTS_PER_ROUND,
    found: new Set(),
    misses: [],
    hint: null,
    shake: { left: 0, right: 0 },
    lastBonus: 0,
    bestRoundLabel: '—',
    bestRemaining: -1,
    shotMode: false,
  };
}

const state = freshState();

function startGame() {
  const keepShot = state.shotMode;
  Object.assign(state, freshState());
  state.shotMode = keepShot;
  state.screen = 'playing';
  state.timeLeft = ROUND_TIMES[0];
  sounds.unlock();
  sounds.click();
}

function startRound(round) {
  state.round = round;
  state.screen = 'playing';
  state.timeLeft = ROUND_TIMES[round];
  state.hintsLeft = HINTS_PER_ROUND;
  state.found = new Set();
  state.misses = [];
  state.hint = null;
}

function finishRound() {
  const bonus = Math.ceil(state.timeLeft) * ROUND_CLEAR_BONUS_PER_SECOND;
  state.lastBonus = bonus;
  state.score += bonus;
  if (state.timeLeft > state.bestRemaining) {
    state.bestRemaining = state.timeLeft;
    state.bestRoundLabel = `Ronde ${state.round + 1} — ${Math.ceil(state.timeLeft)} detik tersisa`;
  }
  sounds.roundClear();
  if (state.round + 1 >= ROUNDS.length) {
    state.screen = 'win';
    sounds.win();
    return;
  }
  state.screen = 'roundClear';
  state.roundClearAt = performance.now();
}

function useHint() {
  if (state.screen !== 'playing' || state.shotMode) return;
  if (state.hintsLeft <= 0) return;
  const remaining = ROUNDS[state.round].diffs.filter((d) => !state.found.has(d.id));
  if (remaining.length === 0) return;
  const diff = remaining[Math.floor(Math.random() * remaining.length)];
  state.hintsLeft -= 1;
  state.hint = { diff, until: performance.now() + HINT_SECONDS * 1000 };
  sounds.hint();
}

function onPanelClick(panel, sx, sy) {
  sounds.unlock();
  if (state.screen === 'title') {
    startGame();
    return;
  }
  if (state.screen === 'win' || state.screen === 'lose') {
    startGame();
    return;
  }
  if (state.screen !== 'playing' || panel === null) return;
  if (sy < 0 || sy > 560 || sx < 0 || sx > 600) return;

  const diffs = ROUNDS[state.round].diffs;
  for (const d of diffs) {
    if (state.found.has(d.id)) continue;
    const hitR = d.r + 6;
    if (Math.hypot(sx - d.x, sy - d.y) <= hitR) {
      state.found.add(d.id);
      state.score += FIND_SCORE;
      sounds.chime();
      if (state.found.size >= DIFFERENCES_PER_ROUND) finishRound();
      return;
    }
  }
  // A miss: small penalty, a red X where the player clicked, and a shake.
  state.score = Math.max(0, state.score - MISS_SCORE);
  state.timeLeft = Math.max(0, state.timeLeft - MISS_TIME_PENALTY);
  state.misses.push({ panel, x: sx, y: sy, at: performance.now() });
  state.shake[panel] = 1;
  sounds.miss();
}

attachInput(canvas, {
  onClick: (panel, sx, sy) => onPanelClick(panel, sx, sy),
  onStart: () => {
    if (state.screen === 'title') startGame();
    else if (state.screen === 'win' || state.screen === 'lose') startGame();
  },
  onHint: useHint,
  onRestart: () => {
    if (!state.shotMode) startGame();
  },
  onMute: () => sounds.toggleMute(),
});

// The ?shot= states freeze the game for screenshots.
const shot = readShot();
if (shot) applyShot(state, shot);

let last = performance.now();
let shotReadySet = false;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (state.screen === 'playing' && !state.shotMode) {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.screen = 'lose';
      sounds.lose();
    }
  }
  if (state.screen === 'roundClear' && !state.shotMode && now - state.roundClearAt > 2500) {
    startRound(state.round + 1);
  }
  if (state.hint && now > state.hint.until) state.hint = null;
  state.shake.left = Math.max(0, state.shake.left - dt * 3);
  state.shake.right = Math.max(0, state.shake.right - dt * 3);
  state.misses = state.misses.filter((m) => (now - m.at) / 1000 < 0.8);

  // In shot mode the clock is fixed so pulses and markers never move.
  const t = state.shotMode ? 1000 : now;
  render(ctx, state, t);

  if (state.shotMode && !shotReadySet) {
    shotReadySet = true;
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// A tiny handle for debugging and for automated play-tests.
window.__game = {
  state,
  startGame,
  diffs: () => ROUNDS[state.round].diffs.map((d) => ({ id: d.id, x: d.x, y: d.y, r: d.r })),
};
