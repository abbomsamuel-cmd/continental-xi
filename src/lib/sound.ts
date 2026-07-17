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
  | "save" | "unlock" | "advance" | "draw" | "kick" | "menu"
  // broadcast cues (Live Match 2.0)
  | "crossbar" | "sub" | "heartbeat" | "tick";

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
  if (!on) {
    stopAmbience(0.2);
    stopSpeaking();
  }
}

/* ---------------------------------------------------------------- */
/*  AI commentary voice 2.0 — a broadcast caller, not a narrator.    */
/*                                                                    */
/*  · Three modes: off · key moments · full commentary (persisted)    */
/*  · Three deliveries: broadcast · energetic · calm (persisted)      */
/*  · Event-energy tiers: calm info, urgent chances, goal roars,      */
/*    respectful eliminations — never one flat tone                   */
/*  · Natural EN + ES lines built per event (never robot-reads the    */
/*    on-screen text), with a pronunciation dictionary for names      */
/*  · Ducks the effect bus while talking; never overlaps itself;      */
/*    goes silent when the tab hides; every event speaks only once    */
/* ---------------------------------------------------------------- */

export type VoiceMode = "off" | "key" | "full";
export type VoiceStyle = "broadcast" | "energetic" | "calm";
type VoiceEnergy = "calm" | "urgent" | "roar" | "somber";

let voiceMode: VoiceMode | null = null;
let voiceStyle: VoiceStyle | null = null;
let masterVolume: number | null = null;
let lastSpokenId = "";
let visibilityHooked = false;

function loadPref<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    if (v && valid.includes(v)) return v;
  } catch { /* private mode */ }
  return fallback;
}

export function getVoiceMode(): VoiceMode {
  if (voiceMode === null) {
    voiceMode = loadPref("cxi-voice-mode", ["off", "key", "full"] as const, "off");
    // migrate the old boolean toggle
    try {
      if (localStorage.getItem("cxi-voice-mode") === null && localStorage.getItem("cxi-voice") === "1") voiceMode = "key";
    } catch { /* private mode */ }
  }
  return voiceMode;
}

export function setVoiceMode(mode: VoiceMode) {
  voiceMode = mode;
  try { localStorage.setItem("cxi-voice-mode", mode); } catch { /* private mode */ }
  if (mode === "off") stopSpeaking();
}

export function getVoiceStyle(): VoiceStyle {
  if (voiceStyle === null) voiceStyle = loadPref("cxi-voice-style", ["broadcast", "energetic", "calm"] as const, "broadcast");
  return voiceStyle;
}

export function setVoiceStyle(style: VoiceStyle) {
  voiceStyle = style;
  try { localStorage.setItem("cxi-voice-style", style); } catch { /* private mode */ }
}

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

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  unduck();
}

/** Tricky names the synthesiser would otherwise butcher. */
const SAY: [RegExp, string][] = [
  [/Mbappé/g, "Embappay"], [/Müller/g, "Mueller"], [/Bayern München/g, "Bayern Munich"],
  [/Modrić/g, "Modrich"], [/Suárez/g, "Swahrez"], [/Piqué/g, "Peekay"],
  [/Xavi/g, "Chahvi"], [/Iniesta/g, "Inyesta"], [/Kroos/g, "Krohss"],
  [/Ibrahimović/g, "Ibrahimovitch"], [/Lewandowski/g, "Levandovski"],
  [/Čech/g, "Check"], [/Šev/g, "Shev"], [/ć/g, "ch"], [/š/g, "sh"], [/ž/g, "zh"],
  [/Copa América/g, "Copa America"],
];

function pronounce(text: string): string {
  let out = text;
  for (const [re, sub] of SAY) out = out.replace(re, sub);
  return out;
}

const voiceCache: { en?: SpeechSynthesisVoice; es?: SpeechSynthesisVoice } = {};

function pickVoice(lang: "en" | "es"): SpeechSynthesisVoice | undefined {
  const cached = voiceCache[lang];
  if (cached) return cached;
  const all = window.speechSynthesis.getVoices();
  const prefer = lang === "en"
    ? ["Daniel", "Google UK English Male", "Google US English", "Samantha", "Alex"]
    : ["Mónica", "Monica", "Google español", "Paulina", "Jorge"];
  const found =
    all.find((v) => prefer.some((p) => v.name.includes(p))) ??
    all.find((v) => v.lang.startsWith(lang) && v.localService) ??
    all.find((v) => v.lang.startsWith(lang));
  if (found) voiceCache[lang] = found;
  return found;
}

