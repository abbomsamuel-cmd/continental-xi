"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Reusable 3D-tilt card: tracks the pointer and rotates in perspective, with a
 * moving glare highlight that follows the cursor. Children can opt into
 * parallax depth with the `.tilt-layer` class and a `--z` custom property.
 */
export function TiltCard({
  children,
  className = "",
  maxTilt = 9,
  glare = true,
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 24 });
  const sy = useSpring(py, { stiffness: 220, damping: 24 });
  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt]);
  const glareX = useTransform(sx, [0, 1], ["20%", "80%"]);
  const glareY = useTransform(sy, [0, 1], ["15%", "85%"]);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(340px circle at ${x} ${y}, rgba(255,255,255,0.14), transparent 55%)`,
  );

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div className="tilt-wrap" style={{ perspective: 1100 }}>
      <motion.div
        ref={ref}
        className={`tilt-card relative ${className}`}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={onClick}
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        {children}
        {glare && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ background: glareBg, zIndex: 3 }}
          />
        )}
      </motion.div>
    </div>
  );
}
