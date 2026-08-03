/**
 * Asserts the draw podium actually looks like a podium.
 *
 * The spinners settle into a pose defined purely by numbers (src/lib/podium.ts)
 * and there's no browser in the build to look at the result, so the invariants
 * that make it read correctly are checked here instead: the winner has to be
 * the tallest thing on screen, every plinth has to stand ON the podium's top
 * face rather than float above it or sink through it, nothing may overlap its
 * neighbour, and the whole rank has to fit the stage.
 *
 * Run: npx tsx scripts/podium-check.ts
 */
import {
  PLINTH_W, ITEM_W, STAGE_H, FLOOR, FACE_NEAR, FACE_FAR, RIM_TOP, RIG_BOTTOM,
  podiumPose, finishFor, plinthSpan, plinthEdges,
} from "../src/lib/podium";

let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "FAIL  "}${label} — ${detail}`);
};

/** the five plinths the podium actually shows, left to right */
const VISIBLE = [-2, -1, 0, 1, 2];

console.log("\nPodium geometry\n");

const spans = new Map<number, { base: number; top: number }>();
const edges = new Map<number, { left: number; right: number }>();
for (const d of VISIBLE) {
  const pose = podiumPose(d);
  spans.set(d, plinthSpan(pose));
  edges.set(d, plinthEdges(d, pose));
}

// 1. the winner is the tallest thing on the podium
const winnerTop = spans.get(0)!.top;
for (const d of VISIBLE.filter((x) => x !== 0)) {
  const t = spans.get(d)!.top;
  check(`winner stands over ${d > 0 ? "+" : ""}${d}`, winnerTop > t + 8,
    `winner crown ${winnerTop.toFixed(0)} vs ${t.toFixed(0)}`);
}

// 2. every plinth stands on the podium's top face — not floating above its
//    front edge, not sunk behind its back edge
for (const d of VISIBLE) {
  const { base } = spans.get(d)!;
  check(`${d === 0 ? "winner" : `slot ${d > 0 ? "+" : ""}${d}`} foot on the face`,
    base >= FACE_NEAR && base <= FACE_FAR,
    `foot at ${base.toFixed(0)}, face runs ${FACE_NEAR}–${FACE_FAR}`);
}

// 3. the winner stands forward of its neighbours, which are set back
check("winner is furthest forward", spans.get(0)!.base < spans.get(-1)!.base && spans.get(0)!.base < spans.get(1)!.base,
  `winner foot ${spans.get(0)!.base}, neighbours ${spans.get(-1)!.base}`);
check("outer plinths are furthest back", spans.get(2)!.base > spans.get(1)!.base,
  `outer foot ${spans.get(2)!.base} vs inner ${spans.get(1)!.base}`);

// 4. the winner's foot is tucked behind the rim; the others stand clear of it
check("winner's foot hidden by the rim", spans.get(0)!.base < RIM_TOP,
  `foot ${spans.get(0)!.base} below rim top ${RIM_TOP}`);

// 5. nothing overlaps its neighbour
for (let i = 0; i < VISIBLE.length - 1; i++) {
  const a = edges.get(VISIBLE[i])!;
  const b = edges.get(VISIBLE[i + 1])!;
  const gap = b.left - a.right;
  check(`gap ${VISIBLE[i]} → ${VISIBLE[i + 1]}`, gap > 2, `${gap.toFixed(1)}px clear`);
}

// 6. the rank clears the floodlight rigs and fits the stage box
check("winner clears the light rigs", winnerTop < RIG_BOTTOM,
  `crown ${winnerTop.toFixed(0)} under rigs at ${RIG_BOTTOM}`);
check("nothing leaves the stage box", winnerTop < STAGE_H,
  `crown ${winnerTop.toFixed(0)} inside ${STAGE_H}`);

// 7. the moving rank sits on the face too, so the settle is a nudge not a jump
check("rank rests on the face while spinning", FLOOR >= FACE_NEAR && FLOOR <= FACE_FAR,
  `spin floor ${FLOOR}, face ${FACE_NEAR}–${FACE_FAR}`);

// 8. the podium fits the widths it's rendered at (96% of the stage box)
const rankWidth = edges.get(2)!.right - edges.get(-2)!.left;
for (const [label, w] of [["desktop (max-w-3xl)", 768], ["tablet", 640]] as const) {
  check(`five plinths fit ${label}`, rankWidth <= w * 0.96,
    `rank ${rankWidth.toFixed(0)}px in ${(w * 0.96).toFixed(0)}px`);
}
// on a phone the outer pair is expected to fall into the edge vignette; what
// must survive is the winner and both neighbours
const coreWidth = edges.get(1)!.right - edges.get(-1)!.left;
check("winner + neighbours fit a 390px phone", coreWidth <= 390,
  `core ${coreWidth.toFixed(0)}px`);

// 9. anything past the podium is invisible, so the reel's tail can't show
check("reel tail is hidden", podiumPose(3).opacity === 0 && podiumPose(-9).opacity === 0,
  "|delta| > 2 fades to 0");

// 10. the finishes read gold in the middle, mixed metals either side
check("winner takes gold", finishFor(0, 30) === "gold", "delta 0 → gold");
check("no other gold on the podium",
  VISIBLE.filter((d) => d !== 0).every((d) => finishFor(d, 30 + d) !== "gold"),
  "neighbours are silver/bronze");

// 11. the reel's translate lands the winner dead centre
check("reel spacing matches the plinths", ITEM_W === PLINTH_W + 12,
  `${ITEM_W}px pitch for a ${PLINTH_W}px column`);

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