function currentLang(): "en" | "es" {
  try { return localStorage.getItem("cxi-lang") === "es" ? "es" : "en"; } catch { return "en"; }
}

/** Duck every synthesised effect while the caller is talking. */
function duck() {
  if (ctx && master) master.gain.setTargetAtTime(0.9 * getMasterVolume() * 0.45, ctx.currentTime, 0.08);
}
function unduck() {
  if (ctx && master) master.gain.setTargetAtTime(0.9 * getMasterVolume(), ctx.currentTime, 0.25);
}

// delivery presets: [rate, pitch] per style, nudged per event energy
const STYLE_BASE: Record<VoiceStyle, [number, number]> = {
  broadcast: [1.04, 1.02], energetic: [1.14, 1.08], calm: [0.97, 1.0],
};
const ENERGY_ADJ: Record<VoiceEnergy, [number, number]> = {
  calm: [0, 0], urgent: [0.08, 0.04], roar: [0.12, 0.09], somber: [-0.08, -0.04],
};

/** Speak one line. Interrupts the previous line; ducks effects while talking. */
export function speak(text: string, energy: VoiceEnergy = "calm") {
  if (!enabled || getVoiceMode() === "off") return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (document.visibilityState === "hidden") return;
  if (!visibilityHooked) {
    visibilityHooked = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") stopSpeaking();
    });
  }
  const synth = window.speechSynthesis;
  synth.cancel(); // a new moment always interrupts the last — no overlap
  const lang = currentLang();
  const u = new SpeechSynthesisUtterance(pronounce(text.replace(/[⚽🟥🟨🏁📺🧤💥🎙️]/g, "")));
  const [r, p] = STYLE_BASE[getVoiceStyle()];
  const [ra, pa] = ENERGY_ADJ[energy];
  u.rate = r + ra;
  u.pitch = p + pa;
  u.volume = 0.95;
  u.lang = lang === "es" ? "es-ES" : "en-GB";
  const v = pickVoice(lang);
  if (v) u.voice = v;
  duck();
  u.onend = unduck;
  u.onerror = unduck; // a failed line must never leave the mix ducked
  try { synth.speak(u); } catch { unduck(); }
}

/* Natural football lines per language — short broadcast calls, not read-outs. */
type SpeakEventKind =
  | "kickoff" | "goal" | "lategoal" | "save" | "red" | "var"
  | "ht" | "ft" | "shootoutwin" | "champion" | "eliminated";

interface SpeakData {
  player?: string;
  team?: string;
  minute?: number;
  score?: string;
}

const LINES: Record<SpeakEventKind, { en: string[]; es: string[]; energy: VoiceEnergy; key: boolean }> = {
  kickoff: {
    energy: "calm", key: false,
    en: ["We are under way.", "Kick-off — here we go.", "The referee gets us started."],
    es: ["Arranca el partido.", "Comienza el encuentro.", "El árbitro pone el balón en juego."],
  },
  goal: {
    energy: "roar", key: true,
    en: ["Goal! {player} scores for {team}!", "It's in! {player} finds the net!", "{player} with the goal — {team} strike!"],
    es: ["¡Gol! ¡{player} marca para {team}!", "¡Golazo de {player}!", "¡{player} la manda al fondo de la red!"],
  },
  lategoal: {
    energy: "roar", key: true,
    en: ["A late, late goal! {player} for {team}!", "Drama at the death — {player} scores!"],
    es: ["¡Gol sobre la hora! ¡{player} para {team}!", "¡Increíble! ¡{player} marca en el final!"],
  },
  save: {
    energy: "urgent", key: false,
    en: ["What a save!", "Brilliant goalkeeping!", "Somehow it stays out!"],
    es: ["¡Qué atajada!", "¡Paradón del portero!", "¡No puede creerlo, la sacó!"],
  },
  red: {
    energy: "urgent", key: true,
    en: ["Red card! {player} is off!", "He's been sent off — {player} walks!"],
    es: ["¡Tarjeta roja! ¡{player} expulsado!", "¡Se va {player}! Roja directa."],
  },
  var: {
    energy: "calm", key: false,
    en: ["The referee is checking with VAR.", "VAR review — hold your breath."],
    es: ["El VAR está revisando la jugada.", "Revisión del VAR — atentos."],
  },
  ht: {
    energy: "calm", key: false,
    en: ["Half time. {score}.", "That's the half — {score}."],
    es: ["Descanso. {score}.", "Final del primer tiempo: {score}."],
  },
  ft: {
    energy: "urgent", key: true,
    en: ["Full time. {score}.", "There's the whistle — it finishes {score}."],
    es: ["Final del partido. {score}.", "¡Pita el árbitro! Termina {score}."],
  },
  shootoutwin: {
    energy: "roar", key: true,
    en: ["{team} win the shootout!", "It's over — {team} hold their nerve from the spot!"],
    es: ["¡{team} gana la tanda de penaltis!", "¡{team} se impone desde los once metros!"],
  },
  champion: {
    energy: "roar", key: true,
    en: ["{team} are the champions!", "Glory for {team} — champions!"],
    es: ["¡{team} campeón!", "¡La gloria es de {team}! ¡Campeones!"],
  },
  eliminated: {
    energy: "somber", key: true,
    en: ["The road ends here for {team}.", "Heartbreak for {team} — the run is over."],
    es: ["Aquí termina el camino de {team}.", "Se acaba el sueño de {team}."],
  },
};

