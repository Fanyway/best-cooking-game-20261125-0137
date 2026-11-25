// DAPUR KILAT — kitchen.js
// The kitchen floor: where the cook stands, the stations, and what happens
// when the cook uses them. Movement is WASD/arrows or click-to-move; E or
// Space (or a click on a station) uses the nearest station.

import { INGREDIENTS, processItem, matchRecipe } from './recipes.js';

export const FLOOR = { x: 158, y: 84, w: 1114, h: 628 };
export const PLAYER_SPEED = 265;
export const PLAYER_RADIUS = 22;
export const HAND_LIMIT = 3;

// Ingredient counters along the left wall, top to bottom.
export const COUNTERS = [
  { id: 'nasi',  x: 8,   y: 84,  w: 142, h: 86 },
  { id: 'mie',   x: 8,   y: 174, w: 142, h: 86 },
  { id: 'telur', x: 8,   y: 264, w: 142, h: 86 },
  { id: 'ayam',  x: 8,   y: 354, w: 142, h: 86 },
  { id: 'sawi',  x: 8,   y: 444, w: 142, h: 86 },
  { id: 'kecap', x: 8,   y: 534, w: 142, h: 86 },
  { id: 'kuah',  x: 8,   y: 624, w: 142, h: 86 },
];

// Work stations on the floor.
export const STATIONS = {
  board: { id: 'board', name: 'Talenan',  x: 300, y: 280, w: 175, h: 120, time: 2.5, needs: 'board' },
  wok:   { id: 'wok',   name: 'Wajan',    x: 545, y: 280, w: 175, h: 120, time: 3.0, needs: 'wok' },
  plate: { id: 'plate', name: 'Meja Saji', x: 790, y: 280, w: 210, h: 120 },
  serve: { id: 'serve', name: 'Jendela Saji', x: 1085, y: 170, w: 180, h: 150 },
  trash: { id: 'trash', name: 'Tempat Sampah', x: 1095, y: 560, w: 130, h: 95 },
};

function rectCenter(r) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function circleHitsRect(px, py, r, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy < r * r;
}

export class Kitchen {
  constructor() {
    this.reset();
  }

  reset() {
    this.player = { x: 640, y: 560, tx: 0, ty: 0, moving: false, facing: 1 };
    this.hand = [];            // carried ingredient items, max 3
    this.carryingPlate = null; // recipe once a finished plate is picked up
    this.board = { item: null, progress: 0, done: false };
    this.wok = { item: null, progress: 0, done: false };
    this.plate = { items: [], dish: null }; // items being assembled
    this.moveTarget = null;    // { x, y, stationId } for click-to-move
    this.flash = null;         // transient hint text { text, ttl }
  }

  // ---- movement ---------------------------------------------------------

  update(dt, keys) {
    const p = this.player;
    let dx = 0;
    let dy = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;

    if (dx !== 0 || dy !== 0) {
      this.moveTarget = null;
      const len = Math.hypot(dx, dy);
      p.x += (dx / len) * PLAYER_SPEED * dt;
      p.y += (dy / len) * PLAYER_SPEED * dt;
      p.facing = dx !== 0 ? Math.sign(dx) : p.facing;
      p.moving = true;
    } else if (this.moveTarget) {
      const t = this.moveTarget;
      const ddx = t.x - p.x;
      const ddy = t.y - p.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist < 6) {
        this.moveTarget = null;
        p.moving = false;
        if (t.stationId) this.interact(t.stationId);
      } else {
        p.x += (ddx / dist) * PLAYER_SPEED * dt;
        p.y += (ddy / dist) * PLAYER_SPEED * dt;
        p.facing = ddx !== 0 ? Math.sign(ddx) : p.facing;
        p.moving = true;
      }
    } else {
      p.moving = false;
    }

