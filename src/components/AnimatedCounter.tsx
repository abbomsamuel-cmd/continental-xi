"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

interface Props {
  to: number;
  suffix?: string;
  label: string;
}

export function AnimatedCounter({ to, suffix = "", label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setVal(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-3xl font-extrabold text-gradient-gold sm:text-5xl">
        {val.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-[0.7rem] font-semibold uppercase tracking-widest text-muted sm:text-xs">
        {label}
      </div>
    </div>
  );
}
