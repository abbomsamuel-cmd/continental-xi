"use client";

import { useT } from "@/lib/i18n";
import { play } from "@/lib/sound";

/** Where bug reports go. Change this to a dedicated inbox if you prefer not to
 *  expose a personal address. */
const BUG_REPORT_EMAIL = "jnabbo555@gmail.com";

/**
 * "Report a Bug" — opens the visitor's mail client with a pre-filled template
 * (page URL + device string auto-added). No backend needed for a static site.
 */
export function ReportBug({ className = "" }: { className?: string }) {
  const t = useT();

  const onClick = () => {
    play("click");
    let context = "";
    try {
      context = `\n\n---\nPage: ${window.location.href}\nDevice: ${navigator.userAgent}\nLanguage: ${document.documentElement.lang}`;
    } catch {
      /* ignore */
    }
    const subject = encodeURIComponent("ContinentalXI — Bug report");
    const body = encodeURIComponent(`What happened:\n\nWhat you expected:\n${context}`);
    try {
      window.location.href = `mailto:${BUG_REPORT_EMAIL}?subject=${subject}&body=${body}`;
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-white/70 transition-colors hover:text-gold ${className}`}
    >
      🐛 {t("common.reportBug")}
    </button>
  );
}
