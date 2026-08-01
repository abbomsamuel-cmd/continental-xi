// Sanity check for the canvas pitch-animation synthesis: simulate a batch of
// matches and confirm every synthesized position/frame stays in [0,100] and
// the same match replays identically (deterministic, no Math.random()).
import { simulateMatch, type EngineTeamContext } from "../src/lib/engine/match";
import { synthesizeFrame, synthesizeShotMap } from "../src/lib/engine/pitch-anim";
import { FORMATIONS } from "../src/lib/formations";
import { randomRng } from "../src/lib/rng";
import type { SimTeam } from "../src/lib/types";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; } else { console.log("ok:", msg); }
}

function team(id: string, isUser: boolean): SimTeam {
  return { id, name: id, short: id.slice(0, 3).toUpperCase(), country: "Testland", colors: ["#111111", "#eeeeee"], strength: 70, attack: 70, defense: 70, isUser, pot: 1 };
}

const homeFormation = FORMATIONS[0];
const awayFormation = FORMATIONS[1];

for (let run = 0; run < 25; run++) {
  const rng = randomRng();
  const home: EngineTeamContext = { team: team("home", true), form: 0 };
  const away: EngineTeamContext = { team: team("away", false), form: 0 };
  const result = simulateMatch(rng, home, away, {});

  let outOfBounds = 0;
  for (let m = 0; m <= 90; m++) {
    const frame = synthesizeFrame(result, homeFormation, awayFormation, m);
    if (frame.dots.length !== homeFormation.slots.length + awayFormation.slots.length) outOfBounds++;
    for (const d of frame.dots) {
      if (d.pos.x < 0 || d.pos.x > 100 || d.pos.y < 0 || d.pos.y > 100) outOfBounds++;
    }
    if (frame.ball.pos.x < 0 || frame.ball.pos.x > 100 || frame.ball.pos.y < 0 || frame.ball.pos.y > 100) outOfBounds++;
  }
  assert(outOfBounds === 0, `run ${run}: all positions stay in [0,100] across 0-90'`);

  // determinism — same result + minute always synthesizes the same frame
  const a = synthesizeFrame(result, homeFormation, awayFormation, 45);
  const b = synthesizeFrame(result, homeFormation, awayFormation, 45);
  assert(JSON.stringify(a) === JSON.stringify(b), `run ${run}: synthesis is deterministic`);

  const shots = synthesizeShotMap(result);
  const goalsAndChances = result.events.filter((e) => e.type === "goal" || e.type === "chance").length;
  assert(shots.length === goalsAndChances, `run ${run}: shot map has one marker per goal/chance event`);
}
