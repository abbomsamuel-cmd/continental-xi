"use client";

// Lightweight synthesized sound manager using the Web Audio API — no asset
// files needed, and every sound can be muted.
//
// Everything is routed through a single master gain (headroom + one place to
// duck the whole mix) and guarded so the same cue can't machine-gun when many
// events land on the same tick. Cues are layered — a goal is a crowd-swell of
// noise under rising tones, a trophy is a brass fanfare over an applause bed —
// so the palette reads as "broadcast", not "beeps".

type SoundName =
  | "flip" | "click" | "select" | "goal" | "whistle"
  | "win" | "lose" | "trophy" | "hover" | "error"
  // layered additions
  | "save" | "unlock" | "advance" | "draw" | "kick" | "menu";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

// last time (in ctx seconds) each cue fired — kills duplicate stacking
const lastAt: Record<string, number> = {};

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.setValueAtTime(0.9, ctx.currentTime);
    master.connect(ctx.destination);
  }
  return ctx;
}

function bus(): AudioNode | null {
  return ac() ? master : null;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  const a = ac();
  const out = bus();
  if (!a || !out) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  osc.connect(g).connect(out);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur + 0.02);
}

/** A tone that glides between two pitches — used for whistles and swells. */
function sweep(from: number, to: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.06) {
  const a = ac();
  const out = bus();
  if (!a || !out) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, a.currentTime + start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), a.currentTime + start + dur);
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  osc.connect(g).connect(out);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur + 0.02);
}

function noise(start: number, dur: number, gain = 0.05) {
  const a = ac();
  const out = bus();
  if (!a || !out) return;
  const buffer = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buffer;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, a.currentTime + start);
  src.connect(g).connect(out);
  src.start(a.currentTime + start);
}

/** A soft crowd-swell: band-passed noise that rises and falls like applause. */
function crowd(start: number, dur: number, peak = 0.05, freq = 900) {
  const a = ac();
  const out = bus();
  if (!a || !out) return;
  const buffer = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, a.currentTime + start);
  bp.Q.setValueAtTime(0.7, a.currentTime + start);
  const g = a.createGain();
  const t0 = a.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(out);
  src.start(t0);
}

export function play(name: SoundName) {
  if (!enabled) return;
  const a = ac();
  if (!a) return;
  if (a.state === "suspended") a.resume();

  // de-dupe: ignore a repeat of the same cue within a short window so
  // simultaneous events (two goals on one tick, rapid taps) never stack.
  const now = a.currentTime;
  const gap = name === "hover" || name === "click" ? 0.04 : 0.07;
  if (lastAt[name] !== undefined && now - lastAt[name] < gap) return;
  lastAt[name] = now;

  switch (name) {
    case "hover": tone(880, 0, 0.05, "sine", 0.02); break;
    case "click": tone(520, 0, 0.06, "triangle", 0.05); break;
    case "menu": tone(440, 0, 0.07, "sine", 0.035); tone(660, 0.04, 0.08, "sine", 0.03); break;
    case "flip": tone(300, 0, 0.08, "square", 0.04); tone(600, 0.05, 0.08, "square", 0.03); break;
    case "select":
      tone(523, 0, 0.1, "triangle", 0.06); tone(659, 0.08, 0.1, "triangle", 0.06); tone(784, 0.16, 0.16, "triangle", 0.06);
      break;
    case "kick":
      // leather thump then the ball's flight
      noise(0, 0.06, 0.06); tone(150, 0, 0.09, "sine", 0.06); sweep(420, 900, 0.02, 0.14, "triangle", 0.03);
      break;
    case "goal":
      // crowd erupts under a rising fanfare
      crowd(0, 0.7, 0.06, 800);
      tone(392, 0, 0.15, "sawtooth", 0.05); tone(523, 0.12, 0.15, "sawtooth", 0.05); tone(659, 0.24, 0.32, "sawtooth", 0.06);
      break;
    case "save":
      // a firm denial — punch of noise then a short descending sting
      noise(0, 0.12, 0.05); sweep(520, 180, 0.02, 0.22, "sawtooth", 0.045);
      break;
    case "whistle": tone(2100, 0, 0.18, "sine", 0.05); tone(2600, 0.02, 0.16, "sine", 0.04); break;
    case "draw":
      // suspense swell for a draw / round reveal
      sweep(180, 520, 0, 0.5, "sine", 0.04); crowd(0.1, 0.6, 0.03, 600);
      break;
    case "advance":
      // progression — a confident two-note lift with a light crowd bed
      tone(523, 0, 0.16, "triangle", 0.06); tone(784, 0.12, 0.28, "triangle", 0.06); crowd(0, 0.5, 0.035, 900);
      break;
    case "win":
      crowd(0, 0.7, 0.04, 1000);
      [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.35, "triangle", 0.06));
      break;
    case "lose": tone(392, 0, 0.3, "sine", 0.05); tone(294, 0.2, 0.5, "sine", 0.05); break;
    case "unlock":
      // secret discovered — a bright shimmer with a soft sparkle tail
      tone(784, 0, 0.14, "triangle", 0.05); tone(1046, 0.09, 0.16, "triangle", 0.055); tone(1568, 0.2, 0.4, "sine", 0.045);
      crowd(0, 0.4, 0.025, 1400);
      break;
    case "trophy":
      // applause bed under a five-note brass fanfare
      crowd(0, 1.0, 0.055, 850); noise(0, 0.8, 0.04);
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.1, 0.5, "triangle", 0.06));
      break;
    case "error": tone(196, 0, 0.2, "sawtooth", 0.05); break;
  }
}
