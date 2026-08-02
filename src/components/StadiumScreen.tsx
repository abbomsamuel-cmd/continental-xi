"use client";

import type { ReactNode } from "react";
import { useFxLevel } from "@/lib/fx";

/**
 * Mounts its children as a giant LED screen inside the stadium — the boards a
 * ground hangs above the stands for the table and the bracket.
 *
 * Pure chrome: a bezel, mounting struts, an emissive spill onto the dark
 * behind it, and a fine scanline wash over the content. It wraps existing
 * components untouched, so the table stays a table — sortable, readable,
 * accessible — and only its framing changes.
 *
 * The scanline and glow layers are dropped at reduced fx, where they'd cost a
 * compositing pass on a phone for an effect nobody asked for.
 */
export function StadiumScreen({
  children, title, accent = "#00f0ff", className = "", struts = true,
}: {
  children: ReactNode;
  /** Small board caption, rendered on the bezel like a ground's screen label. */
  title?: string;
  accent?: string;
  className?: string;
  /** Mounting arms above the board. Off for screens that sit at ground level. */
  struts?: boolean;
}) {
  const fx = useFxLevel();
  const rich = fx === "full";

  return (
    <div className={`relative ${className}`}>
      {struts && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-5 flex justify-center gap-16">
          {[0, 1].map((i) => (
            <span key={i} className="block w-1.5 rounded-t-sm" style={{ height: 20, background: "linear-gradient(180deg, rgba(120,140,175,0.15), rgba(120,140,175,0.5))" }} />
          ))}
        </div>
      )}

      {/* the board: dark bezel with a lit inner edge */}
      <div
        className="relative overflow-hidden rounded-2xl p-[6px]"
        style={{
          background: "linear-gradient(180deg, #161d2b 0%, #0a0f1a 100%)",
          border: "1px solid rgba(140,160,195,0.22)",
          boxShadow: rich
            ? `0 0 34px ${accent}26, 0 18px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)`
            : "0 10px 26px rgba(0,0,0,0.5)",
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-2 pb-1.5 pt-0.5">
            <span className="text-[0.5rem] font-bold uppercase tracking-[0.32em]" style={{ color: accent }}>{title}</span>
            <span aria-hidden className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1 w-1 rounded-full" style={{ background: accent, opacity: 0.35 + i * 0.2 }} />
              ))}
            </span>
          </div>
        )}

        <div className="relative overflow-hidden rounded-xl" style={{ boxShadow: `inset 0 0 0 1px ${accent}2e` }}>
          {children}
          {rich && (
            <>
              {/* LED scanlines + a soft bloom, so it reads as emissive */}
              <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.13]"
                style={{ background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(90% 60% at 50% 0%, ${accent}14, transparent 70%)` }} />
            </>
          )}
        </div>
      </div>

      {/* the screen's light spilling onto the dark below it */}
      {rich && (
        <div aria-hidden className="pointer-events-none absolute inset-x-6 -bottom-5 h-10 rounded-[50%] blur-lg"
          style={{ background: `${accent}1f` }} />
      )}
    </div>
  );
}
