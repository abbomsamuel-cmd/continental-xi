"use client";

import { motion } from "framer-motion";

interface Props {
  data: { label: string; value: number }[];
  size?: number;
}

export function RadarChart({ data, size = 240 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 34;
  const n = data.length;

  const point = (value: number, i: number, r = radius) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (Math.max(0, Math.min(100, value)) / 100) * r;
    return [cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist];
  };

  const rings = [25, 50, 75, 100];
  const shape = data.map((d, i) => point(d.value, i).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[280px]">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={data.map((_, i) => point(ring, i).join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(100, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" />;
      })}
      <motion.polygon
        points={shape}
        fill="rgba(0,240,255,0.2)"
        stroke="#00f0ff"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 14 }}
        style={{ transformOrigin: "center" }}
      />
      {data.map((d, i) => {
        const [x, y] = point(d.value, i);
        const [lx, ly] = point(118, i);
        return (
          <g key={d.label}>
            <circle cx={x} cy={y} r="3" fill="#7dfaff" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              className="fill-white font-bold" style={{ fontSize: 10 }}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
