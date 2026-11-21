// The night-market scenes: all art is drawn with canvas 2D primitives, an
// original lantern-lit market painted fresh for this game. One layout is
// shared by all three rounds; each round repaints it in a new palette and
// hides its own set of 7 differences. The left panel is always the base
// scene; the right panel is the same scene with each difference applied.

import { SCENE_W, SCENE_H } from './config.js';
import { makeRng, range } from './rng.js';

// ---------------------------------------------------------------- colours

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const mix = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
}

export const PALETTES = [
  {
    name: 'Pasar Lampion',
    skyTop: '#141b33', skyBottom: '#3d2b5c',
    wall: '#5a3a4a', roof: '#171226', ground: '#2e2438',
    awningA: '#d94f3d', awningB: '#f2e3c6',
    counter: '#7a4a2b', cloth: '#8e3b46',
  },
  {
    name: 'Warung Teh Senja',
    skyTop: '#1d2b4a', skyBottom: '#7a4a6e',
    wall: '#3d4a5a', roof: '#141a2e', ground: '#33272e',
    awningA: '#2f8f7a', awningB: '#f2e3c6',
    counter: '#6b4a2f', cloth: '#2f6f5e',
  },
  {
    name: 'Pasar Bintang',
    skyTop: '#0e1428', skyBottom: '#2c3a6e',
    wall: '#4a3a5e', roof: '#10131f', ground: '#262233',
    awningA: '#c98a2e', awningB: '#efe6c8',
    counter: '#74522e', cloth: '#5e4a8e',
  },
];

// The sky colour at a height, so a "missing" difference can be painted over
// with exactly the sky behind it.
function skyAt(p, y) {
  const t = Math.max(0, Math.min(1, y / 360));
  return lerpColor(p.skyTop, p.skyBottom, t);
}

// ---------------------------------------------------------------- fixed layout

const MOON = { x: 480, y: 72, r: 34 };
const BUNTING_Y = 30;
const LIGHTS_Y = 118;

// The same seeded stars every round, so a star difference always sits in
// the same place.
export const STARS = (() => {
  const rng = makeRng(7);
  const out = [];
  while (out.length < 46) {
    const x = range(rng, 12, SCENE_W - 12);
    const y = range(rng, 70, 280);
    if (Math.hypot(x - MOON.x, y - MOON.y) < 70) continue;
    out.push({ x, y, r: range(rng, 1, 2.2), gold: rng() < 0.22 });
  }
  // The round-3 "gold star" difference needs this star to start white.
  out[9].gold = false;
  return out;
})();

function flagPos(i) {
  const x = 30 + i * 52;
  const y = BUNTING_Y + 18 * Math.sin((Math.PI * x) / SCENE_W);
  return { x, y };
}

function lightPos(i) {
  const x = 45 + i * 50;
  const y = LIGHTS_Y + 16 * Math.sin((Math.PI * x) / SCENE_W);
  return { x, y };
}

const FLAG_COLORS = ['#e8452c', '#f2c230', '#2f8f7a', '#7a5ec9'];

// ---------------------------------------------------------------- small painters

function drawStarShape(ctx, x, y, r, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawLantern(ctx, x, y, r, color, tall = false, tassel = 10) {
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - r - 26);
  ctx.lineTo(x, y - r);
  ctx.stroke();
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(x - 5, y - r - 6, 10, 6);
  const ry = tall ? r * 1.35 : r;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.82, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,20,10,0.55)';
  ctx.lineWidth = 1.5;
  for (const off of [-0.45, 0, 0.45]) {
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.82 * Math.abs(off + 0.15), ry * 0.96, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(x - 5, y + ry - 2, 10, 6);
  ctx.strokeStyle = '#e8b13a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + ry + 4);
  ctx.lineTo(x, y + ry + 4 + tassel);
  ctx.stroke();
  ctx.fillStyle = '#e8b13a';
  ctx.fillRect(x - 3, y + ry + 4 + tassel, 6, 5);
}

