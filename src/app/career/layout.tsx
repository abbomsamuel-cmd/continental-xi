"use client";

import { usePathname } from "next/navigation";
import { CareerSidebar, CareerBottomNav } from "@/components/career/CareerNav";

/** Career Mode shell. The section sidebar (desktop) / bottom bar (mobile) frame
 *  every career page — except the creation wizard, which runs full-screen. */
export default function CareerLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const chrome = path !== "/career/new";

  if (!chrome) return <>{children}</>;

  return (
    <div className="lg:pl-56">
      <CareerSidebar />
      <div className="pb-24 lg:pb-6">{children}</div>
      <CareerBottomNav />
    </div>
  );
}
