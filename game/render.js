// DAPUR KILAT — render.js
// Everything the player sees, drawn with canvas shapes. No images, no
// external art: bowls, woks, tickets and the little chef are all code.

import { INGREDIENTS, itemLabel } from './recipes.js';
import { COUNTERS, STATIONS, FLOOR, PLAYER_RADIUS } from './kitchen.js';
import { SHIFT_SECONDS } from './orders.js';

const W = 1280;
const H = 720;
const TOP = 76;

// ---------- small drawing helpers ---------------------------------------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ---------- ingredient icons -------------------------------------------

export function drawIngredientIcon(ctx, id, x, y, size, processed) {
  const ing = INGREDIENTS[id];
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  // Bowl / plate under the food.
  ctx.fillStyle = '#fff8ec';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.45, r * 0.95, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a06a';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (id === 'nasi') {
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.62, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e0d4b8';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(i * r * 0.22, -r * 0.35 + Math.abs(i) * r * 0.08, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'mie') {
    ctx.strokeStyle = processed ? '#e8a91c' : '#f2c14e';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const yy = -r * 0.35 + i * r * 0.3;
      ctx.moveTo(-r * 0.55, yy);
      ctx.bezierCurveTo(-r * 0.25, yy - r * 0.28, r * 0.25, yy + r * 0.28, r * 0.55, yy);
      ctx.stroke();
    }
  } else if (id === 'telur') {
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.05, r * 0.62, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = processed ? '#e8891c' : '#f2a541';
    ctx.beginPath();
    ctx.arc(0, -r * 0.05, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'ayam') {
    ctx.fillStyle = processed ? '#c97a3a' : '#e8a87c';
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.05, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff8ec';
    ctx.lineWidth = r * 0.14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.3, r * 0.25);
    ctx.lineTo(r * 0.75, r * 0.6);
    ctx.stroke();
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.arc(r * 0.78, r * 0.62, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'sawi') {
    ctx.fillStyle = processed ? '#4da85a' : '#7dc383';
    for (const [dx, dy, rot] of [[-0.3, 0.1, -0.5], [0.25, 0.05, 0.5], [0, -0.25, 0]]) {
      ctx.save();
      ctx.translate(dx * r, dy * r);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.32, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (id === 'kecap') {
    ctx.fillStyle = '#5b3a1e';
    roundRect(ctx, -r * 0.3, -r * 0.55, r * 0.6, r * 0.95, r * 0.14);
    ctx.fill();
    ctx.fillStyle = '#3a2412';
    roundRect(ctx, -r * 0.16, -r * 0.85, r * 0.32, r * 0.35, r * 0.08);
    ctx.fill();
    ctx.fillStyle = '#f2d8a0';
    ctx.font = `700 ${Math.round(r * 0.42)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('K', 0, r * 0.05);
  } else if (id === 'kuah') {
    ctx.fillStyle = '#e8b04b';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.1, r * 0.7, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.55);
    ctx.quadraticCurveTo(-r * 0.45, -r * 0.85, -r * 0.3, -r * 1.05);
    ctx.moveTo(r * 0.25, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.4, -r * 0.85, r * 0.25, -r * 1.05);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- the kitchen --------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 0, W, H);
  // Checker tiles on the floor.
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 17; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#c98f5f' : '#bd7f52';
      ctx.fillRect(160 + x * 66, 84 + y * 71, 66, 71);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 17; x++) {
      ctx.fillRect(160 + x * 66, 84 + y * 71 + 68, 66, 3);
    }
  }
}

function drawCounters(ctx, kitchen, now) {
  for (const c of COUNTERS) {
    const ing = INGREDIENTS[c.id];
    ctx.fillStyle = '#6b4a2a';
    roundRect(ctx, c.x, c.y, c.w, c.h, 10);
    ctx.fill();
    ctx.fillStyle = '#8a6238';
    roundRect(ctx, c.x + 4, c.y + 4, c.w - 8, c.h - 8, 8);
    ctx.fill();
    drawIngredientIcon(ctx, c.id, c.x + 34, c.y + c.h / 2 - 4, 46, ing.station === null);
    text(ctx, ing.name, c.x + 62, c.y + c.h / 2 - 12, 17, '#ffe9bd');
    text(ctx, ing.station === 'board' ? '→ talenan' : ing.station === 'wok' ? '→ wajan' : 'siap saji', c.x + 62, c.y + c.h / 2 + 12, 12, '#e8cfa8', 'left', 600);
    // Gentle bob on the nearest counter's label when the cook is close.
    const near = kitchen.nearest() === 'counter:' + c.id;
    if (near) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      roundRect(ctx, c.x - 2, c.y - 2, c.w + 4, c.h + 4, 12);
      ctx.stroke();
    }
  }
}

function drawProcessor(ctx, kitchen, key, station, now) {
  const slot = kitchen[key];
  const s = STATIONS[key];
  const isBoard = key === 'board';
  ctx.fillStyle = '#5d4126';
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = isBoard ? '#d9b380' : '#3c3c46';
  roundRect(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 34, 10);
  ctx.fill();
  if (isBoard) {
    ctx.strokeStyle = '#b08d5f';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + 14, s.y + 8 + i * 20);
      ctx.lineTo(s.x + s.w - 14, s.y + 8 + i * 20);
      ctx.stroke();
    }
  } else {
    // Wok: dark pan with a rim.
    ctx.strokeStyle = '#8a8a96';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + 48, 62, 26, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#22222a';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + 48, 58, 23, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (slot.item) {
    drawIngredientIcon(ctx, slot.item.id, s.x + s.w / 2, s.y + 48, 52, slot.done);
    if (!slot.done) {
      // Progress bar.
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, s.x + 20, s.y + s.h - 26, s.w - 40, 12, 6);
      ctx.fill();
      ctx.fillStyle = isBoard ? '#ffd166' : '#ff8c42';
      roundRect(ctx, s.x + 20, s.y + s.h - 26, (s.w - 40) * slot.progress, 12, 6);
      ctx.fill();
    } else {
      text(ctx, 'SIAP! ✓', s.x + s.w / 2, s.y + s.h - 18, 15, '#8dff9a', 'center');
    }
  }
  text(ctx, station.name, s.x + s.w / 2, s.y + s.h - 34 + (slot.item ? 0 : 14), 15, '#ffe9bd', 'center');
  const near = kitchen.nearest() === key;
  if (near) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    roundRect(ctx, s.x - 2, s.y - 2, s.w + 4, s.h + 4, 14);
    ctx.stroke();
  }
}

function drawPlating(ctx, kitchen) {
  const s = STATIONS.plate;
  ctx.fillStyle = '#5d4126';
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = '#e8e0d0';
  roundRect(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 52, 10);
  ctx.fill();
  const plate = kitchen.plate;
  if (plate.dish) {
    // Finished dish on a white plate.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + 40, 58, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = plate.dish.color;
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + 38, 44, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, plate.dish.name + ' ✓', s.x + s.w / 2, s.y + s.h - 36, 16, '#2f6b35', 'center');
  } else if (plate.items.length > 0) {
    // Dish mid-assembly: items placed so far, empty slots as outlines.
    for (let i = 0; i < 3; i++) {
      const cx = s.x + 52 + i * 54;
      if (plate.items[i]) {
        drawIngredientIcon(ctx, plate.items[i].id, cx, s.y + 38, 44, true);
      } else {
        ctx.strokeStyle = '#b8a888';
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, s.y + 38, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    text(ctx, plate.items.length + '/3 bahan', s.x + s.w / 2, s.y + s.h - 36, 14, '#7a5a34', 'center');
  } else {
    text(ctx, 'Rakit 3 bahan di sini', s.x + s.w / 2, s.y + 40, 15, '#8a7a5c', 'center');
  }
  text(ctx, 'Meja Saji', s.x + s.w / 2, s.y + s.h - 16, 15, '#ffe9bd', 'center');
  if (kitchen.nearest() === 'plate') {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    roundRect(ctx, s.x - 2, s.y - 2, s.w + 4, s.h + 4, 14);
    ctx.stroke();
  }
}

function drawServeWindow(ctx, kitchen) {
  const s = STATIONS.serve;
  ctx.fillStyle = '#4a3220';
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = '#2c1f14';
  roundRect(ctx, s.x + 10, s.y + 10, s.w - 20, s.h - 58, 8);
  ctx.fill();
  // A little bell on the counter.
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 52, 18, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 22, s.y + 50, 44, 6);
  ctx.fillStyle = '#e8a91c';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2 + 24, s.y + 56, 4, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'Jendela Saji', s.x + s.w / 2, s.y + s.h - 30, 16, '#ffe9bd', 'center');
  text(ctx, 'antar piring ke sini', s.x + s.w / 2, s.y + s.h - 12, 12, '#e8cfa8', 'center', 600);
  if (kitchen.nearest() === 'serve') {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    roundRect(ctx, s.x - 2, s.y - 2, s.w + 4, s.h + 4, 14);
    ctx.stroke();
  }
}

function drawTrash(ctx, kitchen) {
  const s = STATIONS.trash;
  ctx.fillStyle = '#4a4a52';
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#33333a';
  roundRect(ctx, s.x + 10, s.y + 10, s.w - 20, s.h - 34, 8);
  ctx.fill();
  // Little bin: body, rim and lid handle, drawn in code.
  ctx.fillStyle = '#8a8a96';
  ctx.beginPath();
  ctx.moveTo(s.x + s.w / 2 - 16, s.y + 22);
  ctx.lineTo(s.x + s.w / 2 + 16, s.y + 22);
  ctx.lineTo(s.x + s.w / 2 + 12, s.y + 52);
  ctx.lineTo(s.x + s.w / 2 - 12, s.y + 52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6a6a74';
  ctx.fillRect(s.x + s.w / 2 - 20, s.y + 18, 40, 6);
  ctx.fillRect(s.x + s.w / 2 - 5, s.y + 12, 10, 6);
  ctx.strokeStyle = '#5a5a64';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x + s.w / 2 - 8, s.y + 28);
  ctx.lineTo(s.x + s.w / 2 - 6, s.y + 46);
  ctx.moveTo(s.x + s.w / 2 + 8, s.y + 28);
  ctx.lineTo(s.x + s.w / 2 + 6, s.y + 46);
  ctx.stroke();
  text(ctx, 'Sampah', s.x + s.w / 2, s.y + s.h - 12, 13, '#e8cfa8', 'center');
  if (kitchen.nearest() === 'trash') {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    roundRect(ctx, s.x - 2, s.y - 2, s.w + 4, s.h + 4, 12);
    ctx.stroke();
  }
}

function drawPlayer(ctx, kitchen) {
  const p = kitchen.player;
  const bob = p.moving ? Math.sin(Date.now() / 90) * 2 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body / apron.
  ctx.fillStyle = '#f4f1ea';
  roundRect(ctx, -17, -8, 34, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#e07840';
  ctx.fillRect(-17, 12, 34, 6);
  // Head + chef hat.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(0, -20, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -14, -40, 28, 14, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-8, -38, 8, 0, Math.PI * 2);
  ctx.arc(0, -42, 9, 0, Math.PI * 2);
  ctx.arc(8, -38, 8, 0, Math.PI * 2);
  ctx.fill();
  // Eyes look where the cook faces.
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(p.facing * 4 - 4, -20, 2, 0, Math.PI * 2);
  ctx.arc(p.facing * 4 + 4, -20, 2, 0, Math.PI * 2);
  ctx.fill();
  // Carried plate rides above the hat.
  if (kitchen.carryingPlate) {
    const dish = kitchen.carryingPlate;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -52, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dish.color;
    ctx.beginPath();
    ctx.ellipse(0, -53, 19, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kitchen.hand.length > 0) {
    // Carried ingredients as little dots over the shoulder.
    kitchen.hand.forEach((item, i) => {
      const ix = -14 + i * 14;
      ctx.fillStyle = INGREDIENTS[item.id].color;
      ctx.beginPath();
      ctx.arc(ix, -48, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }
  ctx.restore();
}

// ---------- top bar: order board + score + timer -------------------------

function drawTopBar(ctx, board, timeLeft) {
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, W, TOP);
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(0, TOP - 4, W, 4);

  // Tickets.
  board.tickets.forEach((t, i) => {
    const x = 12 + i * 184;
    const y = 8;
    const w = 176;
    const h = 60;
    const urgent = t.left <= 10;
    ctx.fillStyle = urgent && Math.floor(Date.now() / 350) % 2 === 0 ? '#7a2e1e' : '#fff8ec';
    roundRect(ctx, x, y, w, h, 9);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#ff5a3c' : '#c9a06a';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, t.recipe.name, x + 10, y + 14, 15, '#3a2a1a');
    // Ingredient dots.
    t.recipe.needs.forEach((id, j) => {
      ctx.fillStyle = INGREDIENTS[id].color;
      ctx.beginPath();
      ctx.arc(x + 18 + j * 20, y + 34, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    text(ctx, 'Rp' + t.recipe.price, x + w - 10, y + 34, 13, '#7a5a34', 'right');
    // Timer bar.
    const frac = Math.max(0, t.left / t.total);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, x + 10, y + 48, w - 20, 7, 3);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#4da85a' : frac > 0.25 ? '#e8a91c' : '#ff5a3c';
    roundRect(ctx, x + 10, y + 48, (w - 20) * frac, 7, 3);
    ctx.fill();
  });
  if (board.tickets.length === 0) {
    text(ctx, 'Belum ada pesanan…', 100, 38, 15, '#e8cfa8', 'center', 600);
  }

  // Score + combo.
  ctx.fillStyle = '#3a2a1a';
  roundRect(ctx, 756, 8, 236, 60, 10);
  ctx.fill();
  text(ctx, 'SKOR', 772, 24, 12, '#e8cfa8', 'left', 600);
  text(ctx, String(board.score), 772, 48, 26, '#ffd166');
  if (board.combo >= 2) {
    ctx.fillStyle = '#ff8c42';
    roundRect(ctx, 900, 16, 78, 28, 8);
    ctx.fill();
    text(ctx, 'KOMBO x' + board.combo, 939, 31, 15, '#fff', 'center');
  }

  // Big shift timer.
  const low = timeLeft <= 30;
  ctx.fillStyle = low ? '#7a2e1e' : '#3a2a1a';
  roundRect(ctx, 1004, 8, 264, 60, 10);
  ctx.fill();
  text(ctx, 'SHIFT', 1020, 24, 12, '#e8cfa8', 'left', 600);
  text(ctx, mmss(timeLeft), 1020, 48, 28, low ? '#ff8a70' : '#fff3e0');
  const dayFrac = 1 - timeLeft / SHIFT_SECONDS;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, 1140, 20, 112, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  roundRect(ctx, 1140, 20, 112 * dayFrac, 8, 4);
  ctx.fill();
  text(ctx, 'HARI', 1140, 44, 11, '#e8cfa8', 'left', 600);
}

// ---------- screens --------------------------------------------------------

function drawTitle(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#3a2415');
  g.addColorStop(1, '#1d120a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Decorative food row.
  ['nasi', 'mie', 'telur', 'ayam', 'sawi', 'kuah', 'kecap'].forEach((id, i) => {
    drawIngredientIcon(ctx, id, 300 + i * 110, 150, 72, true);
  });
  text(ctx, 'DAPUR KILAT', W / 2, 290, 84, '#ffd166', 'center');
  text(ctx, 'Warung Masak Cepat', W / 2, 350, 30, '#ffe9bd', 'center', 600);
  text(ctx, 'Terima pesanan, olah bahan, rakit hidangan, antar sebelum waktunya habis!', W / 2, 410, 20, '#e8cfa8', 'center', 600);
  text(ctx, 'WASD / panah — jalan   •   E / Spasi / klik — ambil & olah   •   P — jeda   •   M — suara', W / 2, 470, 18, '#e8cfa8', 'center', 600);
  const pulse = 0.65 + Math.sin(Date.now() / 300) * 0.35;
  ctx.globalAlpha = pulse;
  text(ctx, 'Tekan ENTER atau klik untuk mulai', W / 2, 540, 26, '#ffd166', 'center');
  ctx.globalAlpha = 1;
  text(ctx, 'Shift 3 menit — makin siang, makin ramai. Kombo untuk serve cepat beruntun!', W / 2, 590, 16, '#c9a06a', 'center', 600);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'JEDA', W / 2, 320, 64, '#ffd166', 'center');
  text(ctx, 'Tekan P untuk lanjut  •  R untuk mulai dari awal', W / 2, 380, 20, '#ffe9bd', 'center', 600);
}

function drawDayEnd(ctx, board) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff8ec';
  roundRect(ctx, 340, 110, 600, 500, 18);
  ctx.fill();
  text(ctx, 'SHIFT SELESAI!', W / 2, 165, 44, '#3a2a1a', 'center');
  text(ctx, 'Skor akhir', W / 2, 215, 18, '#7a5a34', 'center', 600);
  text(ctx, String(board.score), W / 2, 265, 64, '#e07840', 'center');
  // Stars: 600+ = 3, 350+ = 2, else 1.
  const stars = board.score >= 600 ? 3 : board.score >= 350 ? 2 : 1;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? '#ffd166' : '#d8cbb2';
    const sx = W / 2 - 70 + i * 70;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
      const r = k % 2 === 0 ? 26 : 11;
      const px = sx + Math.cos(a) * r;
      const py = 330 + Math.sin(a) * r;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, 'Hidangan terantar: ' + board.served, W / 2, 400, 20, '#3a2a1a', 'center', 600);
  text(ctx, 'Pesanan hangus: ' + board.expired + '   •   Salah antar: ' + board.wrong, W / 2, 434, 20, '#3a2a1a', 'center', 600);
  text(ctx, 'Kombo terbaik: x' + board.bestCombo + '   •   Pemasukan: Rp' + board.earned, W / 2, 468, 20, '#3a2a1a', 'center', 600);
  const pulse = 0.65 + Math.sin(Date.now() / 300) * 0.35;
  ctx.globalAlpha = pulse;
  text(ctx, 'Tekan R untuk shift berikutnya', W / 2, 540, 22, '#e07840', 'center');
  ctx.globalAlpha = 1;
}

// ---------- main entry -----------------------------------------------------

export function drawGame(ctx, state) {
  const { phase, kitchen, board, timeLeft } = state;
  ctx.clearRect(0, 0, W, H);
  if (phase === 'title') {
    drawTitle(ctx);
    return;
  }
  drawFloor(ctx);
  drawCounters(ctx, kitchen);
  drawProcessor(ctx, kitchen, 'board', STATIONS.board);
  drawProcessor(ctx, kitchen, 'wok', STATIONS.wok);
  drawPlating(ctx, kitchen);
  drawServeWindow(ctx, kitchen);
  drawTrash(ctx, kitchen);
  drawPlayer(ctx, kitchen);
  drawTopBar(ctx, board, timeLeft);

  // Floating messages (score pops, warnings).
  for (const m of state.messages) {
    ctx.globalAlpha = Math.max(0, Math.min(1, m.ttl));
    text(ctx, m.text, m.x, m.y, m.size || 22, m.color || '#ffd166', 'center');
  }
  ctx.globalAlpha = 1;

  // Hint when the cook stands near a station.
  if (kitchen.flash) {
    ctx.fillStyle = 'rgba(20,12,6,0.8)';
    roundRect(ctx, W / 2 - 190, H - 56, 380, 36, 10);
    ctx.fill();
    text(ctx, kitchen.flash.text, W / 2, H - 37, 17, '#ffe9bd', 'center', 600);
  }
  if (state.muted) {
    text(ctx, 'SUARA MATI (M)', W - 16, H - 20, 14, '#e8cfa8', 'right', 600);
  }
  if (phase === 'paused') drawPaused(ctx);
  if (phase === 'done') drawDayEnd(ctx, board);
}
