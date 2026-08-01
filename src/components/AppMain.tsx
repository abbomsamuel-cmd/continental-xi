"use client";

import { usePathname } from "next/navigation";

/** <main> wrapper — adds clearance for the global BottomNav on mobile.
 *  Career routes are excluded: career/layout.tsx already pads for its own
 *  CareerBottomNav, so stacking this padding on top would double it up. */
export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const careerRoute = pathname.startsWith("/career");
  return (
    <main className={`relative z-10 ${careerRoute ? "" : "pb-20 md:pb-0"}`}>
      {children}
    </main>
  );
}
