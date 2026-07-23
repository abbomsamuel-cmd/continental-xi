"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { play } from "@/lib/sound";
import { useC } from "@/lib/career/copy";
import {
  ARCHETYPES, LEAGUES, NATIONALITIES, POSITIONS, positionById,
} from "@/lib/career/data";
import { useCareer, WORLD_START_YEAR } from "@/lib/career/store";
import type { CareerPositionId, Foot } from "@/lib/career/types";
import { CountryFlag } from "@/components/career/CountryFlag";
import { ClubCrest } from "@/components/career/ClubCrest";

const BIRTH_YEARS = [WORLD_START_YEAR - 16, WORLD_START_YEAR - 17, WORLD_START_YEAR - 18];

export default function NewCareerPage() {
  const router = useRouter();
  const c = useC();
  const createCareer = useCareer((s) => s.createCareer);

  const [step, setStep] = useState(0); // 0..3
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [birthYear, setBirthYear] = useState(BIRTH_YEARS[0]);
  const [foot, setFoot] = useState<Foot>("Right");
  const [shirt, setShirt] = useState(10);
  const [position, setPosition] = useState<CareerPositionId | null>(null);
  const [archetypeId, setArchetypeId] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);

  const titles = [
    c("Who are you?", "¿Quién eres?"),
    c("Choose your position", "Elige tu posición"),
    c("Define your style", "Define tu estilo"),
    c("Where it begins", "Donde todo empieza"),
  ];

  const valid = [
    name.trim().length >= 2 && !!nationality && shirt >= 1 && shirt <= 99,
    !!position,
    !!archetypeId,
    !!clubId,
  ];

  const next = () => { if (valid[step]) { play("select"); setStep((s) => Math.min(3, s + 1)); } };
  const back = () => { play("click"); if (step === 0) router.push("/career"); else setStep((s) => s - 1); };

  const finish = () => {
    if (!valid.every(Boolean) || !position || !archetypeId || !clubId) return;
    play("whistle");
    createCareer({ name, nationality, birthYear, foot, shirtNumber: shirt, position, archetypeId, clubId });
    router.push("/career");
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pb-28 pt-24 sm:pt-28">
      {/* progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold/80">
            {c("Step", "Paso")} {step + 1} {c("of", "de")} 4
          </div>
          <button onClick={back} className="text-[0.68rem] font-semibold text-white/45 hover:text-white">
            ← {step === 0 ? c("Exit", "Salir") : c("Back", "Atrás")}
          </button>
        </div>
        <h1 className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">{titles[step]}</h1>
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
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
        {step === 2 && position && <ArchetypeStep position={position} value={archetypeId} onPick={setArchetypeId} />}
        {step === 3 && (
          <ClubStep {...{ leagueId, setLeagueId, clubId, setClubId, c }} />
        )}
      </motion.div>

      {/* footer action */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070b16]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <button onClick={back} className="btn btn-ghost">{step === 0 ? c("Exit", "Salir") : c("Back", "Atrás")}</button>
          {step < 3 ? (
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
        <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto rounded-xl border border-white/8 bg-black/20 p-2 sm:grid-cols-3">
          {NATIONALITIES.map((nat) => (
            <button key={nat} onClick={() => { setNationality(nat); play("hover"); }}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[0.78rem] font-semibold transition-colors ${
                nationality === nat ? "bg-gold/15 text-gold ring-1 ring-gold/40" : "text-white/65 hover:bg-white/5"}`}>
              <CountryFlag country={nat} size={16} /> <span className="truncate">{nat}</span>
            </button>
          ))}
        </div>
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

/* ---------------- Step 4 · League → Club ---------------- */
function ClubStep({
  leagueId, setLeagueId, clubId, setClubId, c,
}: {
  leagueId: string | null; setLeagueId: (v: string) => void;
  clubId: string | null; setClubId: (v: string) => void;
  c: (en: string, es: string) => string;
}) {
  const league = useMemo(() => LEAGUES.find((l) => l.id === leagueId) ?? null, [leagueId]);
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-widest text-white/40">{c("Choose a league", "Elige una liga")}</div>
        <div className="flex flex-wrap gap-2">
          {LEAGUES.map((l) => (
            <button key={l.id} onClick={() => { setLeagueId(l.id); setClubId(""); play("hover"); }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.78rem] font-semibold transition-colors ${
                leagueId === l.id ? "border-gold/60 bg-gold/12 text-gold" : "border-white/12 text-white/65 hover:border-white/25"}`}>
              <CountryFlag country={l.country} size={15} /> {l.name}
            </button>
          ))}
        </div>
      </div>

      {league && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-2 text-[0.55rem] font-bold uppercase tracking-widest text-white/40">
            {c("Clubs interested in you", "Clubes interesados en ti")}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {league.clubs.map((club) => (
              <button key={club.id} onClick={() => { setClubId(club.id); play("select"); }}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                  clubId === club.id ? "border-gold/60 bg-gold/12" : "border-white/12 bg-[#0b1122] hover:border-white/25 hover:-translate-y-0.5"}`}>
                <ClubCrest short={club.short} colors={club.colors} size={34} />
                <div className="min-w-0">
                  <div className={`truncate text-[0.82rem] font-bold ${clubId === club.id ? "text-gold" : "text-white"}`}>{club.name}</div>
                  <div className="text-[0.6rem] text-white/40">{"★".repeat(club.tier)}{"·".repeat(5 - club.tier)}</div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
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
