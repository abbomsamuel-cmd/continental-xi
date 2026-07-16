"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { eggById } from "@/lib/easter-eggs";
import { useGame } from "@/lib/store";
import { useT } from "@/lib/i18n";

/**
 * Global toast for a freshly-discovered hidden emblem. Mounted once in the
 * layout so it can fire from either the club tournament or an international
 * run. The inner card is keyed on the batch so each discovery remounts fresh
 * (no synchronous setState-in-effect) and self-clears after a beat.
 */
export function EggToast() {
  const ids = useGame((s) => s.lastEggs);
  if (!ids.length) return null;
  return <EggToastCard key={ids.join(",")} ids={ids} />;
}

function EggToastCard({ ids }: { ids: string[] }) {
  const clear = useGame((s) => s.clearEggs);
  const t = useT();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 6500);
    const wipe = setTimeout(() => clear(), 7000);
    return () => { clearTimeout(hide); clearTimeout(wipe); };
  }, [clear]);

  const eggs = ids.map(eggById).filter(Boolean);
  if (!eggs.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[140] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {visible && eggs.map((e, i) => e && (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ delay: i * 0.18, type: "spring", stiffness: 260, damping: 20 }}
            className="glass-strong shine relative overflow-hidden rounded-2xl p-3.5 pr-5"
            style={{ borderColor: "rgba(212,175,55,0.5)", boxShadow: "0 12px 44px rgba(212,175,55,0.28)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl drop-shadow-[0_2px_6px_rgba(212,175,55,0.5)]">{e.icon}</span>
              <div>
                <div className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-gradient-gold">
                  {t("egg.discovered")}
                </div>
                <div className="font-display font-bold text-white">{e.name}</div>
                <div className="text-xs text-muted">{e.description}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