    // Keep the cook on the floor and out of the furniture.
    p.x = Math.max(FLOOR.x + PLAYER_RADIUS, Math.min(FLOOR.x + FLOOR.w - PLAYER_RADIUS, p.x));
    p.y = Math.max(FLOOR.y + PLAYER_RADIUS, Math.min(FLOOR.y + FLOOR.h - PLAYER_RADIUS, p.y));
    for (const rect of [...COUNTERS, ...Object.values(STATIONS)]) {
      if (circleHitsRect(p.x, p.y, PLAYER_RADIUS, rect)) {
        const cx = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
        const cy = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
        let pushX = p.x - cx;
        let pushY = p.y - cy;
        if (pushX === 0 && pushY === 0) pushY = -1;
        const len = Math.hypot(pushX, pushY) || 1;
        p.x = cx + (pushX / len) * PLAYER_RADIUS;
        p.y = cy + (pushY / len) * PLAYER_RADIUS;
      }
    }

    // Chopping and cooking run on their own once an item is placed.
    const events = [];
    for (const [key, station] of [['board', STATIONS.board], ['wok', STATIONS.wok]]) {
      const slot = this[key];
      if (slot.item && !slot.done) {
        slot.progress += dt / station.time;
        if (slot.progress >= 1) {
          slot.progress = 1;
          slot.done = true;
          slot.item = processItem(slot.item);
          events.push(key === 'board' ? 'chop-done' : 'cook-done');
        } else if (Math.random() < dt * 3) {
          events.push(key === 'board' ? 'chop' : 'sizzle');
        }
      }
    }
    if (this.flash) {
      this.flash.ttl -= dt;
      if (this.flash.ttl <= 0) this.flash = null;
    }
    return events;
  }

  // ---- finding the nearest usable station -------------------------------

  // Distance is measured to the rectangle's edge, so the cook can use a
  // counter from anywhere along its side, not only from its centre.
  nearest() {
    const p = this.player;
    let best = null;
    let bestDist = 75;
    const consider = (id, rect) => {
      const dx = Math.max(rect.x - p.x, 0, p.x - (rect.x + rect.w));
      const dy = Math.max(rect.y - p.y, 0, p.y - (rect.y + rect.h));
      const d = Math.hypot(dx, dy);
      if (d < bestDist) {
        bestDist = d;
        best = id;
      }
    };
    for (const c of COUNTERS) consider('counter:' + c.id, c);
    for (const s of Object.values(STATIONS)) consider(s.id, s);
    return best;
  }

  clickAt(x, y) {
    // Clicking a station walks there and uses it; anywhere else just walks.
    let stationId = null;
    for (const c of COUNTERS) {
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) stationId = 'counter:' + c.id;
    }
    for (const s of Object.values(STATIONS)) {
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) stationId = s.id;
    }
    if (stationId) {
      const rect = stationId.startsWith('counter:')
        ? COUNTERS.find((c) => c.id === stationId.slice(8))
        : STATIONS[stationId];
      const c = rectCenter(rect);
      // Stand beside the station, not on top of it.
      const px = this.player.x < c.x ? c.x - rect.w / 2 - PLAYER_RADIUS - 4 : c.x + rect.w / 2 + PLAYER_RADIUS + 4;
      this.moveTarget = { x: Math.max(FLOOR.x + PLAYER_RADIUS, Math.min(FLOOR.x + FLOOR.w - PLAYER_RADIUS, px)), y: c.y, stationId };
    } else {
      this.moveTarget = { x, y, stationId: null };
    }
  }

  // ---- using stations ---------------------------------------------------

  // `serve` is a callback the app passes in: it scores a finished plate.
  interact(explicitId) {
    const id = explicitId || this.nearest();
    if (!id) return null;
    if (id.startsWith('counter:')) return this.takeIngredient(id.slice(8));
    if (id === 'board' || id === 'wok') return this.useProcessor(id);
    if (id === 'plate') return this.usePlating();
    if (id === 'serve') return this.useServe();
    if (id === 'trash') return this.useTrash();
    return null;
  }

  takeIngredient(ingId) {
    if (this.carryingPlate) {
      this.flash = { text: 'Tangan penuh piring!', ttl: 1.4 };
      return { event: 'bad', message: 'Tangan penuh piring!' };
    }
    if (this.hand.length >= HAND_LIMIT) {
      this.flash = { text: 'Tangan penuh (3)!', ttl: 1.4 };
      return { event: 'bad', message: 'Tangan penuh!' };
    }
    this.hand.push({ id: ingId, processed: INGREDIENTS[ingId].station === null });
    return { event: 'pickup', message: null };
  }

  useProcessor(key) {
    const slot = this[key];
    const station = STATIONS[key];
    if (!slot.item) {
      // Place a raw item that belongs on this station.
      const idx = this.hand.findIndex((it) => !it.processed && INGREDIENTS[it.id].station === station.needs);
      if (idx === -1) {
        this.flash = { text: key === 'board' ? 'Butuh bahan mentah (ayam/sawi)' : 'Butuh bahan mentah (mie/telur)', ttl: 1.6 };
        return { event: 'bad', message: 'Tidak ada bahan yang cocok' };
      }
      slot.item = this.hand.splice(idx, 1)[0];
      slot.progress = 0;
      slot.done = false;
      return { event: key === 'board' ? 'chop' : 'sizzle', message: null };
    }
    if (!slot.done) {
      this.flash = { text: 'Masih diolah, tunggu sebentar…', ttl: 1.2 };
      return { event: 'bad', message: 'Masih diolah' };
    }
    if (this.carryingPlate || this.hand.length >= HAND_LIMIT) {
      this.flash = { text: 'Tangan penuh!', ttl: 1.2 };
      return { event: 'bad', message: 'Tangan penuh!' };
    }
    this.hand.push(slot.item);
    slot.item = null;
    slot.progress = 0;
    slot.done = false;
    return { event: 'pickup', message: null };
  }

  usePlating() {
    // A finished dish waits to be picked up.
    if (this.plate.dish) {
      if (this.carryingPlate || this.hand.length > 0) {
        this.flash = { text: 'Kosongkan tangan dulu!', ttl: 1.4 };
        return { event: 'bad', message: 'Kosongkan tangan dulu!' };
      }
      this.carryingPlate = this.plate.dish;
      this.plate = { items: [], dish: null };
      return { event: 'pickup', message: 'Piring siap diantar!' };
    }
    // Put one carried item on the plate.
    if (this.hand.length > 0 && this.plate.items.length < 3) {
      const item = this.hand.shift();
      if (!item.processed) {
        // Raw items cannot go on a plate; hand it back.
        this.hand.unshift(item);
        this.flash = { text: 'Bahan harus diolah dulu!', ttl: 1.6 };
        return { event: 'bad', message: 'Bahan harus diolah dulu!' };
      }
      this.plate.items.push(item);
      if (this.plate.items.length === 3) {
        const dish = matchRecipe(this.plate.items);
        if (dish) {
          this.plate.dish = dish;
          return { event: 'plate-ready', message: dish.name + ' siap!' };
        }
        this.flash = { text: 'Bukan resep! Ambil lagi bahannya.', ttl: 1.8 };
        return { event: 'bad', message: 'Bukan resep!' };
      }
      return { event: 'drop', message: null };
    }
    // Take the items back off the plate.
    if (this.plate.items.length > 0 && this.hand.length === 0 && !this.carryingPlate) {
      this.hand = this.plate.items.splice(0);
      return { event: 'pickup', message: null };
    }
    this.flash = { text: 'Bawa 3 bahan olahan ke sini', ttl: 1.4 };
    return { event: 'bad', message: 'Bawa bahan dulu' };
  }

  useServe() {
    if (!this.carryingPlate) {
      this.flash = { text: 'Bawa piring hidangan ke sini', ttl: 1.4 };
      return { event: 'bad', message: 'Bawa piring dulu' };
    }
    const dish = this.carryingPlate;
    this.carryingPlate = null;
    return { event: 'serve', dish };
  }

  useTrash() {
    if (this.hand.length === 0 && !this.carryingPlate) {
      this.flash = { text: 'Tidak ada yang dibuang', ttl: 1.2 };
      return { event: 'bad', message: 'Tangan kosong' };
    }
    this.hand = [];
    this.carryingPlate = null;
    this.plate = { items: [], dish: null };
    return { event: 'drop', message: 'Dibuang' };
  }
}
