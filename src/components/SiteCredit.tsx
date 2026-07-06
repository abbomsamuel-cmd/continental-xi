"use client";

/** Small persistent credit line with a gently beating heart. */
export function SiteCredit() {
  return (
    <div className="relative z-10 flex items-center justify-center gap-1.5 py-6 text-xs text-muted/80">
      <span>Made with</span>
      <span className="heart-beat inline-block text-[#ff5a6a]" aria-label="love">❤</span>
      <span>by</span>
      <span className="font-semibold text-gradient-gold">Sammy</span>
      <style>{`
        .heart-beat { animation: heartBeat 1.4s ease-in-out infinite; transform-origin: center; }
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.28); }
          30% { transform: scale(1); }
          45% { transform: scale(1.18); }
          60% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) { .heart-beat { animation: none; } }
      `}</style>
    </div>
  );
}
