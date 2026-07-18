"use client";

// Lightweight synthesized sound manager using the Web Audio API — no asset
// files needed, and every sound can be muted.
//
// ContinentalXI's immersion comes from ATMOSPHERE, not narration: a living
// stadium crowd bed, layered broadcast cues, and dynamic swells that react to
// the match. There is deliberately no voice/commentary/TTS here — the picture
// and the crowd tell the story.
//
// Everything routes through a single master gain (headroom + one place to set
// volume) and is guarded so the same cue can't machine-gun when many events
// land on one tick. Cues are layered — a goal is a crowd-swell of noise under
// rising tones, a trophy is a brass fanfare over an applause bed — so the
// palette reads as "broadcast", not "beeps".

type SoundName =
  | "flip" | "click" | "select" | "goal" | "whistle"
  | "win" | "lose" | "trophy" | "hover" | "error"
  // layered additions
  | "save" | "unlock" | "advance" | "draw" | "kick" | "menu"
  // broadcast cues (Live Match 2.0)
  | "crossbar" | "sub" | "heartbeat" | "tick" | "var" | "card" | "tackle" | "net"
  // immersive stadium palette — crowd reactions, ball physics, woodwork
  | "post" | "ooh" | "roar" | "chant" | "drum"
  | "pass" | "cross" | "header" | "clearance" | "shot" | "catch" | "punch";

/** Competition flavour for the crowd bed. */
export type AmbienceVariant = "cl" | "euro" | "copa";

// tiny per-call variety so the same cue never sounds identical twice
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const choose = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let masterVolume: number | null = null;

// last time (in ctx seconds) each cue fired — kills duplicate stacking
const lastAt: Record<string, number> = {};

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.setValueAtTime(0.9 * getMasterVolume(), ctx.currentTime);
    master.connect(ctx.destination);
  }
  return ctx;
}

function bus(): AudioNode | null {
  return ac() ? master : null;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (!on) stopAmbience(0.2);
}

export function isSoundEnabled() {
  return enabled;
}

/* ---------------------------------------------------------------- */
/*  Master volume — one knob for the whole mix (persisted).          */
/* ---------------------------------------------------------------- */

export function getMasterVolume(): number {
  if (masterVolume === null) {
    try { masterVolume = Math.max(0, Math.min(1, Number(localStorage.getItem("cxi-volume") ?? "1") || 1)); }
    catch { masterVolume = 1; }
  }
  return masterVolume;
}

export function setMasterVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
  try { localStorage.setItem("cxi-volume", String(masterVolume)); } catch { /* private mode */ }
  if (ctx && master) master.gain.setTargetAtTime(0.9 * masterVolume, ctx.currentTime, 0.05);
}

/* ---------------------------------------------------------------- */
/*  Synthesis primitives.                                            */
/* ---------------------------------------------------------------- */

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

/* ---------------------------------------------------------------- */
/*  Crowd ambience — a continuous, quiet stadium bed that fades in    */
/*  for live broadcasts and out when they end. One instance only.     */
/*  The bed is dynamic: it swells for attacks/goals and hushes before  */
/*  penalties, so the atmosphere carries the story on its own.         */
/* ---------------------------------------------------------------- */

let amb: { src: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode; base: number; extra: OscillatorNode[] } | null = null;

// Each competition's stadium has its own voice: a wide elegant European murmur
// for the CL, a brighter chant-surging terrace for the EURO, a warmer crowd with
// a samba-drum pulse for Copa América. Tuned via the crowd bed's band-pass and a
// per-competition rhythm oscillator layered onto the gain.
const AMB_TUNE: Record<AmbienceVariant, { freq: number; q: number; rhythmHz: number; rhythmDepth: number }> = {
  cl: { freq: 640, q: 0.5, rhythmHz: 0, rhythmDepth: 0 },
  euro: { freq: 700, q: 0.6, rhythmHz: 0.5, rhythmDepth: 0.5 },
  copa: { freq: 540, q: 0.72, rhythmHz: 1.9, rhythmDepth: 0.6 },
};

