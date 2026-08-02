"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { play } from "@/lib/sound";
import { useC } from "@/lib/career/copy";
import { ARCHETYPES, positionById } from "@/lib/career/data";
import { NATIONS, REGIONS, nationByName, searchNations, type NationRegion } from "@/lib/career/nations";
import { useCareer, WORLD_START_YEAR } from "@/lib/career/store";
import type { CareerPositionId, Foot } from "@/lib/career/types";

const BIRTH_YEARS = [WORLD_START_YEAR - 16, WORLD_START_YEAR - 17, WORLD_START_YEAR - 18];

/* ---------------- kit colours: real, widely-known national kit colours are
   public fact (not a protected logo/design), same footing as using real
   flags. Curated for recognisable nations; a deterministic hash covers
   everyone else so the jersey always has believable, stable colours. */
const KIT_COLORS: Record<string, [string, string]> = {
  England: ["#ffffff", "#1e2a5e"], Brazil: ["#ffd700", "#009c3b"], Argentina: ["#75aadb", "#ffffff"],
  Germany: ["#ffffff", "#000000"], France: ["#0f1e59", "#ffffff"], Spain: ["#c60b1e", "#ffc400"],
  Italy: ["#0066b3", "#ffffff"], Portugal: ["#c8102e", "#046a38"], Netherlands: ["#ff6600", "#1e2a5e"],
  Colombia: ["#ffcd00", "#003893"], Uruguay: ["#75aadb", "#000000"], Mexico: ["#006847", "#ce1126"],
  "United States": ["#1e2a5e", "#c8102e"], Belgium: ["#c8102e", "#000000"], Wales: ["#c8102e", "#00a651"],
  Scotland: ["#1e2a5e", "#ffffff"], Nigeria: ["#009e60", "#ffffff"], Japan: ["#003893", "#ffffff"],
  "South Korea": ["#c8102e", "#ffffff"], Croatia: ["#c8102e", "#ffffff"], Poland: ["#ffffff", "#c8102e"],
  Sweden: ["#006aa7", "#fecc02"], Denmark: ["#c8102e", "#ffffff"], Switzerland: ["#ff0000", "#ffffff"],
  Morocco: ["#c1272d", "#006233"], Senegal: ["#00853f", "#fdef42"], Ghana: ["#ce1126", "#fcd116"],
  Ecuador: ["#ffcd00", "#034ea2"], Chile: ["#d52b1e", "#ffffff"], Peru: ["#d91023", "#ffffff"],
  "Republic of Ireland": ["#169b62", "#ffffff"], Turkey: ["#e30a17", "#ffffff"], Russia: ["#ffffff", "#0039a6"],
  Ukraine: ["#ffd700", "#0057b7"], Austria: ["#ed2939", "#ffffff"], Serbia: ["#c6363c", "#ffffff"],
};
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const FALLBACK_KITS: [string, string][] = [
  ["#c8102e", "#ffffff"], ["#0f1e59", "#ffd700"], ["#046a38", "#ffffff"], ["#7c3aed", "#ffffff"],
  ["#00e676", "#0a0e17"], ["#ff6600", "#1e2a5e"], ["#00f0ff", "#0a0e17"], ["#ffc400", "#0f1e59"],
];
function kitColorsFor(nation: string): [string, string] {
  if (KIT_COLORS[nation]) return KIT_COLORS[nation];
  return FALLBACK_KITS[hashStr(nation) % FALLBACK_KITS.length];
}

/* ---------------- position pitch layout — the 10 roles this career system
   actually models, placed on a small original pitch (attack at the top). ---------------- */
const PITCH_SPOTS: Record<CareerPositionId, { x: number; y: number }> = {
  ST: { x: 50, y: 8 },
  LW: { x: 18, y: 20 }, RW: { x: 82, y: 20 },
  CAM: { x: 50, y: 32 },
  CM: { x: 50, y: 48 },
  CDM: { x: 50, y: 62 },
  LB: { x: 18, y: 76 }, RB: { x: 82, y: 76 },
  CB: { x: 50, y: 80 },
  GK: { x: 50, y: 94 },
};

