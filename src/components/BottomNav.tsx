"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ReportBug } from "@/components/ReportBug";

/** The single mobile navigation surface — replaces the old top hamburger.
 *  Five thumb-reachable primary destinations; everything else (Stats,
 *  History, Daily, Career, Settings, Language) lives in the "More" sheet. */
const PRIMARY = [
  { href: "/", key: "nav.home", icon: "⌂" },
  { href: "/draft", key: "nav.play.newDraft", icon: "🎴" },
  { href: "/squad", key: "nav.squad", icon: "▦" },
  { href: "/tournament", key: "nav.play.continue", icon: "🏆" },
] as const;

const MORE_ITEMS = [
  { href: "/career", key: "nav.career.mode", icon: "⚽" },
  { href: "/stats", key: "nav.stats", icon: "👔" },
  { href: "/history", key: "nav.history", icon: "📜" },
  { href: "/daily", key: "nav.daily", icon: "📅" },
  { href: "/stats?tab=settings", key: "nav.more.settings", icon: "⚙️" },
] as const;

const basePath = (href: string) => href.split(/[?#]/)[0];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const t = useT();

  // Career mode owns its own bottom bar (CareerBottomNav) — don't stack two.
  if (pathname.startsWith("/career")) return null;

  const moreActive = MORE_ITEMS.some((i) => pathname === basePath(i.href));

  return (
    <>
      <nav className="glass-tactical safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-stretch md:hidden">
        {PRIMARY.map((item) => {
          const active = pathname === basePath(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { play("click"); setMoreOpen(false); }}
              className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[0.56rem] font-bold uppercase tracking-wide transition-colors ${
                active ? "text-cyan" : "text-slate-grey"}`}
            >
              <span aria-hidden className="text-lg leading-none">{item.icon}</span>
              {t(item.key)}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => { setMoreOpen((o) => !o); play(moreOpen ? "hover" : "menu"); }}
          aria-expanded={moreOpen}
          className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[0.56rem] font-bold uppercase tracking-wide transition-colors ${
            moreOpen || moreActive ? "text-cyan" : "text-slate-grey"}`}
        >
          <span aria-hidden className="text-lg leading-none">⋯</span>
          {t("nav.more")}
        </button>
      </nav>

      {/* click-away backdrop */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* "More" bottom sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="glass-tactical safe-bottom fixed inset-x-0 bottom-0 z-40 rounded-t-2xl p-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:hidden"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/15" />
            {MORE_ITEMS.map((item) => {
              const active = pathname === basePath(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { play("click"); setMoreOpen(false); }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    active ? "bg-cyan/10 text-cyan" : "text-white/75"}`}
                >
                  <span aria-hidden className="w-5 text-center text-base leading-none">{item.icon}</span>
                  {t(item.key)}
                </Link>
              );
            })}
            <div className="mt-1.5 flex items-center justify-between border-t border-white/8 px-3 pt-3">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-grey">{t("nav.language")}</span>
              <LanguageToggle />
            </div>
            <div className="px-1.5 pt-2"><ReportBug className="text-sm font-semibold" /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
