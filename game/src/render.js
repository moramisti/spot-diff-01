// Everything drawn on top of the two scene panels: the HUD, the found
// markers, the miss flashes, the hint ring, and the title / round-clear /
// win / lose overlays. The scenes themselves live in scenes.js.

import { VIEW_W, VIEW_H, HUD_H, PANEL, BOTTOM_H, ROUND_NAMES, DIFFERENCES_PER_ROUND } from './config.js';
import { ROUNDS, drawScene } from './scenes.js';

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawPanelLabel(ctx, text, x) {
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, PANEL.y - 8);
}

function drawMarker(ctx, x, y, t) {
  const pulse = 1 + 0.08 * Math.sin(t * 0.006);
  const r = 26 * pulse;
  ctx.save();
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(255,210,62,0.9)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#fff7d6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r - 6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawMiss(ctx, x, y, age) {
  const alpha = Math.max(0, 1 - age / 0.7);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#ff5a4e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 12);
  ctx.lineTo(x + 12, y + 12);
  ctx.moveTo(x + 12, y - 12);
  ctx.lineTo(x - 12, y + 12);
  ctx.stroke();
  ctx.restore();
}

function drawHintRing(ctx, x, y, t) {
  const pulse = 1 + 0.12 * Math.sin(t * 0.01);
  ctx.save();
  ctx.strokeStyle = '#7ad7ff';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(x, y, 30 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#14121f';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('Cari Bedanya', 20, 34);
  ctx.fillStyle = '#b9b3c9';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Pasar Lampion', 200, 33);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 20px Georgia, serif';
  const roundName = ROUND_NAMES[state.round] || '';
  ctx.fillText(`Ronde ${state.round + 1} / 3 — ${roundName}`, VIEW_W / 2, 26);
  const found = state.found.size;
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(`Ditemukan ${found} / ${DIFFERENCES_PER_ROUND}`, VIEW_W / 2, 52);

  ctx.textAlign = 'right';
  const lowTime = state.screen === 'playing' && state.timeLeft <= 20;
  ctx.fillStyle = lowTime ? '#ff5a4e' : '#e8e2d0';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(fmtTime(state.timeLeft), VIEW_W - 260, 34);
  ctx.fillStyle = '#b9b3c9';
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Skor ${state.score}`, VIEW_W - 130, 27);
  ctx.fillText(`Petunjuk ${state.hintsLeft} (H)`, VIEW_W - 130, 50);
}

function drawBottomBar(ctx) {
  const y = VIEW_H - BOTTOM_H;
  ctx.fillStyle = '#14121f';
  ctx.fillRect(0, y, VIEW_W, BOTTOM_H);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, y, VIEW_W, 2);
  ctx.fillStyle = '#b9b3c9';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Klik perbedaan pada salah satu gambar  •  H = petunjuk  •  R = mulai lagi  •  M = suara', VIEW_W / 2, y + 24);
  ctx.fillText('Klik yang salah mengurangi 5 detik. Temukan 7 perbedaan untuk lanjut ke ronde berikutnya.', VIEW_W / 2, y + 44);
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(10,8,20,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function overlayPanel(ctx, w, h) {
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = '#1d1930';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = 3;
  ctx.stroke();
  return { x, y, w, h };
}

function overlayTitle(ctx, box, text, color) {
  ctx.fillStyle = color || '#ffd23e';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, box.x + box.w / 2, box.y + 70);
}

function overlayLine(ctx, box, text, y, size, color) {
  ctx.fillStyle = color || '#e8e2d0';
  ctx.font = `${size || 19}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, box.x + box.w / 2, y);
}

function drawTitle(ctx) {
  dim(ctx);
  const box = overlayPanel(ctx, 760, 420);
  overlayTitle(ctx, box, 'Cari Bedanya');
  overlayLine(ctx, box, 'Pasar Lampion — dua gambar hampir sama.', box.y + 118, 20);
  overlayLine(ctx, box, 'Temukan 7 perbedaan di setiap ronde.', box.y + 150, 20);
  overlayLine(ctx, box, 'Tiga ronde, makin sulit. Waktu terus berjalan!', box.y + 182, 20);
  overlayLine(ctx, box, 'Klik perbedaan • H untuk petunjuk (3x per ronde)', box.y + 232, 18, '#b9b3c9');
  overlayLine(ctx, box, 'Klik yang salah: −5 detik • Benar: +100 poin', box.y + 260, 18, '#b9b3c9');
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Klik atau tekan Enter untuk mulai', box.x + box.w / 2, box.y + 330);
  ctx.fillStyle = '#b9b3c9';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Ronde 1: 120 detik  •  Ronde 2: 100 detik  •  Ronde 3: 90 detik', box.x + box.w / 2, box.y + 366);
}

