"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useT } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { CrestLogo } from "@/components/CrestLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ReportBug } from "@/components/ReportBug";

type Item = { href: string; key: string; emoji: string };
type Group = { id: string; key: string; hintKey: string; items: Item[] };

/* Simplified information architecture: five entry points, three of them
   grouping the old flat links so the bar reads cleanly on laptops & tablets. */
const PLAY: Group = {
  id: "play", key: "nav.play", hintKey: "nav.group.play.hint",
  items: [
    { href: "/draft", key: "nav.play.newDraft", emoji: "🎴" },
    { href: "/draft", key: "nav.play.cl", emoji: "🏆" },
    { href: "/international?comp=euro", key: "nav.play.euro", emoji: "🇪🇺" },
    { href: "/international?comp=copa", key: "nav.play.copa", emoji: "🌎" },
    { href: "/tournament", key: "nav.play.continue", emoji: "▶" },
  ],
};
const CAREER: Group = {
  id: "career", key: "nav.career", hintKey: "nav.group.career.hint",
  items: [
    { href: "/career", key: "nav.career.mode", emoji: "⚽" },
    { href: "/tournament", key: "nav.career.tournament", emoji: "🏟️" },
    { href: "/history", key: "nav.career.history", emoji: "📜" },
    { href: "/stats", key: "nav.career.profile", emoji: "👔" },
    { href: "/stats?tab=achievements", key: "nav.career.achievements", emoji: "🎖️" },
  ],
};
const MORE: Group = {
  id: "more", key: "nav.more", hintKey: "nav.group.more.hint",
  items: [
    { href: "/#faq", key: "nav.more.howToPlay", emoji: "❓" },
    { href: "/#news", key: "nav.more.updates", emoji: "📰" },
    { href: "/stats?tab=settings", key: "nav.more.settings", emoji: "⚙️" },
  ],
};
const basePath = (href: string) => href.split(/[?#]/)[0];

export function NavBar() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const mounted = useHydrated();
  const t = useT();
  const soundOn = useGame((s) => s.profile.soundOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const trophies = useGame((s) => s.profile.trophies);

  // Close menus on Escape (event-driven — safe inside an effect).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeAll = () => setOpenMenu(null);
  const groupActive = (g: Group) => g.items.some((i) => pathname === basePath(i.href));

  return (
    <header className="safe-top fixed top-0 inset-x-0 z-50 px-2 sm:px-0">
      <nav className="glass relative mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 sm:px-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-70"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.7) 30%, rgba(0,240,255,0.5) 70%, transparent)" }}
        />
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => { play("click"); closeAll(); }}>
          <span className="relative grid place-items-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[8deg]">
            <CrestLogo size={38} />
          </span>
          <span className="font-display text-sm font-extrabold tracking-tight sm:text-base">
            CONTINENTAL <span className="text-gradient-cyan">XI</span>
          </span>
        </Link>

        {/* desktop grouped nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          <TopLink href="/" label={t("nav.home")} active={pathname === "/"} onClick={closeAll} />
          <GroupButton group={PLAY} open={openMenu === "play"} active={groupActive(PLAY)}
            onToggle={() => setOpenMenu((m) => (m === "play" ? null : "play"))} onNavigate={closeAll} pathname={pathname} t={t} />
          <TopLink href="/daily" label={t("nav.daily")} active={pathname === "/daily"} onClick={closeAll} />
          <GroupButton group={CAREER} open={openMenu === "career"} active={groupActive(CAREER)}
            onToggle={() => setOpenMenu((m) => (m === "career" ? null : "career"))} onNavigate={closeAll} pathname={pathname} t={t} />
          <GroupButton group={MORE} open={openMenu === "more"} active={groupActive(MORE)}
            onToggle={() => setOpenMenu((m) => (m === "more" ? null : "more"))} onNavigate={closeAll} pathname={pathname} t={t}
            footer={
              <div className="mt-1 space-y-1 border-t border-white/8 pt-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted">{t("nav.language")}</span>
                  <LanguageToggle />
                </div>
                <div className="px-1"><ReportBug className="nav-menu-item w-full !text-white/70" /></div>
              </div>
            } />
        </div>

        <div className="flex items-center gap-2">
          {mounted && trophies > 0 && (
            <span className="chip hidden bg-[rgba(0,240,255,0.15)] text-cyan sm:inline-flex">🏆 {trophies}</span>
          )}
          <button
            aria-label={t("nav.toggleSound")}
            onClick={() => { toggleSound(); play("click"); }}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-sm transition-all hover:scale-110 hover:border-cyan/50"
          >
            {mounted && soundOn ? "🔊" : "🔇"}
          </button>
        </div>
      </nav>

      {/* click-away backdrop for desktop dropdowns */}
      {openMenu && <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setOpenMenu(null)} />}
    </header>
  );
}

function TopLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={() => { play("hover"); onClick(); }}
      className={`relative rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${active ? "text-cyan" : "text-muted hover:text-white"}`}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-lg"
          style={{
            background: "linear-gradient(160deg, rgba(0,240,255,0.16), rgba(0,240,255,0.04))",
            border: "1px solid rgba(0,240,255,0.35)",
            boxShadow: "0 0 14px rgba(0,240,255,0.2)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative">{label}</span>
    </Link>
  );
}

function GroupButton({
  group, open, active, onToggle, onNavigate, pathname, t, footer,
}: {
  group: Group; open: boolean; active: boolean; onToggle: () => void; onNavigate: () => void;
  pathname: string; t: (k: string) => string; footer?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => { const wasOpen = open; onToggle(); play(wasOpen ? "hover" : "menu"); }}
        aria-expanded={open}
        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${active || open ? "text-cyan" : "text-muted hover:text-white"}`}
      >
        {t(group.key)}
        <span aria-hidden className={`text-[0.6rem] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="nav-menu absolute right-0 z-50 mt-2 w-60 p-2"
          >
            <div className="px-2 pb-1 text-[0.55rem] font-bold uppercase tracking-[0.25em] text-white/30">{t(group.hintKey)}</div>
            {group.items.map((i) => (
              <Link key={i.key + i.href} href={i.href} onClick={onNavigate}
                data-active={pathname === basePath(i.href)}
                className="nav-menu-item">
                <span aria-hidden className="w-5 text-center">{i.emoji}</span> {t(i.key)}
              </Link>
            ))}
            {footer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
