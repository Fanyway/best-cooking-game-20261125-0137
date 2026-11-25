// DAPUR KILAT — app.js
// Boot, game loop, input and the shift state machine. The kitchen, the
// order board and the drawing live in their own files; this file only wires
// them together and decides what a key press or a click means.

import { Kitchen, STATIONS } from './kitchen.js';
import { makeOrderBoard, SHIFT_SECONDS } from './orders.js';
import { findRecipeById } from './recipes.js';
import { drawGame } from './render.js';
import { sfx, unlockAudio, toggleMute, isMuted } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Small deterministic RNG so a screenshot scene can be built the same way
// every time; normal play seeds it from the clock.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const state = {
  phase: 'title', // title | playing | paused | done
  kitchen: new Kitchen(),
  board: makeOrderBoard(Math.random),
  elapsed: 0,
  timeLeft: SHIFT_SECONDS,
  messages: [],
  muted: false,
  frozen: false, // screenshot mode: the scene is posed and never advances
  rush90: false,
  rush150: false,
};

function addMessage(text, x, y, color, size) {
  state.messages.push({ text, x, y, ttl: 1.6, color: color || '#ffd166', size: size || 22 });
}

function startShift() {
  state.kitchen = new Kitchen();
  state.board = makeOrderBoard(Math.random);
  state.elapsed = 0;
  state.timeLeft = SHIFT_SECONDS;
  state.messages = [];
  state.frozen = false;
  state.rush90 = false;
  state.rush150 = false;
  state.phase = 'playing';
  sfx.newOrder();
}

// ---- screenshot scenes --------------------------------------------------
// ?shot=kitchen | ?shot=assembly | ?shot=serve poses one frozen moment so
// each screenshot shows what the bounty asks for: the kitchen and order
// board, ingredients on the counter, one dish mid-assembly, a timer, and a
// plate ready to serve.

function applyShot(name) {
  const k = state.kitchen;
  const b = state.board;
  state.phase = 'playing';
  state.frozen = true;
  const nasiGoreng = findRecipeById('nasi-goreng');
  const mieAyam = findRecipeById('mie-ayam');
  const sotoAyam = findRecipeById('soto-ayam');

  if (name === 'assembly') {
    state.elapsed = 90;
    state.timeLeft = 90;
    b.score = 370;
    b.combo = 3;
    b.bestCombo = 3;
    b.served = 3;
    b.tickets = [
      { id: 11, recipe: nasiGoreng, total: 70, left: 32, warned: false },
      { id: 12, recipe: mieAyam, total: 65, left: 50, warned: false },
    ];
    k.player.x = 895;
    k.player.y = 452;
    k.player.facing = 1;
    k.hand = [{ id: 'kecap', processed: true }];
    k.plate.items = [
      { id: 'nasi', processed: true },
      { id: 'telur', processed: true },
    ];
    k.plate.dish = null;
    k.board.item = { id: 'ayam', processed: false };
    k.board.progress = 0.4;
    k.board.done = false;
    k.wok.item = { id: 'mie', processed: false };
    k.wok.progress = 0.6;
    k.wok.done = false;
  } else if (name === 'serve') {
    state.elapsed = 120;
    state.timeLeft = 60;
    b.score = 480;
    b.combo = 4;
    b.bestCombo = 4;
    b.served = 4;
    b.tickets = [
      { id: 21, recipe: nasiGoreng, total: 70, left: 18, warned: true },
      { id: 22, recipe: mieAyam, total: 65, left: 40, warned: false },
      { id: 23, recipe: sotoAyam, total: 70, left: 58, warned: false },
    ];
    k.player.x = 1030;
    k.player.y = 330;
    k.player.facing = 1;
    k.hand = [];
    k.carryingPlate = nasiGoreng;
    k.plate.items = [];
    k.plate.dish = null;
    k.wok.item = { id: 'telur', processed: true };
    k.wok.progress = 1;
    k.wok.done = true;
  } else {
    // kitchen: the everyday rush, everything visible at once.
    state.elapsed = 65;
    state.timeLeft = 115;
    b.score = 250;
    b.combo = 2;
    b.bestCombo = 2;
    b.served = 2;
    b.tickets = [
      { id: 1, recipe: nasiGoreng, total: 70, left: 45, warned: false },
      { id: 2, recipe: mieAyam, total: 65, left: 28, warned: false },
      { id: 3, recipe: sotoAyam, total: 70, left: 55, warned: false },
    ];
    k.player.x = 460;
    k.player.y = 470;
    k.player.facing = 1;
    k.hand = [{ id: 'nasi', processed: true }];
    k.board.item = { id: 'ayam', processed: false };
    k.board.progress = 0.4;
    k.board.done = false;
    k.wok.item = { id: 'mie', processed: false };
    k.wok.progress = 0.6;
    k.wok.done = false;
  }
}

// ---- input ---------------------------------------------------------------

const keys = { left: false, right: false, up: false, down: false };

