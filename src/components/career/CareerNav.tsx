"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { play } from "@/lib/sound";

export interface CareerNavItem { id: string; href: string; en: string; es: string; icon: string; primary?: boolean }

/** One source of truth — the desktop sidebar, the mobile bar, and dashboard
 *  shortcuts all read from this. `primary` marks the five that fit the phone bar. */
// Career Mode is one screen now — the hub (Overview) holds the player, the
// chapter loop, the trophy cabinet and the national record. Only genuinely
// separate destinations stay in the nav.
export const CAREER_NAV: CareerNavItem[] = [
  { id: "overview", href: "/career", en: "Career", es: "Carrera", icon: "◎", primary: true },
  { id: "timeline", href: "/career/timeline", en: "Timeline", es: "Trayectoria", icon: "≡", primary: true },
  { id: "stats", href: "/career/stats", en: "Statistics", es: "Estadísticas", icon: "▦", primary: true },
  { id: "saves", href: "/career/saves", en: "Save Slots", es: "Partidas", icon: "❏", primary: true },
  { id: "settings", href: "/career/settings", en: "Settings", es: "Ajustes", icon: "⚙" },
];

const isActive = (path: string, href: string) => (href === "/career" ? path === "/career" : path.startsWith(href));

export function CareerSidebar() {
  const path = usePathname();
  const { lang } = useLang();
  return (
    <aside className="hidden lg:fixed lg:left-0 lg:top-[4.75rem] lg:bottom-0 lg:z-30 lg:flex lg:w-56 lg:flex-col lg:border-r lg:border-white/8 lg:bg-[#0f0a24]/85 lg:px-3 lg:py-5">
      <div className="px-3 pb-3 text-[0.55rem] font-bold uppercase tracking-[0.3em] text-career-purple/80">Career</div>
      <nav className="flex flex-col gap-0.5">
        {CAREER_NAV.map((it) => {
          const active = isActive(path, it.href);
          return (
            <Link key={it.id} href={it.href} onClick={() => play("hover")}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-career-purple/18 text-career-gold" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
              <span aria-hidden className="w-4 text-center text-base leading-none">{it.icon}</span>
              {lang === "es" ? it.es : it.en}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function CareerBottomNav() {
  const path = usePathname();
  const { lang } = useLang();
  const items = CAREER_NAV.filter((i) => i.primary);
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-white/10 bg-[#0f0a24]/95 backdrop-blur lg:hidden">
      {items.map((it) => {
        const active = isActive(path, it.href);
        return (
          <Link key={it.id} href={it.href} onClick={() => play("click")}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.56rem] font-bold uppercase tracking-wide ${
              active ? "text-career-gold" : "text-white/45"}`}>
            <span aria-hidden className="text-lg leading-none">{it.icon}</span>
            {lang === "es" ? it.es : it.en}
          </Link>
        );
      })}
    </nav>
  );
}