export function startAmbience(level = 0.016, variant: AmbienceVariant = "cl") {
  if (!enabled) return;
  const a = ac();
  const out = bus();
  if (!a || !out || amb) return;
  if (a.state === "suspended") a.resume();
  const tune = AMB_TUNE[variant];

  // 2s of noise, looped, band-passed into a distant-crowd murmur
  const buffer = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = tune.freq;
  bp.Q.value = tune.q;
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(level, a.currentTime + 1.6);
  // slow swell — the crowd breathes (LFO wobbles the gain gently)
  const lfo = a.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoDepth = a.createGain();
  lfoDepth.gain.value = level * 0.45;
  lfo.connect(lfoDepth).connect(gain.gain);
  const extra: OscillatorNode[] = [];
  // per-competition rhythm: EURO chant surges, Copa's drum pulse
  if (tune.rhythmHz > 0) {
    const r = a.createOscillator();
    r.type = "sine";
    r.frequency.value = tune.rhythmHz;
    const rd = a.createGain();
    rd.gain.value = level * tune.rhythmDepth;
    r.connect(rd).connect(gain.gain);
    r.start();
    extra.push(r);
  }
  src.connect(bp).connect(gain).connect(out);
  src.start();
  lfo.start();
  amb = { src, gain, lfo, base: level, extra };
}

/** Raise the resting crowd noise as a match reaches its climax (80'+, 90', ET). */
export function setAmbienceTension(mult = 1.5) {
  const a = ctx;
  if (!a || !amb) return;
  const target = Math.min(0.06, amb.base * mult);
  amb.gain.gain.cancelScheduledValues(a.currentTime);
  amb.gain.gain.setTargetAtTime(target, a.currentTime, 1.4);
  amb.base = target; // swells and hushes now relax to the tenser baseline
}

/** The crowd rises for a moment — goals, big saves, late drama, attacks. */
export function swellAmbience(peak = 0.05, dur = 1.6) {
  const a = ctx;
  if (!a || !amb) return;
  const g = amb.gain.gain;
  g.cancelScheduledValues(a.currentTime);
  g.setTargetAtTime(peak, a.currentTime, 0.12);
  g.setTargetAtTime(amb.base, a.currentTime + dur, 0.5);
}

/** The stadium holds its breath — penalties, VAR checks, big moments. */
export function hushAmbience(dur = 2.4) {
  const a = ctx;
  if (!a || !amb) return;
  const g = amb.gain.gain;
  g.cancelScheduledValues(a.currentTime);
  g.setTargetAtTime(amb.base * 0.25, a.currentTime, 0.25);
  g.setTargetAtTime(amb.base, a.currentTime + dur, 0.6);
}

