// Mouse and keyboard input: translate a click on the canvas into a panel
// plus scene coordinates, and turn keys into game actions. No game rules
// live here — the callbacks in main.js decide what a click means.

import { PANEL } from './config.js';

export function attachInput(canvas, handlers) {
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (ev.clientX - rect.left) * scaleX;
    const y = (ev.clientY - rect.top) * scaleY;
    let panel = null;
    let sx = 0;
    if (x >= PANEL.leftX && x < PANEL.leftX + PANEL.w && y >= PANEL.y && y < PANEL.y + PANEL.h) {
      panel = 'left';
      sx = x - PANEL.leftX;
    } else if (x >= PANEL.rightX && x < PANEL.rightX + PANEL.w && y >= PANEL.y && y < PANEL.y + PANEL.h) {
      panel = 'right';
      sx = x - PANEL.rightX;
    }
    handlers.onClick(panel, sx, y - PANEL.y, x, y);
  });

  window.addEventListener('keydown', (ev) => {
    const key = ev.key.toLowerCase();
    if (key === 'enter' || key === ' ') handlers.onStart();
    else if (key === 'h') handlers.onHint();
    else if (key === 'r') handlers.onRestart();
    else if (key === 'm') handlers.onMute();
  });
}
