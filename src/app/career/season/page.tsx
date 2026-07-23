"use client";

import { useC } from "@/lib/career/copy";
import { ComingSoon } from "@/components/career/ComingSoon";

export default function SeasonPage() {
  const c = useC();
  return (
    <ComingSoon
      icon="◷"
      part={c("Part 2 · Season Engine", "Parte 2 · Motor de Temporada")}
      title={c("Play out your season", "Juega tu temporada")}
      blurb={c("Watch each campaign unfold month by month — goals, form, injuries and the career moments where your decisions shape what comes next.",
        "Vive cada campaña mes a mes — goles, forma, lesiones y los momentos de carrera donde tus decisiones marcan lo que viene.")}
    />
  );
}