function sfrac(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Speak one match event with the right language, energy and template.
 * `id` guards duplicates: rerenders, refreshes and state churn never
 * re-announce the same moment.
 */
export function speakEvent(kind: SpeakEventKind, data: SpeakData = {}, id?: string) {
  const mode = getVoiceMode();
  if (mode === "off") return;
  const def = LINES[kind];
  if (mode === "key" && !def.key) return;
  const eventId = id ?? `${kind}-${data.player ?? ""}-${data.minute ?? ""}-${data.score ?? ""}`;
  if (eventId === lastSpokenId) return;
  lastSpokenId = eventId;
  const lang = currentLang();
  const bank = def[lang];
  const tpl = bank[Math.floor(sfrac(eventId.length * 7.31 + (data.minute ?? 0) * 3.7) * bank.length)];
  const line = tpl
    .replace("{player}", data.player ?? "")
    .replace("{team}", data.team ?? "")
    .replace("{score}", data.score ?? "")
    .replace(/\s+/g, " ")
    .trim();
  speak(line, def.energy);
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

/* ---------------------------------------------------------------- */
/*  Crowd ambience — a continuous, very quiet stadium bed that fades  */
/*  in for live broadcasts and out when they end. One instance only.  */
/* ---------------------------------------------------------------- */

let amb: { src: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode } | null = null;

export function startAmbience(level = 0.016) {
  if (!enabled) return;
  const a = ac();
  const out = bus();
  if (!a || !out || amb) return;
  if (a.state === "suspended") a.resume();

  // 2s of noise, looped, band-passed into a distant-crowd murmur
  const buffer = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 620;
  bp.Q.value = 0.55;
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(level, a.currentTime + 1.6);
  // slow swell — the crowd breathes (LFO wobbles the gain gently)
  const lfo = a.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoDepth = a.createGain();
  lfoDepth.gain.value = level * 0.45;
  lfo.connect(lfoDepth).connect(gain.gain);
  src.connect(bp).connect(gain).connect(out);
  src.start();
  lfo.start();
  amb = { src, gain, lfo };
}

/** The crowd rises for a moment — goals, big saves, late drama. */
export function swellAmbience(peak = 0.05, dur = 1.6) {
  const a = ctx;
  if (!a || !amb) return;
  const g = amb.gain.gain;
  g.cancelScheduledValues(a.currentTime);
  g.setTargetAtTime(peak, a.currentTime, 0.12);
  g.setTargetAtTime(0.016, a.currentTime + dur, 0.5);
}

export function stopAmbience(fade = 1.2) {
  const a = ctx;
  if (!a || !amb) return;
  const { src, gain, lfo } = amb;
  amb = null;
  try {
    gain.gain.cancelScheduledValues(a.currentTime);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + fade);
    src.stop(a.currentTime + fade + 0.05);
    lfo.stop(a.currentTime + fade + 0.05);
  } catch {
    try { src.stop(); lfo.stop(); } catch { /* already stopped */ }
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
    case "crossbar":
      // metallic ping — two detuned high partials with a hard noise hit
      noise(0, 0.05, 0.06); tone(1244, 0, 0.4, "triangle", 0.05); tone(1867, 0.005, 0.32, "sine", 0.03);
      crowd(0.05, 0.5, 0.04, 700);
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
