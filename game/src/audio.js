// Sounds made with WebAudio oscillators only: no audio files, no network.
// Every sound is a short beep or a small arpeggio; nothing plays until the
// player has interacted (the browser requires a user gesture first).

let ctx = null;
let muted = false;

function audio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function tone(freq, startAt, dur, type, vol) {
  const ac = audio();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(vol, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.05);
}

function now() {
  const ac = audio();
  return ac ? ac.currentTime : 0;
}

export const sounds = {
  unlock() {
    const ac = audio();
    if (ac && ac.state === 'suspended') ac.resume();
  },
  click() {
    tone(660, now(), 0.07, 'sine', 0.08);
  },
  // A happy two-note chime when a difference is found.
  chime() {
    const t = now();
    tone(659.25, t, 0.16, 'sine', 0.16);
    tone(987.77, t + 0.09, 0.28, 'sine', 0.16);
  },
  // A low dull buzz for a miss.
  miss() {
    tone(140, now(), 0.18, 'sawtooth', 0.08);
  },
  hint() {
    const t = now();
    tone(880, t, 0.12, 'triangle', 0.1);
    tone(1174.66, t + 0.1, 0.18, 'triangle', 0.1);
  },
  roundClear() {
    const t = now();
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, t + i * 0.1, 0.2, 'triangle', 0.12));
  },
  win() {
    const t = now();
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => tone(f, t + i * 0.12, 0.3, 'triangle', 0.12));
  },
  lose() {
    const t = now();
    [392, 329.63, 261.63].forEach((f, i) => tone(f, t + i * 0.16, 0.3, 'sine', 0.1));
  },
  toggleMute() {
    muted = !muted;
    return muted;
  },
};