export default function NewCareerPage() {
  const router = useRouter();
  const c = useC();
  const createCareer = useCareer((s) => s.createCareer);

  const [step, setStep] = useState(0); // 0..1
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [birthYear, setBirthYear] = useState(BIRTH_YEARS[0]);
  const [foot, setFoot] = useState<Foot>("Right");
  const [shirt, setShirt] = useState(10);
  const [position, setPosition] = useState<CareerPositionId | null>(null);
  const [archetypeId, setArchetypeId] = useState<string | null>(null);

  const LAST = 1;
  const titles = [
    c("Define your identity", "Define tu identidad"),
    c("Define your style", "Define tu estilo"),
  ];

  const valid = [
    name.trim().length >= 2 && !!nationality && shirt >= 1 && shirt <= 99 && !!position,
    !!archetypeId,
  ];

  const next = () => { if (valid[step]) { play("select"); setStep((s) => Math.min(LAST, s + 1)); } };
  const back = () => { play("click"); if (step === 0) router.push("/career"); else setStep((s) => s - 1); };

  const finish = () => {
    if (!valid.every(Boolean) || !position || !archetypeId) return;
    play("whistle");
    // No club pick — a small/home club is assigned; the dashboard reveals it.
    createCareer({ name, nationality, birthYear, foot, shirtNumber: shirt, position, archetypeId });
    router.push("/career");
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-24 sm:pt-28">
      {/* progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold/80">
            {c("Step", "Paso")} {step + 1} {c("of", "de")} 2
          </div>
          <button onClick={back} className="text-[0.68rem] font-semibold text-white/45 hover:text-white">
            ← {step === 0 ? c("Exit", "Salir") : c("Back", "Atrás")}
          </button>
        </div>
        <h1 className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">{titles[step]}</h1>
        <div className="mt-3 flex gap-1.5">
          {[0, 1].map((i) => (
            <span key={i} className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: i <= step ? "#d4af37" : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>
      </div>

      <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {step === 0 && (
          <IdentityAndPositionStep {...{
            name, setName, nationality, setNationality, birthYear, setBirthYear, foot, setFoot, shirt, setShirt,
            position, setPosition: (p: CareerPositionId) => { setPosition(p); setArchetypeId(null); }, c,
          }} />
        )}
        {step === 1 && position && (
          <>
            <ArchetypeStep position={position} value={archetypeId} onPick={setArchetypeId} />
            <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-center text-[0.78rem] text-white/45">
              {c("You'll start at a small club and earn your move up. Your first club is revealed next.",
                 "Empezarás en un club modesto y te ganarás el ascenso. Tu primer club se revela a continuación.")}
            </p>
          </>
        )}
      </motion.div>

      {/* footer action */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070b16]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button onClick={back} className="btn btn-ghost">{step === 0 ? c("Exit", "Salir") : c("Back", "Atrás")}</button>
          {step < LAST ? (
            <button onClick={next} disabled={!valid[step]}
              className={`btn ${valid[step] ? "btn-gold" : "btn-secondary opacity-50"}`}>
              {c("Confirm identity", "Confirmar identidad")} →
            </button>
          ) : (
            <button onClick={finish} disabled={!valid.every(Boolean)}
              className={`btn ${valid.every(Boolean) ? "btn-gold" : "btn-secondary opacity-50"}`}>
              {c("Start Career", "Empezar Carrera")} ⚽
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- an original jersey preview — colours from the selected
   nation's real, publicly-known kit colours (not a club crest/logo). ---------------- */
function JerseyPreview({ nationality, name, shirt }: { nationality: string; name: string; shirt: number }) {
  const [base, trim] = nationality ? kitColorsFor(nationality) : ["#1a2232", "#2a3548"];
  const ink = base === "#ffffff" || base === "#ffd700" || base === "#ffcd00" ? "#0a0e17" : "#f8fafc";
  const label = (name.trim() || "PLAYER").toUpperCase().slice(0, 12);

  return (
    <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[220px]" aria-hidden>
      <defs>
        <linearGradient id="jerseyShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      {/* sleeves */}
      <path d="M40 38 L8 55 L22 92 L46 76 Z" fill={trim} />
      <path d="M160 38 L192 55 L178 92 L154 76 Z" fill={trim} />
      {/* body */}
      <path d="M46 30 Q100 12 154 30 L166 90 L166 188 Q100 198 34 188 L34 90 Z" fill={base} />
      {/* collar */}
      <path d="M84 26 Q100 44 116 26 L110 16 Q100 24 90 16 Z" fill={trim} />
      {/* trim stripes down the sides */}
      <rect x="34" y="90" width="7" height="98" fill={trim} opacity="0.85" />
      <rect x="159" y="90" width="7" height="98" fill={trim} opacity="0.85" />
      {/* shading + sheen */}
      <path d="M46 30 Q100 12 154 30 L166 90 L166 188 Q100 198 34 188 L34 90 Z" fill="url(#jerseyShade)" />
      {/* name arched above the number */}
      <text x="100" y="108" textAnchor="middle" fontFamily="var(--font-display), system-ui, sans-serif"
        fontWeight="800" fontSize="13" letterSpacing="0.5" fill={ink}>{label}</text>
      {/* number */}
      <text x="100" y="160" textAnchor="middle" fontFamily="var(--font-display), system-ui, sans-serif"
        fontWeight="900" fontSize="52" fill={ink}>{shirt}</text>
    </svg>
  );
}

/* ---------------- position mini-pitch — click a spot on an original pitch
   instead of a plain button grid. ---------------- */
function PositionPitch({ value, onPick }: { value: CareerPositionId | null; onPick: (p: CareerPositionId) => void }) {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/10"
      style={{ background: "linear-gradient(180deg, #0f3d24 0%, #0a2e1a 55%, #072215 100%)" }}>
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full opacity-60" preserveAspectRatio="none">
        <g fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5">
          <rect x="4" y="4" width="92" height="92" />
          <line x1="4" y1="50" x2="96" y2="50" />
          <circle cx="50" cy="50" r="10" />
          <rect x="30" y="4" width="40" height="14" />
          <rect x="30" y="82" width="40" height="14" />
        </g>
      </svg>
      {(Object.keys(PITCH_SPOTS) as CareerPositionId[]).map((pid) => {
        const spot = PITCH_SPOTS[pid];
        const active = value === pid;
        return (
          <button
            key={pid}
            type="button"
            onClick={() => { onPick(pid); play("select"); }}
            className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-display text-[0.62rem] font-black uppercase transition-all"
            style={{
              left: `${spot.x}%`, top: `${spot.y}%`, width: 34, height: 34,
              background: active ? "linear-gradient(150deg,#f2d472,#d4af37)" : "rgba(0,0,0,0.45)",
              color: active ? "#241a04" : "rgba(255,255,255,0.85)",
              border: `1.5px solid ${active ? "#f2d472" : "rgba(255,255,255,0.35)"}`,
              boxShadow: active ? "0 0 16px rgba(212,175,55,0.55)" : "0 2px 6px rgba(0,0,0,0.4)",
            }}
          >
            {pid}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Step 1 · Identity + Nationality + Position, one screen ---------------- */
function IdentityAndPositionStep({
  name, setName, nationality, setNationality, birthYear, setBirthYear, foot, setFoot, shirt, setShirt,
  position, setPosition, c,
}: {
  name: string; setName: (v: string) => void;
  nationality: string; setNationality: (v: string) => void;
  birthYear: number; setBirthYear: (v: number) => void;
  foot: Foot; setFoot: (v: Foot) => void;
  shirt: number; setShirt: (v: number) => void;
  position: CareerPositionId | null; setPosition: (p: CareerPositionId) => void;
  c: (en: string, es: string) => string;
}) {
  const info = position ? positionById(position) : null;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr_1fr]">
      {/* -------- Identity + jersey -------- */}
      <div>
        <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-widest text-white/40">{c("Identity", "Identidad")}</div>
        <div className="rounded-2xl border border-white/10 bg-[#0b1122] p-4" style={{ containerType: "inline-size" }}>
          <JerseyPreview nationality={nationality} name={name} shirt={shirt} />
        </div>

        <div className="mt-3 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={22}
            placeholder={c("Last name", "Apellido")}
            className="w-full rounded-xl border border-white/12 bg-[#0b1122] px-4 py-3 font-display text-lg font-bold uppercase text-white outline-none focus:border-gold/60" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5 text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{c("Preferred Foot", "Pie Preferido")}</div>
              <div className="flex gap-1.5">
                {(["Left", "Right"] as Foot[]).map((f) => (
                  <button key={f} onClick={() => { setFoot(f); play("hover"); }}
                    className={`flex-1 rounded-lg border py-2 font-display text-xs font-extrabold transition-colors ${
                      foot === f ? "border-gold/60 bg-gold/12 text-gold" : "border-white/12 text-white/60 hover:border-white/25"}`}>
                    {f === "Left" ? c("Left", "Izq") : c("Right", "Der")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{c("Shirt Number", "Dorsal")}</div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setShirt(Math.max(1, shirt - 1))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/12 text-white/70 hover:border-white/30">−</button>
                <div className="flex-1 rounded-lg border border-white/12 bg-[#0b1122] py-1.5 text-center font-display text-lg font-black text-white">{shirt}</div>
                <button onClick={() => setShirt(Math.min(99, shirt + 1))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/12 text-white/70 hover:border-white/30">+</button>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[0.5rem] font-bold uppercase tracking-widest text-white/35">{c("Age at Start", "Edad Inicial")}</div>
            <div className="flex gap-1.5">
              {BIRTH_YEARS.map((y) => {
                const age = WORLD_START_YEAR - y;
                return (
                  <button key={y} onClick={() => { setBirthYear(y); play("hover"); }}
                    className={`flex-1 rounded-lg border px-1 py-2 text-center transition-colors ${
                      birthYear === y ? "border-gold/60 bg-gold/12" : "border-white/12 hover:border-white/25"}`}>
                    <div className="font-display text-base font-black text-white">{age}</div>
                    <div className="text-[0.5rem] uppercase tracking-widest text-white/40">{y}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* -------- Nationality -------- */}
      <div>
        <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-widest text-white/40">{c("Nationality", "Nacionalidad")}</div>
        <NationSelector value={nationality} onPick={setNationality} c={c} />
      </div>

      {/* -------- Position -------- */}
      <div>
        <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-widest text-white/40">{c("Position", "Posición")}</div>
        <PositionPitch value={position} onPick={setPosition} />
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#0b1122] p-4">
          {info ? (
            <>
              <div className="font-display text-lg font-black text-white">{info.name}</div>
              <p className="mt-1.5 text-[0.8rem] leading-relaxed text-white/70">{info.responsibilities}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {info.attributes.map((a) => <span key={a} className="rounded-full bg-white/8 px-2 py-0.5 text-[0.62rem] font-semibold text-white/70">{a}</span>)}
              </div>
            </>
          ) : (
            <div className="grid h-24 place-items-center text-center text-[0.8rem] text-white/40">
              {c("Tap a spot on the pitch to choose your position.", "Toca un lugar en la cancha para elegir tu posición.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Step 2 · Archetype ---------------- */
function ArchetypeStep({ position, value, onPick }: { position: CareerPositionId; value: string | null; onPick: (id: string) => void }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {ARCHETYPES[position].map((a) => (
        <button key={a.id} onClick={() => { onPick(a.id); play("select"); }}
          className={`rounded-2xl border p-4 text-left transition-all ${
            value === a.id ? "border-gold/60 bg-gold/12" : "border-white/12 bg-[#0b1122] hover:border-white/25 hover:-translate-y-0.5"}`}>
          <div className={`font-display text-base font-extrabold ${value === a.id ? "text-gold" : "text-white"}`}>{a.label}</div>
          <p className="mt-1.5 text-[0.8rem] leading-relaxed text-white/60">{a.desc}</p>
        </button>
      ))}
    </div>
  );
}

/* ---------------- nationality: searchable, region-filtered ---------------- */
function NationSelector({
  value, onPick, c,
}: { value: string; onPick: (v: string) => void; c: (en: string, es: string) => string }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<NationRegion | "All">("All");

  const list = useMemo(() => {
    const base = query.trim() ? searchNations(query) : NATIONS;
    return region === "All" ? base : base.filter((n) => n.region === region);
  }, [query, region]);

  const selected = value ? nationByName(value) : undefined;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
      {/* current pick + random */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
          {selected ? (
            <>
              <span className="text-base leading-none">{selected.flag}</span>
              <span className="truncate text-[0.82rem] font-bold text-gold">{selected.name}</span>
            </>
          ) : (
            <span className="text-[0.78rem] text-white/35">{c("No country selected", "Ningún país elegido")}</span>
          )}
        </div>
        <button type="button"
          onClick={() => { const n = NATIONS[Math.floor(Math.random() * NATIONS.length)]; onPick(n.name); play("select"); }}
          className="shrink-0 rounded-lg border border-white/12 px-2.5 py-1.5 text-[0.7rem] font-bold text-white/70 hover:border-white/30 hover:text-white">
          🎲 {c("Random", "Aleatorio")}
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={c("Search countries…", "Buscar países…")}
        aria-label={c("Search countries", "Buscar países")}
        className="mt-2 w-full rounded-lg border border-white/12 bg-[#0b1122] px-3 py-2 text-[0.82rem] text-white outline-none placeholder:text-white/30 focus:border-gold/60"
      />

      <div className="mt-2 flex flex-wrap gap-1">
        {(["All", ...REGIONS] as const).map((r) => (
          <button key={r} type="button" onClick={() => { setRegion(r); play("hover"); }}
            className={`rounded-md px-2 py-1 text-[0.62rem] font-bold transition-colors ${
              region === r ? "bg-gold/18 text-gold" : "text-white/45 hover:bg-white/6 hover:text-white/75"}`}>
            {r === "All" ? c("All", "Todos") : r}
          </button>
        ))}
      </div>

      <div className="mt-2 grid max-h-72 grid-cols-1 gap-1 overflow-y-auto pr-1">
        {list.map((n) => (
          <button key={n.name} type="button" onClick={() => { onPick(n.name); play("hover"); }}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[0.78rem] font-semibold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 ${
              value === n.name ? "bg-gold/15 text-gold ring-1 ring-gold/40" : "text-white/65 hover:bg-white/5"}`}>
            <span className="shrink-0 text-base leading-none">{n.flag}</span>
            <span className="truncate">{n.name}</span>
          </button>
        ))}
        {list.length === 0 && (
          <div className="col-span-full py-6 text-center text-[0.76rem] text-white/35">
            {c("No countries match.", "Ningún país coincide.")}
          </div>
        )}
      </div>
    </div>
  );
}