function keyDir(code) {
  if (code === 'KeyA' || code === 'ArrowLeft') return 'left';
  if (code === 'KeyD' || code === 'ArrowRight') return 'right';
  if (code === 'KeyW' || code === 'ArrowUp') return 'up';
  if (code === 'KeyS' || code === 'ArrowDown') return 'down';
  return null;
}

function canvasPos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1280,
    y: ((event.clientY - rect.top) / rect.height) * 720,
  };
}

function handleInteract() {
  if (state.phase !== 'playing' || state.frozen) return;
  const result = state.kitchen.interact();
  if (!result) return;
  applyInteractResult(result);
}

function applyInteractResult(result) {
  const k = state.kitchen;
  if (result.event === 'pickup') sfx.pickup();
  else if (result.event === 'drop') sfx.drop();
  else if (result.event === 'chop') sfx.chop();
  else if (result.event === 'sizzle') sfx.sizzle();
  else if (result.event === 'plate-ready') sfx.plateReady();
  else if (result.event === 'bad') sfx.serveBad();
  else if (result.event === 'serve') {
    const served = state.board.serve(result.dish);
    if (served.ok) {
      sfx.serveGood();
      addMessage('+' + served.points + '  ' + served.recipe.name + '!', 1175, 240, '#8dff9a', 26);
      if (served.combo >= 2) addMessage('KOMBO x' + served.combo, 1175, 275, '#ff8c42', 22);
    } else {
      sfx.serveBad();
      addMessage('Salah hidangan! -50', 1175, 240, '#ff8a70', 24);
    }
  }
  if (result.message && result.event !== 'serve') {
    addMessage(result.message, k.player.x, k.player.y - 70, '#ffe9bd', 18);
  }
}

window.addEventListener('keydown', (event) => {
  const dir = keyDir(event.code);
  if (dir) {
    keys[dir] = true;
    event.preventDefault();
    return;
  }
  if (event.code === 'Enter') {
    unlockAudio();
    if (state.phase === 'title') startShift();
    return;
  }
  if (event.code === 'Space' || event.code === 'KeyE') {
    unlockAudio();
    if (state.phase === 'playing') handleInteract();
    event.preventDefault();
    return;
  }
  if (event.code === 'KeyP') {
    if (state.phase === 'playing') state.phase = 'paused';
    else if (state.phase === 'paused') state.phase = 'playing';
    return;
  }
  if (event.code === 'KeyM') {
    state.muted = toggleMute();
    return;
  }
  if (event.code === 'KeyR') {
    if (state.phase !== 'title') startShift();
  }
});

window.addEventListener('keyup', (event) => {
  const dir = keyDir(event.code);
  if (dir) keys[dir] = false;
});

canvas.addEventListener('pointerdown', (event) => {
  unlockAudio();
  if (state.phase === 'title') {
    startShift();
    return;
  }
  if (state.phase !== 'playing' || state.frozen) return;
  const pos = canvasPos(event);
  state.kitchen.clickAt(pos.x, pos.y);
  sfx.click();
});

// ---- loop ----------------------------------------------------------------

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.phase === 'playing' && !state.frozen) {
    state.elapsed += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

    const events = state.kitchen.update(dt, keys);
    for (const e of events) {
      if (e === 'chop') sfx.chop();
      else if (e === 'chop-done') sfx.chopDone();
      else if (e === 'sizzle') sfx.sizzle();
      else if (e === 'cook-done') sfx.cookDone();
    }

    const boardEvent = state.board.update(dt, state.elapsed);
    if (boardEvent === 'new-order') sfx.newOrder();
    else if (boardEvent === 'ticket-low') sfx.tick();
    else if (boardEvent === 'expired') {
      sfx.expired();
      addMessage('Pesanan hangus!', 640, 120, '#ff8a70', 24);
    }

    if (!state.rush90 && state.elapsed >= 90) {
      state.rush90 = true;
      sfx.rush();
      addMessage('JAM RAMAI! Pesanan makin cepat!', 640, 150, '#ff8c42', 26);
    }
    if (!state.rush150 && state.elapsed >= 150) {
      state.rush150 = true;
      sfx.rush();
      addMessage('JAM RAMAI! Bertahan sampai shift selesai!', 640, 150, '#ff8c42', 26);
    }

    for (const m of state.messages) {
      m.ttl -= dt;
      m.y -= 24 * dt;
    }
    state.messages = state.messages.filter((m) => m.ttl > 0);

    if (state.timeLeft <= 0) {
      state.phase = 'done';
      sfx.plateReady();
    }
  }

  state.muted = isMuted();
  drawGame(ctx, state);
  requestAnimationFrame(frame);
}

// ---- boot ----------------------------------------------------------------

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot === 'kitchen' || shot === 'assembly' || shot === 'serve') {
  applyShot(shot);
} else {
  // A little life behind the title screen: a posed kitchen, frozen.
  applyShot('kitchen');
  state.phase = 'title';
  state.frozen = true;
}
requestAnimationFrame(frame);
