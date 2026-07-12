"use client";

import { LANGS, useLang } from "@/lib/i18n";
import { play } from "@/lib/sound";

/**
 * 🌐 EN | ES switch. `variant="compact"` is the pill used in the nav bar;
 * `variant="full"` is the labelled row used in Settings.
 */
export function LanguageToggle({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const { lang, setLang } = useLang();

  if (variant === "full") {
    return (
      <div className="flex gap-2">
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => { setLang(l.id); play("click"); }}
            aria-pressed={lang === l.id}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              lang === l.id ? "bg-gold/20 text-gold ring-1 ring-gold/40" : "bg-white/6 text-muted hover:text-white"
            }`}
          >
            {l.full}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-white/10 px-1 py-0.5"
      role="group"
      aria-label="Language"
    >
      <span aria-hidden className="px-1 text-[0.7rem] leading-none opacity-70">🌐</span>
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => { setLang(l.id); play("click"); }}
          aria-pressed={lang === l.id}
          className={`rounded-md px-1.5 py-1 text-[0.62rem] font-extrabold tracking-wide transition-colors ${
            lang === l.id ? "bg-gold/20 text-gold" : "text-muted hover:text-white"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
