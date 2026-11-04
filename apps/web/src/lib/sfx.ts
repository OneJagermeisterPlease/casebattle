/**
 * Синтезированные звуки интерфейса (Web Audio API, без аудиофайлов).
 * Все функции безопасно вызывать на сервере и без поддержки Web Audio — они просто ничего не делают.
 */
import type { Rarity } from '@casebattle/shared';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'cc_muted';
const VOLUME = 0.55;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = false;
let mutedLoaded = false;
const listeners = new Set<() => void>();

function loadMuted() {
  if (mutedLoaded || typeof window === 'undefined') return;
  mutedLoaded = true;
  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // нет доступа к localStorage — звук включён
  }
}

export function isMuted() {
  loadMuted();
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
  mutedLoaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
  } catch {
    // ignore
  }
  if (master && ctx) master.gain.setTargetAtTime(v ? 0 : VOLUME, ctx.currentTime, 0.02);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** [muted, toggle] — состояние звука, общее для всего приложения. */
export function useMuted(): [boolean, () => void] {
  const m = useSyncExternalStore(subscribe, isMuted, () => false);
  return [m, () => setMuted(!isMuted())];
}

export const RARITY_LEVEL: Record<Rarity, number> = {
  consumer: 0,
  industrial: 1,
  milspec: 2,
  restricted: 3,
  classified: 4,
  covert: 5,
  gold: 6,
};

function audio(): { c: AudioContext; out: GainNode } | null {
  if (typeof window === 'undefined' || isMuted()) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 6;
    master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  if (ctx.state === 'closed' || !master) return null;
  return { c: ctx, out: master };
}

function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function env(c: AudioContext, at: number, peak: number, attack: number, decay: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  return g;
}

function tone(c: AudioContext, out: AudioNode, freq: number, at: number, peak: number, decay: number, type: OscillatorType = 'sine', attack = 0.005) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  const g = env(c, at, peak, attack, decay);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + attack + decay + 0.05);
}

let lastTick = 0;
/** Щелчок ячейки, проходящей маркер. `intensity` 0..1 — чем медленнее лента, тем отчётливее щелчок. */
export function tick(intensity = 1) {
  const a = audio();
  if (!a) return;
  const { c, out } = a;
  const now = c.currentTime;
  if (now - lastTick < 0.03) return;
  lastTick = now;
  const k = 0.45 + 0.55 * Math.min(1, Math.max(0, intensity));
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2600 + Math.random() * 900;
  bp.Q.value = 5;
  const g = env(c, now, 0.32 * k, 0.001, 0.035);
  src.connect(bp).connect(g).connect(out);
  src.start(now, Math.random() * 0.8, 0.06);
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(1500 + 300 * k, now);
  o.frequency.exponentialRampToValueAtTime(700, now + 0.03);
  const og = env(c, now, 0.07 * k, 0.001, 0.03);
  o.connect(og).connect(out);
  o.start(now);
  o.stop(now + 0.06);
}

let lastLand = 0;
/** Остановка рулетки: глухой удар + аккорд, чем реже предмет — тем ярче и длиннее. */
export function land(level = 0) {
  const a = audio();
  if (!a) return;
  const { c, out } = a;
  const now = c.currentTime;
  if (now - lastLand < 0.07) return;
  lastLand = now;
  // удар
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(170, now);
  o.frequency.exponentialRampToValueAtTime(48, now + 0.22);
  const og = env(c, now, 0.55, 0.004, 0.28);
  o.connect(og).connect(out);
  o.start(now);
  o.stop(now + 0.35);
  // аккорд
  const base = 330 * Math.pow(2, (level * 2) / 12);
  const ratios = level >= 4 ? [1, 1.26, 1.5, 2, 2.52] : [1, 1.26, 1.5];
  const decay = 0.5 + level * 0.18;
  ratios.forEach((r, i) => {
    const at = now + 0.02 + i * 0.045;
    tone(c, out, base * r, at, 0.12 - i * 0.012, decay);
    tone(c, out, base * r * 2.003, at, 0.03, decay * 0.6, 'triangle');
  });
  // блёстки для редких
  if (level >= 4) {
    for (let i = 0; i < 6 + level * 2; i++) {
      const at = now + 0.12 + Math.random() * 0.7;
      tone(c, out, 2400 + Math.random() * 2600, at, 0.025, 0.25 + Math.random() * 0.3);
    }
  }
}

/** Короткий восходящий «вжух» при старте прокрутки. */
export function whoosh(dur = 0.45) {
  const a = audio();
  if (!a) return;
  const { c, out } = a;
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(300, now);
  bp.frequency.exponentialRampToValueAtTime(2200, now + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.18, now + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(bp).connect(g).connect(out);
  src.start(now, 0, dur + 0.05);
}

/** Победная арпеджио-фанфара. */
export function win(big = false) {
  const a = audio();
  if (!a) return;
  const { c, out } = a;
  const now = c.currentTime;
  const notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const at = now + i * 0.075;
    tone(c, out, f, at, 0.13, 0.55 + i * 0.08, 'triangle');
    tone(c, out, f * 2, at, 0.035, 0.4);
  });
  for (let i = 0; i < 10; i++) tone(c, out, 3000 + Math.random() * 3000, now + 0.25 + Math.random() * 0.6, 0.02, 0.3);
}

/** Сдержанный нисходящий «провал». */
export function lose() {
  const a = audio();
  if (!a) return;
  const { c, out } = a;
  const now = c.currentTime;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1600, now);
  lp.frequency.exponentialRampToValueAtTime(300, now + 0.7);
  lp.connect(out);
  [311.13, 233.08].forEach((f, i) => {
    const at = now + i * 0.16;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, at);
    o.frequency.exponentialRampToValueAtTime(f * 0.94, at + 0.4);
    const g = env(c, at, 0.09, 0.01, 0.5);
    o.connect(g).connect(lp);
    o.start(at);
    o.stop(at + 0.6);
  });
  // треск «разбитого стекла»
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3500;
  const g = env(c, now, 0.12, 0.002, 0.22);
  src.connect(hp).connect(g).connect(out);
  src.start(now, 0.2, 0.3);
}
