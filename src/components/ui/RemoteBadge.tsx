"use client";

import { useState, type ReactNode } from "react";
import { ClubCrest } from "@/components/ClubCrest";
import { clubBadgeUrlFor } from "@/lib/badge-sources";

/**
 * Renders a real badge file when one is configured for the club, and our own
 * generated crest when it isn't — or when the file turns out to be missing,
 * broken, or blocked.
 *
 * The fallback is the point. A badge set is almost never complete: you'll
 * have a file for Barcelona and nothing for Steaua București, and a typo'd
 * filename looks identical to a missing one. Rather than leaving broken-image
 * icons scattered through the league table, anything that fails to decode
 * quietly becomes the generated crest, which always renders.
 *
 * Resolution order: an explicit `src` wins, then a lookup by `clubName` (or
 * short code) in CLUB_BADGES. Give it `colors` and it builds the fallback
 * crest itself; give it `children` and that's used instead.
 */
export function RemoteBadge({
  src, clubName, colors, alt, width, className = "", style, children,
}: {
  /** Explicit image path/URL. Beats the clubName lookup when supplied. */
  src?: string;
  /** Club name or short code, resolved through CLUB_BADGES. */
  clubName?: string;
  /** Kit colours for the generated fallback crest. */
  colors?: [string, string];
  alt?: string;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
  /** Custom fallback. Takes precedence over the generated crest. */
  children?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = src ?? clubBadgeUrlFor(clubName);

  if (!resolved || failed) {
    if (children) return <>{children}</>;
    if (colors) return <ClubCrest colors={colors} seed={clubName} width={width} className={className} />;
    return null;
  }

  return (
    // The path is caller-supplied and this is a static export: next/image
    // would need every host declared in remotePatterns at build time, which
    // defeats the point of a swappable source.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt ?? clubName ?? ""}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      title={clubName}
      className={`select-none object-contain drop-shadow-md ${className}`}
      style={{ width, height: "auto", aspectRatio: "1 / 1", ...style }}
    />
  );
}
