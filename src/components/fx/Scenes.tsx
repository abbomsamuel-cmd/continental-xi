"use client";

import { CameraFlashes, Sparks } from "@/components/fx/Atmosphere";

/* Full-viewport scene backdrops — each competition owns its own sky.
   Shared between the tournament screens and the draft experience. */

export function EuroScene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,13,46,0.92) 0%, rgba(4,9,32,0.94) 60%, rgba(2,5,18,0.97) 100%)" }} />
      <div className="aurora absolute -top-1/4 left-[8%] h-[60vh] w-[55vw] rounded-full opacity-45"
        style={{ background: "radial-gradient(circle, rgba(27,79,255,0.55), transparent 65%)" }} />
      <div className="aurora absolute top-[30%] right-[2%] h-[50vh] w-[45vw] rounded-full opacity-35"
        style={{ background: "radial-gradient(circle, rgba(55,224,255,0.4), transparent 65%)", animationDelay: "-7s" }} />
      {/* neon horizon */}
      <div className="absolute inset-x-0 top-[62%] h-px opacity-70"
        style={{ background: "linear-gradient(90deg, transparent, rgba(55,224,255,0.6) 30%, rgba(27,79,255,0.6) 70%, transparent)", boxShadow: "0 0 24px rgba(55,224,255,0.5)" }} />
      {/* receding tech-grid floor */}
      <div className="absolute inset-x-0 bottom-0 top-[62%] opacity-25"
        style={{
          backgroundImage: "linear-gradient(rgba(85,150,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(85,150,255,0.4) 1px, transparent 1px)",
          backgroundSize: "56px 44px",
          transform: "perspective(320px) rotateX(48deg)",
          transformOrigin: "top center",
          maskImage: "linear-gradient(to bottom, #000, transparent 85%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 85%)",
        }} />
      <CameraFlashes count={10} />
    </div>
  );
}

export function CopaScene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,32,20,0.9) 0%, rgba(5,22,14,0.94) 55%, rgba(2,10,6,0.97) 100%)" }} />
      {/* golden sunset sinking behind the stands */}
      <div className="absolute inset-x-0 top-[30%] h-[45vh] opacity-70"
        style={{ background: "radial-gradient(55% 60% at 50% 100%, rgba(255,138,61,0.4), rgba(255,201,60,0.14) 55%, transparent 75%)" }} />
      <div className="aurora absolute -top-[10%] left-[15%] h-[45vh] w-[50vw] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(23,201,122,0.4), transparent 65%)" }} />
      {/* stands silhouette */}
      <div className="absolute inset-x-0 bottom-0 h-[26vh]"
        style={{ background: "linear-gradient(to top, rgba(2,10,6,0.98), rgba(4,18,11,0.6) 65%, transparent)" }} />
      <Sparks count={16} color="#00e676" />
      <CameraFlashes count={12} />
    </div>
  );
}