function drawCat(ctx, x, y) {
  // A small cat sitting on the ground, tail curled around its paws.
  ctx.fillStyle = '#2b2b33';
  ctx.beginPath();
  ctx.ellipse(x, y, 26, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 34, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 44);
  ctx.lineTo(x - 18, y - 62);
  ctx.lineTo(x - 4, y - 48);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 44);
  ctx.lineTo(x + 18, y - 62);
  ctx.lineTo(x + 4, y - 48);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2b2b33';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 22);
  ctx.quadraticCurveTo(x + 46, y + 18, x + 42, y - 2);
  ctx.stroke();
  ctx.fillStyle = '#f2c230';
  ctx.beginPath();
  ctx.arc(x - 6, y - 36, 2.4, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 36, 2.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawJar(ctx, x, y, labelColor) {
  ctx.fillStyle = 'rgba(220,235,240,0.85)';
  ctx.beginPath();
  ctx.roundRect(x - 16, y - 34, 32, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#8e5a2e';
  ctx.fillRect(x - 12, y - 40, 24, 8);
  ctx.fillStyle = labelColor;
  ctx.fillRect(x - 16, y - 20, 32, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(x - 11, y - 30, 4, 26);
}

function drawTeapot(ctx, x, y) {
  ctx.fillStyle = '#3f6fb5';
  ctx.beginPath();
  ctx.ellipse(x, y, 24, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 22, y - 4);
  ctx.quadraticCurveTo(x - 40, y - 12, x - 36, y - 22);
  ctx.quadraticCurveTo(x - 28, y - 14, x - 20, y - 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 22, y - 4, 8, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = '#2c4f84';
  ctx.fillRect(x - 6, y - 26, 12, 8);
  ctx.beginPath();
  ctx.arc(x, y - 28, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(ctx, x, y, petal) {
  ctx.strokeStyle = '#3f7a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 18);
  ctx.stroke();
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 7, y - 22 + Math.sin(a) * 7, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f2c230';
  ctx.beginPath();
  ctx.arc(x, y - 22, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrate(ctx, x, y, w, h) {
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#5e3a1a';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();
}

// ---------------------------------------------------------------- the base scene

function drawBase(ctx, round) {
  const p = PALETTES[round];

  // Sky, stars, moon.
  const sky = ctx.createLinearGradient(0, 0, 0, 360);
  sky.addColorStop(0, p.skyTop);
  sky.addColorStop(1, p.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SCENE_W, 360);
  for (const s of STARS) {
    ctx.fillStyle = s.gold ? '#ffd97a' : '#eef2ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(MOON.x, MOON.y, MOON.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(220,180,90,0.5)';
  ctx.beginPath();
  ctx.arc(MOON.x - 10, MOON.y - 6, 5, 0, Math.PI * 2);
  ctx.arc(MOON.x + 9, MOON.y + 10, 4, 0, Math.PI * 2);
  ctx.fill();

  // Rooftop silhouettes with a few lit windows.
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.lineTo(0, 318);
  ctx.lineTo(70, 300);
  ctx.lineTo(150, 322);
  ctx.lineTo(230, 298);
  ctx.lineTo(310, 324);
  ctx.lineTo(390, 302);
  ctx.lineTo(470, 322);
  ctx.lineTo(540, 300);
  ctx.lineTo(SCENE_W, 320);
  ctx.lineTo(SCENE_W, 360);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd97a';
  for (const [wx, wy] of [[60, 326], [200, 322], [340, 324], [500, 322]]) {
    ctx.fillRect(wx, wy, 10, 12);
  }

  // Ground.
  ctx.fillStyle = p.ground;
  ctx.fillRect(0, 360, SCENE_W, SCENE_H - 360);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (const [gx, gy, gw] of [[120, 420, 46], [300, 470, 60], [480, 430, 52], [220, 520, 70], [420, 530, 64]]) {
    ctx.beginPath();
    ctx.ellipse(gx, gy, gw, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bunting across the top.
  ctx.strokeStyle = '#d8c9a0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, BUNTING_Y - 4);
  ctx.quadraticCurveTo(SCENE_W / 2, BUNTING_Y + 34, SCENE_W - 10, BUNTING_Y - 4);
  ctx.stroke();
  for (let i = 0; i < 11; i++) {
    const { x, y } = flagPos(i);
    ctx.fillStyle = FLAG_COLORS[i % FLAG_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(x - 11, y);
    ctx.lineTo(x + 11, y);
    ctx.lineTo(x, y + 24);
    ctx.closePath();
    ctx.fill();
  }

  // String lights.
  ctx.strokeStyle = '#d8c9a0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, LIGHTS_Y - 6);
  ctx.quadraticCurveTo(SCENE_W / 2, LIGHTS_Y + 30, SCENE_W - 20, LIGHTS_Y - 6);
  ctx.stroke();
  for (let i = 0; i < 11; i++) {
    const { x, y } = lightPos(i);
    ctx.strokeStyle = '#d8c9a0';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 7);
    ctx.stroke();
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath();
    ctx.arc(x, y + 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Left stall: tea stall.
  ctx.fillStyle = p.wall;
  ctx.fillRect(40, 200, 240, 185);
  ctx.fillStyle = p.counter;
  ctx.fillRect(40, 385, 240, 45);
  ctx.fillStyle = '#5e3a1a';
  ctx.fillRect(40, 385, 240, 6);
  // Awning, striped with a scalloped edge.
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 === 0 ? p.awningA : p.awningB;
    ctx.fillRect(40 + i * 20, 185, 20, 30);
  }
  ctx.fillStyle = p.awningA;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc(50 + i * 20, 215, 10, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(48, 222, 8, 163);
  ctx.fillRect(264, 222, 8, 163);
  // Hanging sign.
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 222);
  ctx.lineTo(110, 245);
  ctx.moveTo(190, 222);
  ctx.lineTo(190, 245);
  ctx.stroke();
  ctx.fillStyle = '#f2e3c6';
  ctx.fillRect(95, 245, 110, 58);
  ctx.strokeStyle = '#8e5a2e';
  ctx.lineWidth = 3;
  ctx.strokeRect(95, 245, 110, 58);
  ctx.fillStyle = '#5e2a1a';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('TEH', 150, 272);
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText('HANGAT', 150, 292);
  // Jars on the counter.
  drawJar(ctx, 85, 378, '#c94f3d');
  drawJar(ctx, 135, 373, '#2f8f7a');
  drawJar(ctx, 185, 378, '#c98a2e');
  // Cloth hanging from the counter front, with three fold lines.
  ctx.fillStyle = p.cloth;
  ctx.fillRect(60, 430, 200, 38);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  for (const fx of [110, 160, 210]) {
    ctx.beginPath();
    ctx.moveTo(fx, 434);
    ctx.lineTo(fx, 464);
    ctx.stroke();
  }

  // Right stall: lantern stall.
  ctx.fillStyle = p.wall;
  ctx.fillRect(330, 190, 235, 185);
  ctx.fillStyle = p.counter;
  ctx.fillRect(330, 375, 235, 45);
  ctx.fillStyle = '#5e3a1a';
  ctx.fillRect(330, 375, 235, 6);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 === 0 ? p.awningB : p.awningA;
    ctx.fillRect(330 + i * 20, 172, 20, 28);
  }
  ctx.fillStyle = p.awningB;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc(340 + i * 20, 200, 10, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(338, 206, 8, 169);
  ctx.fillRect(549, 206, 8, 169);
  // Hanging lanterns.
  drawLantern(ctx, 360, 240, 24, '#e8452c');
  drawLantern(ctx, 435, 252, 20, '#e8452c');
  drawLantern(ctx, 505, 238, 22, '#e8452c');
  // Teapot and cups on the counter.
  drawTeapot(ctx, 410, 352);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(400, 330);
  ctx.quadraticCurveTo(392, 318, 400, 306);
  ctx.moveTo(416, 330);
  ctx.quadraticCurveTo(424, 318, 416, 306);
  ctx.stroke();
  ctx.fillStyle = '#f2e3c6';
  ctx.fillRect(468, 358, 16, 14);
  ctx.fillRect(492, 358, 16, 14);

  // Crates and the cat, bottom left.
  drawCrate(ctx, 52, 425, 62, 55);
  drawCrate(ctx, 40, 480, 85, 60);
  drawCat(ctx, 85, 478);

  // Potted plant, bottom right.
  ctx.fillStyle = '#3f7a3a';
  for (const [lx, ly, lw] of [[520, 470, 14], [535, 458, 18], [548, 472, 12]]) {
    ctx.beginPath();
    ctx.ellipse(lx, ly, 7, lw, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#b05a2e';
  ctx.beginPath();
  ctx.moveTo(505, 500);
  ctx.lineTo(555, 500);
  ctx.lineTo(548, 540);
  ctx.lineTo(512, 540);
  ctx.closePath();
  ctx.fill();

  // Flowers along the bottom.
  drawFlower(ctx, 200, 545, '#e86a9a');
  drawFlower(ctx, 250, 548, '#f2c230');
  drawFlower(ctx, 320, 545, '#e86a9a');
}

// ---------------------------------------------------------------- differences

// A difference: where it is (scene coordinates, shared by both panels),
// how big a click it accepts, and how the right panel changes.
function coverCircle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export const ROUNDS = [
  {
    diffs: [
      {
        id: 'moon', label: 'Bulan sabit',
        x: MOON.x, y: MOON.y, r: 40,
        apply(ctx, round) { coverCircle(ctx, MOON.x + 16, MOON.y - 12, 30, skyAt(PALETTES[round], MOON.y)); },
      },
      {
        id: 'cat', label: 'Kucing hilang',
        x: 85, y: 478, r: 42,
        apply(ctx, round) {
          // Erase the cat, then repaint what stood behind it: counter,
          // cloth, and the two crates, in their normal order.
          const p = PALETTES[round];
          ctx.fillStyle = p.ground;
          ctx.fillRect(50, 408, 85, 105);
          ctx.fillStyle = p.counter;
          ctx.fillRect(50, 410, 78, 20);
          ctx.fillStyle = p.cloth;
          ctx.fillRect(60, 430, 75, 38);
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(110, 434);
          ctx.lineTo(110, 464);
          ctx.stroke();
          drawCrate(ctx, 52, 425, 62, 55);
          drawCrate(ctx, 40, 480, 85, 60);
        },
      },
      {
        id: 'lantern-green', label: 'Lampion hijau',
        x: 435, y: 252, r: 26,
        apply(ctx) { drawLantern(ctx, 435, 252, 20, '#3fae5a'); },
      },
      {
        id: 'flag', label: 'Bendera hilang',
        x: flagPos(5).x, y: flagPos(5).y + 12, r: 22,
        apply(ctx, round) { coverCircle(ctx, flagPos(5).x, flagPos(5).y + 12, 20, skyAt(PALETTES[round], flagPos(5).y)); },
      },
      {
        id: 'jar', label: 'Stoples hilang',
        x: 135, y: 360, r: 26,
        apply(ctx, round) {
          ctx.fillStyle = PALETTES[round].wall;
          ctx.fillRect(115, 330, 42, 56);
          ctx.fillStyle = PALETTES[round].counter;
          ctx.fillRect(115, 380, 42, 6);
        },
      },
      {
        id: 'sign-star', label: 'Bintang di papan',
        x: 185, y: 272, r: 24,
        apply(ctx) { ctx.fillStyle = '#f2c230'; drawStarShape(ctx, 185, 272, 10); ctx.fill(); },
      },
      {
        id: 'star', label: 'Bintang hilang',
        x: STARS[5].x, y: STARS[5].y, r: 18,
        apply(ctx, round) { coverCircle(ctx, STARS[5].x, STARS[5].y, 8, skyAt(PALETTES[round], STARS[5].y)); },
      },
    ],
  },
  {
    diffs: [
      {
        id: 'lantern-oval', label: 'Lampion lonjong',
        x: 360, y: 240, r: 26,
        apply(ctx) { drawLantern(ctx, 360, 240, 24, '#e8452c', true); },
      },
      {
        id: 'flower', label: 'Bunga tambahan',
        x: 285, y: 528, r: 22,
        apply(ctx) { drawFlower(ctx, 285, 545, '#7a5ec9'); },
      },
      {
        id: 'awning', label: 'Garis awning berubah',
        x: 170, y: 200, r: 24,
        apply(ctx, round) {
          // This round's awning is teal, so the changed stripe is red.
          ctx.fillStyle = '#e8452c';
          ctx.fillRect(160, 185, 20, 30);
          ctx.beginPath();
          ctx.arc(170, 215, 10, 0, Math.PI);
          ctx.fill();
        },
      },
      {
        id: 'steam', label: 'Uap teko hilang',
        x: 408, y: 318, r: 24,
        apply(ctx, round) {
          ctx.fillStyle = PALETTES[round].wall;
          ctx.fillRect(388, 300, 44, 36);
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(408, 330);
          ctx.quadraticCurveTo(400, 318, 408, 306);
          ctx.stroke();
        },
      },
      {
        id: 'bird', label: 'Burung di langit',
        x: 250, y: 100, r: 20,
        apply(ctx) {
          ctx.strokeStyle = '#1a1a22';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(238, 100);
          ctx.quadraticCurveTo(246, 92, 250, 100);
          ctx.quadraticCurveTo(254, 92, 262, 100);
          ctx.stroke();
        },
      },
      {
        id: 'crate', label: 'Peti tambahan',
        x: 83, y: 402, r: 26,
        apply(ctx) { drawCrate(ctx, 52, 380, 62, 45); },
      },
      {
        id: 'bulb', label: 'Lampu mati',
        x: lightPos(5).x, y: lightPos(5).y + 12, r: 18,
        apply(ctx) {
          ctx.fillStyle = '#3a3a44';
          ctx.beginPath();
          ctx.arc(lightPos(5).x, lightPos(5).y + 12, 5, 0, Math.PI * 2);
          ctx.fill();
        },
      },
    ],
  },
  {
    diffs: [
      {
        id: 'star-gold', label: 'Bintang emas',
        x: STARS[9].x, y: STARS[9].y, r: 16,
        apply(ctx) {
          ctx.fillStyle = '#f2c230';
          ctx.beginPath();
          ctx.arc(STARS[9].x, STARS[9].y, 4, 0, Math.PI * 2);
          ctx.fill();
        },
      },
      {
        id: 'tassel', label: 'Rumbai lampion panjang',
        x: 435, y: 282, r: 18,
        apply(ctx, round) {
          // Paint out the short tassel first, then draw the long one.
          ctx.fillStyle = PALETTES[round].wall;
          ctx.fillRect(430, 274, 12, 20);
          ctx.strokeStyle = '#e8b13a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(435, 276);
          ctx.lineTo(435, 296);
          ctx.stroke();
          ctx.fillStyle = '#e8b13a';
          ctx.fillRect(432, 296, 6, 5);
        },
      },
      {
        id: 'sign-dot', label: 'Titik di papan',
        x: 150, y: 300, r: 14,
        apply(ctx) {
          ctx.fillStyle = '#5e2a1a';
          ctx.beginPath();
          ctx.arc(150, 300, 3.5, 0, Math.PI * 2);
          ctx.fill();
        },
      },
      {
        id: 'cloth-fold', label: 'Lipatan kain hilang',
        x: 160, y: 449, r: 18,
        apply(ctx, round) {
          ctx.fillStyle = PALETTES[round].cloth;
          ctx.fillRect(154, 434, 12, 30);
        },
      },
      {
        id: 'pebble', label: 'Kerikil di tanah',
        x: 320, y: 520, r: 14,
        apply(ctx) {
          ctx.fillStyle = '#9a8fa8';
          ctx.beginPath();
          ctx.ellipse(320, 520, 8, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        },
      },
      {
        id: 'flag-blue', label: 'Bendera biru',
        x: flagPos(3).x, y: flagPos(3).y + 12, r: 20,
        apply(ctx) {
          const { x, y } = flagPos(3);
          ctx.fillStyle = '#3f6fb5';
          ctx.beginPath();
          ctx.moveTo(x - 11, y);
          ctx.lineTo(x + 11, y);
          ctx.lineTo(x, y + 24);
          ctx.closePath();
          ctx.fill();
        },
      },
      {
        id: 'jar-label', label: 'Label stoples berubah',
        x: 85, y: 366, r: 16,
        apply(ctx) {
          ctx.fillStyle = '#7a5ec9';
          ctx.fillRect(69, 358, 32, 12);
        },
      },
    ],
  },
];

// Draw one panel of a round: the base scene, plus the differences when
// this is the right-hand panel.
export function drawScene(ctx, round, side) {
  drawBase(ctx, round);
  if (side === 'right') {
    for (const d of ROUNDS[round].diffs) d.apply(ctx, round);
  }
}
