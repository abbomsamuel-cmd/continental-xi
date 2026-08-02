"use client";

import { ClubCrest } from "@/components/ClubCrest";
import { Flag } from "@/components/Flag";
import { RemoteBadge } from "@/components/ui/RemoteBadge";
import { flagCodeFor } from "@/lib/flags";

/**
 * Team badge for league tables, brackets, match cards and the pitch.
 *
 * This is the single funnel for club artwork across the app — sixteen
 * components render teams through it — so wiring a badge source in here
 * lights up every one of those surfaces at once.
 *
 * Resolution: an explicit `badgeUrl` wins, then a CLUB_BADGES lookup on
 * `clubName` (or the short `code`, which resolves the same entry), then the
 * generated crest. National teams short-circuit to their real flag: a
 * country's flag isn't invented club IP, so there's no reason to draw
 * placeholder art for one.
 */
export function TeamBadge({
  colors, code, size = 44, nationality, badgeUrl, clubName,
}: {
  colors: [string, string];
  code: string;
  size?: number;
  nationality?: string;
  /** Explicit override; beats the CLUB_BADGES lookup. */
  badgeUrl?: string;
  /** Full club name. Falls back to `code`, which resolves the same entry. */
  clubName?: string;
}) {
  if (nationality && flagCodeFor(nationality)) {
    return (
      <RemoteBadge src={badgeUrl} alt={nationality} width={size} className="rounded-[15%] shadow-md">
        <Flag nationality={nationality} width={size} className="rounded-[15%] shadow-md" />
      </RemoteBadge>
    );
  }
  return (
    <RemoteBadge src={badgeUrl} clubName={clubName ?? code} alt={clubName ?? code} width={size}>
      <span className="inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
        <ClubCrest colors={colors} seed={clubName ?? code} width={size} textBacking className="[grid-area:1/1]" />
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
