import type { CSSProperties } from "react";
import { flagCodeFor } from "@/lib/flags";

interface Props {
  nationality?: string;
  className?: string;
  style?: CSSProperties;
  /** convenience sizing (px) — sets the underlying font-size .fi scales from */
  width?: number;
}

/** A real bundled flag-icons SVG (no emoji, no CDN — self-hosted in the
 *  static build). Sizes off the element's font-size like the emoji it
 *  replaces: put a text-size class, a `style.fontSize` (e.g. a cqw unit), or
 *  `width` (px) to scale it. */
export function Flag({ nationality, className = "", style, width }: Props) {
  const code = flagCodeFor(nationality);
  if (!code) return null;
  return (
    <span
      className={`fi fi-${code} inline-block rounded-[2px] align-middle shadow-sm ${className}`}
      style={width ? { fontSize: width / 1.333333, ...style } : style}
      title={nationality}
      aria-hidden
    />
  );
}
