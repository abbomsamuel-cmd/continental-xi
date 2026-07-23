"use client";

import { COUNTRY_FLAG } from "@/lib/career/data";

/**
 * One flag component, used everywhere a nation appears (header, timeline,
 * offers, national team). Emoji keeps proportions correct and never 404s;
 * the rounded frame gives it a consistent, premium footprint. Swap the source
 * for custom shields later without touching a single call site.
 */
export function CountryFlag({
  country, size = 22, className = "", showFallbackCode = false,
}: {
  country: string;
  size?: number;
  className?: string;
  showFallbackCode?: boolean;
}) {
  const flag = COUNTRY_FLAG[country];
  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-[4px] bg-white/8 leading-none ring-1 ring-white/10 ${className}`}
      style={{ width: size * 1.35, height: size, fontSize: size * 0.92 }}
      title={country}
      aria-label={country}
    >
      {flag ?? (showFallbackCode ? (
        <span style={{ fontSize: size * 0.34 }} className="font-bold text-white/60">
          {country.slice(0, 3).toUpperCase()}
        </span>
      ) : "🏳️")}
    </span>
  );
}
