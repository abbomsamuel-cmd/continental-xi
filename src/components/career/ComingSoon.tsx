"use client";

import Link from "next/link";
import { useC } from "@/lib/career/copy";

/** Premium placeholder for the sections that arrive with the season engine
 *  (Parts 2 & 3). Honest about what's next, without looking unfinished. */
export function ComingSoon({ icon, title, blurb, part }: { icon: string; title: string; blurb: string; part: string }) {
  const c = useC();
  return (
    <div className="mx-auto max-w-lg px-4 pt-28 text-center sm:pt-32">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-[#0b1122] text-3xl">{icon}</div>
      <div className="mt-4 inline-flex rounded-full border border-gold/25 bg-gold/8 px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.25em] text-gold">{part}</div>
      <h1 className="mt-3 font-display text-2xl font-black text-white sm:text-3xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">{blurb}</p>
      <Link href="/career" className="btn btn-ghost mt-6">← {c("Back to Overview", "Volver al Resumen")}</Link>
    </div>
  );
}
