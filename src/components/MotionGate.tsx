"use client";

import { MotionConfig } from "framer-motion";
import { useFxLevel } from "@/lib/fx";

/**
 * Phone simple mode, one lever: below the "full" FX level (phones resolve to
 * "reduced"), every framer-motion transform/layout animation is skipped —
 * elements appear in place with plain opacity fades. Desktop stays on "user"
 * (full motion unless the OS asks otherwise). Components that must keep motion
 * on phones (e.g. champion confetti) nest their own MotionConfig override.
 */
export function MotionGate({ children }: { children: React.ReactNode }) {
  const lvl = useFxLevel();
  return <MotionConfig reducedMotion={lvl === "full" ? "user" : "always"}>{children}</MotionConfig>;
}
