"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { play } from "@/lib/sound";
import { useC } from "@/lib/career/copy";
import { ARCHETYPES, POSITIONS, positionById } from "@/lib/career/data";
import { NATIONS, REGIONS, nationByName, searchNations, type NationRegion } from "@/lib/career/nations";
import { useCareer, WORLD_START_YEAR } from "@/lib/career/store";
import type { CareerPositionId, Foot } from "@/lib/career/types";

const BIRTH_YEARS = [WORLD_START_YEAR - 16, WORLD_START_YEAR - 17, WORLD_START_YEAR - 18];

export default function NewCareerPage() {
  const router = useRouter();
  const c = useC();
  const createCareer = useCareer((s) => s.createCareer);

  const [step, setStep] = useState(0); // 0..2
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [birthYear, setBirthYear] = useState(BIRTH_YEARS[0]);
  const [foot, setFoot] = useState<Foot>("Right");
  const [shirt, setShirt] = useState(10);
  const [position, setPosition] = useState<CareerPositionId | null>(null);
  const [archetypeId, setArchetypeId] = useState<string | null>(null);

  const LAST = 2;
  const titles = [
    c("Who are you?", "¿Quién eres?"),
    c("Choose your position", "Elige tu posición"),
    c("Define your style", "Define tu estilo"),
  ];

  const valid = [
    name.trim().length >= 2 && !!nationality && shirt >= 1 && shirt <= 99,
    !!position,
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
    <div className="mx-auto min-h-screen max-w-4xl px-4 pb-28 pt-24 sm:pt-28">
      {/* progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold/80">
            {c("Step", "Paso")} {step + 1} {c("of", "de")} 3
          </div>
          <button onClick={back} className="text-[0.68rem] font-semibold text-white/45 hover:text-white">
            ← {step === 0 ? c("Exit", "Salir") : c("Back", "Atrás")}
          </button>
        </div>
        <h1 className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">{titles[step]}</h1>
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: i <= step ? "#d4af37" : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>
      </div>

      <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {step === 0 && (
          <IdentityStep {...{ name, setName, nationality, setNationality, birthYear, setBirthYear, foot, setFoot, shirt, setShirt, c }} />
        )}
        {step === 1 && <PositionStep value={position} onPick={(p) => { setPosition(p); setArchetypeId(null); }} c={c} />}
        {step === 2 && position && (
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
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <button onClick={back} className="btn btn-ghost">{step === 0 ? c("Exit", "Salir") : c("Back", "Atrás")}</button>
          {step < LAST ? (
            <button onClick={next} disabled={!valid[step]}
              className={`btn ${valid[step] ? "btn-gold" : "btn-secondary opacity-50"}`}>
              {c("Continue", "Continuar")} →
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

/* ---------------- Step 1 · Identity ---------------- */
function IdentityStep({
  name, setName, nationality, setNationality, birthYear, setBirthYear, foot, setFoot, shirt, setShirt, c,
}: {
  name: string; setName: (v: string) => void;
  nationality: string; setNationality: (v: string) => void;
  birthYear: number; setBirthYear: (v: number) => void;
  foot: Foot; setFoot: (v: Foot) => void;
  shirt: number; setShirt: (v: number) => void;
  c: (en: string, es: string) => string;
}) {
  return (
    <div className="space-y-6">
      <Field label={c("Player Name", "Nombre del Jugador")}>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={22}
          placeholder={c("e.g. Sammy", "p. ej. Sammy")}
          className="w-full rounded-xl border border-white/12 bg-[#0b1122] px-4 py-3 font-display text-lg font-bold text-white outline-none focus:border-gold/60" />
      </Field>

      <Field label={c("Nationality", "Nacionalidad")}>
        <NationSelector value={nationality} onPick={setNationality} c={c} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label={c("Age at Start", "Edad Inicial")}>
          <div className="flex gap-2">
            {BIRTH_YEARS.map((y) => {
              const age = WORLD_START_YEAR - y;
              return (
                <button key={y} onClick={() => { setBirthYear(y); play("hover"); }}
                  className={`flex-1 rounded-xl border px-2 py-3 text-center transition-colors ${
                    birthYear === y ? "border-gold/60 bg-gold/12" : "border-white/12 hover:border-white/25"}`}>
                  <div className="font-display text-xl font-black text-white">{age}</div>
                  <div className="text-[0.55rem] uppercase tracking-widest text-white/40">{y}</div>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label={c("Preferred Foot", "Pie Preferido")}>
          <div className="flex gap-2">
            {(["Left", "Right"] as Foot[]).map((f) => (
              <button key={f} onClick={() => { setFoot(f); play("hover"); }}
                className={`flex-1 rounded-xl border px-2 py-3 font-display text-sm font-extrabold transition-colors ${
                  foot === f ? "border-gold/60 bg-gold/12 text-gold" : "border-white/12 text-white/60 hover:border-white/25"}`}>
                {f === "Left" ? c("Left", "Izquierdo") : c("Right", "Derecho")}
              </button>
            ))}
          </div>
        </Field>

        <Field label={c("Shirt Number", "Dorsal")}>
          <div className="flex items-center gap-2">
            <button onClick={() => setShirt(Math.max(1, shirt - 1))} className="grid h-12 w-12 place-items-center rounded-xl border border-white/12 text-xl text-white/70 hover:border-white/30">−</button>
            <div className="flex-1 rounded-xl border border-white/12 bg-[#0b1122] py-2.5 text-center font-display text-2xl font-black text-white">{shirt}</div>
            <button onClick={() => setShirt(Math.min(99, shirt + 1))} className="grid h-12 w-12 place-items-center rounded-xl border border-white/12 text-xl text-white/70 hover:border-white/30">+</button>
          </div>
        </Field>
      </div>
    </div>
  );
}

/* ---------------- Step 2 · Position ---------------- */
function PositionStep({ value, onPick, c }: { value: CareerPositionId | null; onPick: (p: CareerPositionId) => void; c: (en: string, es: string) => string }) {
  const info = value ? positionById(value) : null;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
        {POSITIONS.map((p) => (
          <button key={p.id} onClick={() => { onPick(p.id); play("select"); }}
            className={`rounded-xl border py-4 font-display text-base font-black transition-all ${
              value === p.id ? "border-gold/60 bg-gold/12 text-gold" : "border-white/12 text-white/70 hover:border-white/30 hover:-translate-y-0.5"}`}>
            {p.id}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#0b1122] p-5">
        {info ? (
          <>
            <div className="font-display text-xl font-black text-white">{info.name}</div>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{info.responsibilities}</p>
            <p className="mt-2 text-[0.8rem] italic leading-relaxed text-white/45">{info.style}</p>
            <div className="mt-4 text-[0.55rem] font-bold uppercase tracking-widest text-white/35">{c("Key Attributes", "Atributos Clave")}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {info.attributes.map((a) => <span key={a} className="rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-semibold text-white/70">{a}</span>)}
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center text-sm text-white/40">{c("Pick a position to see its role.", "Elige una posición para ver su rol.")}</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Step 3 · Archetype ---------------- */
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
    <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
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

      <div className="mt-2 grid max-h-56 grid-cols-1 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-widest text-white/40">{label}</div>
      {children}
    </div>
  );
}
