"use client";

import { motion } from "framer-motion";
import { getFormation } from "@/lib/formations";
import { projectPoint, projectPath } from "@/lib/pitch-projection";

/**
 * The shape you'll be drafting into, drawn on a small pitch in the same
 * perspective the tactical board uses — so the shape you see here is exactly
 * the shape you get.
 *
 * Positions come from the real formation in lib/formations.ts, not a sketch,
 * which means a 4-3-3 preview and a 4-3-3 board line up slot for slot.
 */
export function FormationPreview({
  formation, accent = "#00f0ff", className = "",
}: {
  /** Formation name, e.g. "4-3-3". */
  formation: string;
  accent?: string;
  className?: string;
}) {
  const f = getFormation(formation);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        aspectRatio: "7 / 8",
        background: "radial-gradient(120% 70% at 50% -10%, rgba(0,240,255,0.14), transparent 60%), linear-gradient(180deg, #0f6b3a 0%, #0b4b28 55%, #062a16 100%)",
        border: `1px solid ${accent}33`,
        boxShadow: `inset 0 0 40px rgba(0,0,0,0.45), 0 0 22px ${accent}1c`,
      }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {/* mown bands, converging with the perspective */}
        <g opacity="0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            i % 2 === 0
              ? <polygon key={i} fill="rgba(255,255,255,0.04)"
                  points={projectPath([[0, i * 12.5], [100, i * 12.5], [100, (i + 1) * 12.5], [0, (i + 1) * 12.5]])} />
              : null
          ))}
        </g>
        <g fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth={0.5} strokeLinejoin="round">
          <polygon points={projectPath([[2, 1], [98, 1], [98, 99], [2, 99]])} />
          <polyline points={projectPath([[2, 50], [98, 50]])} />
          <polygon points={projectPath([[24, 1], [76, 1], [76, 16], [24, 16]])} />
          <polygon points={projectPath([[24, 99], [76, 99], [76, 84], [24, 84]])} />
          <polygon points={projectPath(
            Array.from({ length: 32 }, (_, i) => {
              const a = (i / 32) * Math.PI * 2;
              return [50 + Math.cos(a) * 13, 50 + Math.sin(a) * 9] as [number, number];
            })
          )} />
        </g>
      </svg>

      {/* the shape: one ring per slot, scaled by how far up the pitch it sits */}
      {f.slots.map((slot, i) => {
        const p = projectPoint(slot.x, slot.y);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.045, type: "spring", stiffness: 240, damping: 18 }}
            className="absolute grid place-items-center rounded-full"
            style={{
              left: `${p.leftPct}%`,
              top: `${p.topPct}%`,
              width: `${13 * p.scale}%`,
              aspectRatio: "1",
              transform: "translate(-50%, -50%)",
              background: "rgba(4,10,20,0.55)",
              border: `1.5px solid ${accent}`,
              boxShadow: `0 0 12px ${accent}70`,
              zIndex: 10 + Math.round((1 - p.depth) * 10),
            }}
          >
            <span className="font-display font-extrabold leading-none text-white"
              style={{ fontSize: `${0.52 * p.scale}rem` }}>
              {slot.pos}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
