"use client";

import { useC } from "@/lib/career/copy";
import { ComingSoon } from "@/components/career/ComingSoon";

export default function NationalPage() {
  const c = useC();
  return (
    <ComingSoon
      icon="⚑"
      part={c("Part 2 · National Team", "Parte 2 · Selección")}
      title={c("Represent your country", "Representa a tu país")}
      blurb={c("Earn your first call-up, debut on the big stage, chase a Copa América or a World Cup, and one day lead your nation as captain.",
        "Gánate tu primera convocatoria, debuta a lo grande, persigue una Copa América o un Mundial, y algún día lidera a tu país como capitán.")}
    />
  );
}
