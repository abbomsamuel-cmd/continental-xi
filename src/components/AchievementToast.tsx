"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { achievementById } from "@/lib/achievements";
import { useGame } from "@/lib/store";

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c8d4", gold: "#d4af37", legendary: "#22e0ff",
};

export function AchievementToast({ ids }: { ids: string[] }) {
  const clear = useGame((s) => s.clearUnlocked);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); clear(); }, 6000);
    return () => clearTimeout(t);
  }, [clear]);

  const achievements = ids.map(achievementById).filter(Boolean);
  if (!achievements.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[130] flex flex-col gap-2">
      <AnimatePresence>
        {visible && achievements.map((a, i) => a && (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ delay: i * 0.15 }}
            className="glass-strong flex items-center gap-3 rounded-2xl p-3 pr-5"
            style={{ borderColor: TIER_COLORS[a.tier] }}
          >
            <span className="text-3xl">{a.icon}</span>
            <div>
              <div className="text-[0.55rem] font-bold uppercase tracking-widest" style={{ color: TIER_COLORS[a.tier] }}>
                Achievement Unlocked
              </div>
              <div className="font-display font-bold">{a.name}</div>
              <div className="text-xs text-muted">{a.description}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
