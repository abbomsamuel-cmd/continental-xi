"use client";

import { ClubCrest } from "@/components/ClubCrest";
import { Flag } from "@/components/Flag";
import { flagCodeFor } from "@/lib/flags";

/** Team badge for tables, brackets and match cards. National teams (pass
 *  `nationality`) get their real flag — a country's flag isn't invented club
 *  IP, so there's no reason to use placeholder art there. Club teams (no
 *  resolvable nationality) get the original enameled-shield crest. */
export function TeamBadge({
  colors, code, size = 44, nationality,
}: { colors: [string, string]; code: string; size?: number; nationality?: string }) {
  if (nationality && flagCodeFor(nationality)) {
    return <Flag nationality={nationality} width={size} className="rounded-[15%] shadow-md" />;
  }
  return (
    <span className="inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <ClubCrest colors={colors} seed={code} width={size} showDevice={false} className="[grid-area:1/1]" />
      <span
        className="[grid-area:1/1] font-display font-extrabold text-white"
        style={{ fontSize: size * 0.26, textShadow: "0 1px 3px rgba(0,0,0,0.85)" }}
      >
        {code}
      </span>
    </span>
  );
}
