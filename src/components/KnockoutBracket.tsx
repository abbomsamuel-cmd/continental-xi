"use client";

import type { KOTie, KORoundName, TournamentState } from "@/lib/types";
import { USER_TEAM_ID } from "@/lib/engine/tournament";
import { PremiumBracket, type BracketTeam } from "@/components/PremiumBracket";

interface Props {
  tournament: TournamentState;
  onTieClick?: (tie: KOTie) => void;
}

const CL_ROUNDS: KORoundName[] = ["Play-off", "Round of 16", "Quarter-final", "Semi-final", "Final"];

/** Champions-Draft knockout bracket — the premium two-sided broadcast tree. */
export function KnockoutBracket({ tournament, onTieClick }: Props) {
  if (!tournament.ties.some((t) => t.round === "Play-off")) {
    return <p className="text-center text-sm text-muted">The knockout bracket is drawn once the league phase ends.</p>;
  }
  const teams: Record<string, BracketTeam> = {};
  for (const [id, t] of Object.entries(tournament.teams)) {
    teams[id] = { id, name: t.name, short: t.short, colors: t.colors, season: t.season ? String(t.season) : undefined, isUser: t.isUser };
  }
  return (
    <PremiumBracket
      ties={tournament.ties}
      teams={teams}
      userKey={USER_TEAM_ID}
      champion={tournament.champion}
      variant="cl"
      rounds={CL_ROUNDS}
      onTieClick={onTieClick}
    />
  );
}
