"use client";

import { useState, type ReactNode } from "react";

/**
 * Renders an externally-hosted badge or flag when the caller supplies a URL,
 * and falls back to `children` — our own generated art — when they don't, or
 * when the image fails to load.
 *
 * No image ships with the app and no URL is hardcoded anywhere: this is a
 * hook-up point for whatever image source the app owner has cleared to use.
 * The fallback means a dead link, an expired key or an offline device
 * degrades to the generated crest rather than a broken-image icon.
 */
export function RemoteBadge({
  src, alt, width, className, style, children,
}: {
  src?: string;
  alt: string;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{children}</>;

  return (
    // The URL is arbitrary and caller-supplied, and this is a static export:
    // next/image would need every possible host declared in remotePatterns at
    // build time, which defeats the point of a hook-up field.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      style={{ width, height: "auto", objectFit: "contain", ...style }}
    />
  );
}