function drawRoundClear(ctx, state) {
  dim(ctx);
  const box = overlayPanel(ctx, 640, 300);
  overlayTitle(ctx, box, `Ronde ${state.round + 1} Selesai!`, '#7ad7ff');
  overlayLine(ctx, box, 'Semua 7 perbedaan ditemukan.', box.y + 120, 20);
  overlayLine(ctx, box, `Bonus waktu: +${state.lastBonus} poin`, box.y + 158, 20);
  overlayLine(ctx, box, `Skor: ${state.score}`, box.y + 196, 20);
  overlayLine(ctx, box, state.round + 1 < 3 ? 'Ronde berikutnya segera dimulai…' : '', box.y + 244, 18, '#b9b3c9');
}

function drawWin(ctx, state) {
  dim(ctx);
  const box = overlayPanel(ctx, 720, 380);
  overlayTitle(ctx, box, 'Kamu Menang!');
  overlayLine(ctx, box, 'Semua 21 perbedaan ditemukan di tiga ronde.', box.y + 118, 20);
  overlayLine(ctx, box, `Skor akhir: ${state.score}`, box.y + 162, 24, '#ffd23e');
  overlayLine(ctx, box, `Ronde tercepat: ${state.bestRoundLabel}`, box.y + 200, 18, '#b9b3c9');
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Tekan R untuk main lagi', box.x + box.w / 2, box.y + 272);
}

function drawLose(ctx, state) {
  dim(ctx);
  const box = overlayPanel(ctx, 640, 320);
  overlayTitle(ctx, box, 'Waktu Habis', '#ff5a4e');
  overlayLine(ctx, box, `Kamu menemukan ${state.found.size} dari 7 perbedaan di ronde ${state.round + 1}.`, box.y + 120, 20);
  overlayLine(ctx, box, `Skor: ${state.score}`, box.y + 158, 20);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Tekan R untuk coba lagi', box.x + box.w / 2, box.y + 232);
}

// Draw one full frame. `t` is a millisecond clock used only for pulses;
// in shot mode the caller passes a fixed value so renders are stable.
export function render(ctx, state, t) {
  ctx.fillStyle = '#0d0f1a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const shakeL = state.shake.left > 0 ? Math.sin(t * 0.09) * state.shake.left * 3 : 0;
  const shakeR = state.shake.right > 0 ? Math.sin(t * 0.09) * state.shake.right * 3 : 0;

  ctx.save();
  ctx.translate(PANEL.leftX + shakeL, PANEL.y);
  drawScene(ctx, state.round, 'left');
  ctx.restore();
  ctx.save();
  ctx.translate(PANEL.rightX + shakeR, PANEL.y);
  drawScene(ctx, state.round, 'right');
  ctx.restore();

  // Panel frames and labels.
  ctx.strokeStyle = '#3a3450';
  ctx.lineWidth = 3;
  ctx.strokeRect(PANEL.leftX, PANEL.y, PANEL.w, PANEL.h);
  ctx.strokeRect(PANEL.rightX, PANEL.y, PANEL.w, PANEL.h);
  drawPanelLabel(ctx, 'Kiri', PANEL.leftX);
  drawPanelLabel(ctx, 'Kanan', PANEL.rightX);

  // Found markers on both panels.
  const diffs = ROUNDS[state.round].diffs;
  for (const d of diffs) {
    if (!state.found.has(d.id)) continue;
    drawMarker(ctx, PANEL.leftX + d.x, PANEL.y + d.y, t);
    drawMarker(ctx, PANEL.rightX + d.x, PANEL.y + d.y, t);
  }

  // Miss flashes.
  for (const m of state.misses) {
    const age = (t - m.at) / 1000;
    if (age > 0.7) continue;
    const px = (m.panel === 'left' ? PANEL.leftX : PANEL.rightX) + m.x;
    drawMiss(ctx, px, PANEL.y + m.y, age);
  }

  // Hint ring on both panels.
  if (state.hint && t < state.hint.until) {
    const d = state.hint.diff;
    drawHintRing(ctx, PANEL.leftX + d.x, PANEL.y + d.y, t);
    drawHintRing(ctx, PANEL.rightX + d.x, PANEL.y + d.y, t);
  }

  drawHud(ctx, state);
  drawBottomBar(ctx);

  if (state.screen === 'title') drawTitle(ctx);
  else if (state.screen === 'roundClear') drawRoundClear(ctx, state);
  else if (state.screen === 'win') drawWin(ctx, state);
  else if (state.screen === 'lose') drawLose(ctx, state);
}
