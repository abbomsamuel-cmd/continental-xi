"use client";

import { ClubCrest } from "@/components/ClubCrest";
import { Flag } from "@/components/Flag";
import { RemoteBadge } from "@/components/RemoteBadge";
import { flagCodeFor } from "@/lib/flags";

/** Team badge for tables, brackets and match cards.
 *
 *  `badgeUrl` is an optional hook-up point for an externally-hosted crest —
 *  nothing ships with the app, and if it's absent or fails to load the
 *  generated art below is used instead.
 *
 *  National teams (pass `nationality`) get their real flag: a country's flag
 *  isn't invented club IP, so there's no reason to use placeholder art there.
 *  Club teams get the original crest, which carries the club's real kit
 *  pattern. */
export function TeamBadge({
  colors, code, size = 44, nationality, badgeUrl,
}: {
  colors: [string, string];
  code: string;
  size?: number;
  nationality?: string;
  badgeUrl?: string;
}) {
  if (nationality && flagCodeFor(nationality)) {
    return (
      <RemoteBadge src={badgeUrl} alt={nationality} width={size} className="rounded-[15%] shadow-md">
        <Flag nationality={nationality} width={size} className="rounded-[15%] shadow-md" />
      </RemoteBadge>
    );
  }
  return (
    <RemoteBadge src={badgeUrl} alt={code} width={size} className="shrink-0">
      <span className="inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
        <ClubCrest colors={colors} seed={code} width={size} textBacking className="[grid-area:1/1]" />
        <span
          className="[grid-area:1/1] font-display font-extrabold text-white"
          style={{ fontSize: size * 0.26, textShadow: "0 1px 3px rgba(0,0,0,0.85)" }}
        >
          {code}
        </span>
      </span>
    </RemoteBadge>
  );
}
