"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { play } from "@/lib/sound";
import { CrestLogo } from "@/components/CrestLogo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/draft", label: "Draft" },
  { href: "/tournament", label: "Tournament" },
  { href: "/international", label: "International" },
  { href: "/daily", label: "Daily" },
  { href: "/history", label: "History" },
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
      <nav className="glass relative mx-auto mt-3 flex max-w-6xl items-center justify-between overflow-hidden rounded-2xl px-4 py-2.5 sm:px-6">
        {/* thin animated gold line along the bottom edge */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-70"
          style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.7) 30%, rgba(34,224,255,0.5) 70%, transparent)" }}
        />
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => play("click")}>
          <span className="relative grid place-items-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[8deg]">
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
                className={`relative rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  active ? "text-gold" : "text-muted hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "linear-gradient(160deg, rgba(212,175,55,0.16), rgba(212,175,55,0.04))",
                      border: "1px solid rgba(212,175,55,0.35)",
                      boxShadow: "0 0 14px rgba(212,175,55,0.2)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{l.label}</span>
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
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-sm transition-all hover:scale-110 hover:border-gold/50"
          >
            {mounted && soundOn ? "🔊" : "🔇"}
          </button>
          <button
            aria-label="Menu"
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 transition-all active:scale-90 md:hidden"
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="glass mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl p-3 md:hidden"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => { setOpen(false); play("click"); }}
                className={`rounded-lg px-3 py-2 text-sm font-bold ${
                  pathname === l.href ? "bg-gold/10 text-gold" : "text-muted"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
