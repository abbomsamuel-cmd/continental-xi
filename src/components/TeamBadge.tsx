"use client";

/** Rounded-square club crest stand-in (original art) — gradient + short code,
 *  styled like the badges in Champions League graphics. */
export function TeamBadge({
  colors, code, size = 44,
}: { colors: [string, string]; code: string; size?: number }) {
  return (
    <span
      className="badge-crest shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        background: `linear-gradient(150deg, ${colors[0]}, ${colors[1]})`,
      }}
    >
      {code}
    </span>
  );
}
