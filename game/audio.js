// DAPUR KILAT — audio.js
// All sounds are made with WebAudio oscillators and a generated noise buffer.
// No audio files, no network. The context is created on the first user
// gesture, so the game never plays sound before the player interacts.

let ctx = null;
let muted = false;
let noiseBuffer = null;

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const len = Math.floor(ctx.sampleRate * 0.25);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureContext();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, vol, filterFreq, when = 0) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac || !noiseBuffer) return;
  const t0 = ac.currentTime + when;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

export const sfx = {
  pickup() { tone(520, 0.09, 'sine', 0.16); },
  drop() { tone(300, 0.08, 'sine', 0.12); },
  chop() { noise(0.07, 0.25, 1800); tone(180, 0.06, 'square', 0.10); },
  chopDone() { tone(660, 0.08, 'sine', 0.16); tone(880, 0.12, 'sine', 0.16, 0.07); },
  sizzle() { noise(0.35, 0.10, 5200); },
  cookDone() { tone(740, 0.09, 'sine', 0.16); tone(990, 0.14, 'sine', 0.16, 0.08); },
  plateReady() { tone(523, 0.10, 'triangle', 0.18); tone(659, 0.10, 'triangle', 0.18, 0.09); tone(784, 0.16, 'triangle', 0.18, 0.18); },
  serveGood() { tone(523, 0.10, 'triangle', 0.20); tone(659, 0.10, 'triangle', 0.20, 0.09); tone(784, 0.10, 'triangle', 0.20, 0.18); tone(1046, 0.22, 'triangle', 0.22, 0.27); },
  serveBad() { tone(220, 0.18, 'sawtooth', 0.14, 0, 160); tone(160, 0.22, 'sawtooth', 0.14, 0.12, 110); },
  expired() { tone(392, 0.14, 'square', 0.10, 0, 300); tone(311, 0.2, 'square', 0.10, 0.12, 233); },
  tick() { tone(1200, 0.05, 'sine', 0.10); },
  newOrder() { tone(880, 0.08, 'sine', 0.14); tone(1174, 0.10, 'sine', 0.14, 0.07); },
  click() { tone(700, 0.05, 'sine', 0.10); },
  rush() { tone(587, 0.12, 'triangle', 0.16); tone(587, 0.12, 'triangle', 0.16, 0.14); tone(880, 0.2, 'triangle', 0.18, 0.28); },
};
