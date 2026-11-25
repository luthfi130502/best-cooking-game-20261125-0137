// Ember & Thyme — Rush Hour Kitchen
// audio.js — one job: every sound, synthesized live with WebAudio.
// No audio files, no network: oscillators and filtered noise only.

let ctx = null;
let master = null;
let musicTimer = null;
let muted = false;
let musicOn = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = muted ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo = null) {
  const c = ensureCtx();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq, when = 0) {
  const c = ensureCtx();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(520, 0.08, 'triangle', 0.16); },
  drop() { tone(300, 0.09, 'triangle', 0.16, 0, 210); },
  chop() {
    noiseBurst(0.07, 0.5, 900);
    tone(140, 0.09, 'square', 0.12, 0, 90);
  },
  chopDone() {
    tone(660, 0.1, 'triangle', 0.18);
    tone(880, 0.14, 'triangle', 0.18, 0.07);
  },
  sizzle() { noiseBurst(0.35, 0.22, 3200); },
  cooked() {
    tone(740, 0.12, 'sine', 0.2);
    tone(988, 0.18, 'sine', 0.2, 0.1);
  },
  burnt() { tone(220, 0.3, 'sawtooth', 0.14, 0, 110); },
  serve() {
    tone(523, 0.12, 'triangle', 0.22);
    tone(659, 0.12, 'triangle', 0.22, 0.09);
    tone(784, 0.2, 'triangle', 0.24, 0.18);
  },
  coin() {
    tone(988, 0.09, 'square', 0.1);
    tone(1319, 0.16, 'square', 0.1, 0.07);
  },
  wrong() {
    tone(196, 0.16, 'sawtooth', 0.14);
    tone(155, 0.24, 'sawtooth', 0.14, 0.12);
  },
  orderIn() {
    tone(392, 0.1, 'triangle', 0.16);
    tone(523, 0.14, 'triangle', 0.16, 0.08);
  },
  timeout() {
    tone(330, 0.2, 'triangle', 0.18, 0, 220);
    tone(220, 0.32, 'triangle', 0.18, 0.16, 147);
  },
  click() { tone(700, 0.05, 'square', 0.1); },
  rush() {
    tone(440, 0.14, 'square', 0.14);
    tone(440, 0.14, 'square', 0.14, 0.18);
    tone(554, 0.22, 'square', 0.16, 0.36);
  },
};

// A sleepy little kitchen waltz: soft triangle arpeggios over a warm bass.
// Scheduled a bar at a time so it never drifts.
const MELODY = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 988, 880, 784, 659, 587];
const BASS = [131, 131, 196, 165, 131, 131, 196, 220];
let musicStep = 0;

export function startMusic() {
  if (musicOn || !ensureCtx()) return;
  musicOn = true;
  const stepMs = 240;
  musicTimer = setInterval(() => {
    if (muted || !ctx) return;
    const i = musicStep % MELODY.length;
    const b = BASS[Math.floor(musicStep / 2) % BASS.length];
    tone(MELODY[i], 0.22, 'triangle', 0.055);
    if (musicStep % 2 === 0) tone(b, 0.42, 'sine', 0.09);
    musicStep++;
  }, stepMs);
}

export function stopMusic() {
  musicOn = false;
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
