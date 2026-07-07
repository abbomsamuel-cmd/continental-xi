"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useGame } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { CrestLogo } from "@/components/CrestLogo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/draft", label: "Draft" },
  { href: "/tournament", label: "Tournament" },
  { href: "/daily", label: "Daily" },
  { href: "/stats", label: "Profile" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const mounted = useHydrated();
  const soundOn = useGame((s) => s.profile.soundOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const trophies = useGame((s) => s.profile.trophies);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <nav className="glass mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => play("click")}>
          <span className="relative grid place-items-center transition-transform group-hover:scale-105">
            <CrestLogo size={38} />
          </span>
          <span className="font-display text-sm font-extrabold tracking-tight sm:text-base">
            CONTINENTAL <span className="text-gradient-gold">XI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => play("hover")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  active ? "text-gold" : "text-muted hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {mounted && trophies > 0 && (
            <span className="chip hidden bg-[rgba(212,175,55,0.15)] text-gold sm:inline-flex">
              🏆 {trophies}
            </span>
          )}
          <button
            aria-label="Toggle sound"
            onClick={() => { toggleSound(); play("click"); }}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-sm hover:border-gold/50"
          >
            {mounted && soundOn ? "🔊" : "🔇"}
          </button>
          <button
            aria-label="Menu"
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 md:hidden"
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl p-3 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => { setOpen(false); play("click"); }}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${
                pathname === l.href ? "text-gold" : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