export function stopAmbience(fade = 1.2) {
  const a = ctx;
  if (!a || !amb) return;
  const { src, gain, lfo, extra } = amb;
  amb = null;
  try {
    gain.gain.cancelScheduledValues(a.currentTime);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + fade);
    src.stop(a.currentTime + fade + 0.05);
    lfo.stop(a.currentTime + fade + 0.05);
    extra.forEach((o) => o.stop(a.currentTime + fade + 0.05));
  } catch {
    try { src.stop(); lfo.stop(); extra.forEach((o) => o.stop()); } catch { /* already stopped */ }
  }
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
    case "net":
      // ball hits the net — soft rustle + low ripple
      noise(0, 0.13, 0.035); tone(240, 0, 0.1, "sine", 0.03); tone(180, 0.03, 0.14, "sine", 0.025);
      break;
    case "tackle":
      // sliding challenge — short grassy scrape with a thud
      noise(0, 0.1, 0.05); tone(120, 0.01, 0.09, "sine", 0.05);
      break;
    case "goal": {
      // The stadium erupts — but never the same way twice. Crowd size, pitch of
      // the roar, the celebration motif and the net ripple all vary per goal.
      const big = rand(0.5, 1);                 // how loud this end is tonight
      crowd(0, rand(0.85, 1.35), 0.06 + big * 0.05, rand(680, 1000));
      noise(0, rand(0.1, 0.18), 0.03);
      // celebration motif — a rising cheer, rooted differently each time
      const motifs = [[392, 523, 659], [349, 440, 587], [440, 554, 659], [330, 494, 622], [415, 523, 698]];
      choose(motifs).forEach((f, i) => tone(f, i * rand(0.09, 0.13), 0.16 + i * 0.06, "sawtooth", 0.048 + big * 0.012));
      if (Math.random() > 0.4) tone(rand(220, 260), rand(0.03, 0.07), 0.11, "sine", 0.026); // net ripple, sometimes
      break;
    }
    case "save":
      // a firm denial — punch of noise then a short descending sting
      noise(0, 0.12, 0.05); sweep(520, 180, 0.02, 0.22, "sawtooth", 0.045);
      break;
    case "whistle": tone(2100, 0, 0.18, "sine", 0.05); tone(2600, 0.02, 0.16, "sine", 0.04); break;
    case "var":
      // modern review sting — a clean two-note electronic ident with a soft murmur
      tone(660, 0, 0.12, "sine", 0.045); tone(990, 0.13, 0.2, "sine", 0.04); crowd(0.05, 0.7, 0.03, 600);
      break;
    case "card":
      // referee's card — a sharp administrative blip
      tone(880, 0, 0.05, "square", 0.04); tone(1046, 0.06, 0.09, "triangle", 0.04);
      break;
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
    case "crossbar":
      // the bar — a high metallic ring that echoes, then the crowd's "ohhh"
      noise(0, 0.05, 0.06); tone(1244, 0, rand(0.42, 0.55), "triangle", 0.05); tone(1867, 0.005, 0.34, "sine", 0.03);
      tone(1244, 0.16, 0.3, "sine", 0.018); // faint echo tail
      crowd(0.06, 0.7, 0.05, 560);
      break;
    case "post":
      // the upright — a lower, shorter metallic clank (no long echo), then a groan
      noise(0, 0.04, 0.06); tone(rand(820, 900), 0, 0.26, "triangle", 0.05); tone(1320, 0.004, 0.18, "sine", 0.026);
      crowd(0.04, 0.62, 0.048, 520);
      break;
    case "ooh":
      // a collective near-miss gasp — swells up then sighs back down
      crowd(0, 0.8, 0.05, rand(520, 600)); sweep(300, 190, 0.06, 0.5, "sine", 0.02);
      break;
    case "roar":
      // a big non-goal surge — a save held up, a last-gasp scramble
      crowd(0, 0.85, 0.06, rand(760, 960)); noise(0, 0.1, 0.025);
      break;
    case "chant":
      // EURO terraces — a short "oh-oh-oh" cadence over the bed
      [0, 0.2, 0.4].forEach((s) => { tone(rand(190, 210), s, 0.15, "sawtooth", 0.03); crowd(s, 0.17, 0.03, 700); });
      break;
    case "drum":
      // Copa samba — one deep terrace drum
      tone(rand(84, 96), 0, 0.2, "sine", 0.09); noise(0, 0.05, 0.035);
      break;
    case "pass":
      // a crisp short pass — a soft leather touch
      noise(0, 0.03, 0.028); tone(rand(280, 340), 0, 0.05, "sine", 0.03);
      break;
    case "cross":
      // a whipped ball into the box
      noise(0, 0.05, 0.035); sweep(rand(460, 540), rand(720, 820), 0.01, 0.13, "triangle", 0.028);
      break;
    case "header":
      // head meets ball — a dull thud
      noise(0, 0.05, 0.045); tone(rand(190, 220), 0, 0.06, "sine", 0.042);
      break;
    case "clearance":
      // a big defensive boot upfield
      noise(0, 0.07, 0.06); tone(rand(130, 155), 0, 0.1, "sine", 0.06); sweep(360, 740, 0.02, 0.17, "triangle", 0.03);
      break;
    case "shot":
      // a struck effort — cleaner and harder than a pass
      noise(0, 0.05, 0.055); tone(rand(160, 185), 0, 0.08, "sine", 0.058); sweep(rand(480, 540), rand(940, 1040), 0.01, 0.13, "sawtooth", 0.03);
      break;
    case "catch":
      // the keeper gathers — gloves grip the ball
      noise(0, 0.08, 0.04); tone(rand(150, 175), 0.01, 0.07, "sine", 0.033);
      break;
    case "punch":
      // the keeper punches clear — a firm double contact
      noise(0, 0.06, 0.055); tone(rand(170, 195), 0, 0.07, "triangle", 0.05);
      break;
    case "sub":
      // board goes up — soft descending then ascending chirp
      sweep(760, 420, 0, 0.12, "sine", 0.035); sweep(420, 760, 0.14, 0.12, "sine", 0.035);
      break;
    case "heartbeat":
      // penalty tension — two low thumps
      tone(72, 0, 0.12, "sine", 0.09); tone(64, 0.22, 0.16, "sine", 0.07);
      break;
    case "tick": tone(1180, 0, 0.035, "sine", 0.025); break;
  }
}
