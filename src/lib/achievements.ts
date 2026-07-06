import type { DraftRecord, Profile, TeamAnalysis } from "./types";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-draft", name: "Road to Glory", description: "Complete your first draft", icon: "🎬", tier: "bronze" },
  { id: "perfect-chem", name: "Perfect Chemistry", description: "Build an XI with 90+ chemistry", icon: "🧪", tier: "gold" },
  { id: "galacticos", name: "Galácticos", description: "Assemble an XI with 90+ overall", icon: "⭐", tier: "legendary" },
  { id: "historic-xi", name: "Historic XI", description: "Field a full historic partnership (3+ linked legends)", icon: "🤝", tier: "silver" },
  { id: "ultimate-mid", name: "Ultimate Midfield", description: "Midfield rated 90+", icon: "🎩", tier: "gold" },
  { id: "the-wall", name: "The Wall", description: "Defense + GK averaging 90+", icon: "🧱", tier: "gold" },
  { id: "goal-machine", name: "Goal Machine", description: "Score 15+ goals in one tournament", icon: "⚽", tier: "silver" },
  { id: "king-of-europe", name: "King of Europe", description: "Win the Champions Draft", icon: "👑", tier: "legendary" },
  { id: "invincible", name: "Invincible", description: "Win the title without losing a knockout tie", icon: "🛡️", tier: "legendary" },
  { id: "underdog", name: "Underdog Story", description: "Win the title with a sub-84 overall squad", icon: "🐺", tier: "legendary" },
  { id: "back-to-back", name: "Back-to-Back Champions", description: "Win two titles", icon: "🏆", tier: "legendary" },
  { id: "european-dynasty", name: "European Dynasty", description: "Win three titles", icon: "🏰", tier: "legendary" },
  { id: "legend-collector", name: "Legend Collector", description: "Draft 5+ players rated 92 or higher", icon: "💎", tier: "gold" },
  { id: "treble", name: "Treble Winner", description: "Top the league phase AND win the title", icon: "🎯", tier: "legendary" },
  { id: "ten-drafts", name: "Seasoned Manager", description: "Play 10 drafts", icon: "📋", tier: "bronze" },
  { id: "fifty-drafts", name: "Century Approaching", description: "Play 50 drafts", icon: "📚", tier: "silver" },
  { id: "hundred-drafts", name: "100 Drafts", description: "Play 100 drafts", icon: "💯", tier: "gold" },
  { id: "daily-champ", name: "Daily Champion", description: "Win a Daily Challenge tournament", icon: "📅", tier: "gold" },
];

export interface AchievementContext {
  profile: Profile;
  analysis: TeamAnalysis;
  record: DraftRecord;
  partnerships: number;
  playersOver92: number;
  topOfLeague: boolean;
  lostAKnockout: boolean;
  isDaily: boolean;
}

/** Returns newly-unlocked achievement ids given a finished draft/tournament. */
export function checkAchievements(ctx: AchievementContext): string[] {
  const have = new Set(ctx.profile.achievements);
  const unlocked: string[] = [];
  const add = (id: string, cond: boolean) => {
    if (cond && !have.has(id)) unlocked.push(id);
  };
  const totalDrafts = ctx.profile.drafts.length;
  const champion = ctx.record.result === "champion";
  const trophies = ctx.profile.trophies + (champion ? 1 : 0);

  add("first-draft", totalDrafts >= 1);
  add("perfect-chem", ctx.analysis.chemistry >= 90);
  add("galacticos", ctx.analysis.overall >= 90);
  add("historic-xi", ctx.partnerships >= 1);
  add("ultimate-mid", ctx.analysis.midfield >= 90);
  add("the-wall", (ctx.analysis.defense + ctx.analysis.goalkeeper) / 2 >= 90);
  add("goal-machine", (ctx.record.goals ?? 0) >= 15);
  add("king-of-europe", champion);
  add("invincible", champion && !ctx.lostAKnockout);
  add("underdog", champion && ctx.analysis.overall < 84);
  add("back-to-back", trophies >= 2);
  add("european-dynasty", trophies >= 3);
  add("legend-collector", ctx.playersOver92 >= 5);
  add("treble", champion && ctx.topOfLeague);
  add("ten-drafts", totalDrafts >= 10);
  add("fifty-drafts", totalDrafts >= 50);
  add("hundred-drafts", totalDrafts >= 100);
  add("daily-champ", champion && ctx.isDaily);

  return unlocked;
}

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
