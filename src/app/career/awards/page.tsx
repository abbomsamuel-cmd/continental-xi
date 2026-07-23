"use client";

import { useC } from "@/lib/career/copy";
import { ComingSoon } from "@/components/career/ComingSoon";

export default function AwardsPage() {
  const c = useC();
  return (
    <ComingSoon
      icon="★"
      part={c("Part 3 · Awards & Legacy", "Parte 3 · Premios y Legado")}
      title={c("Build your trophy cabinet", "Construye tu palmarés")}
      blurb={c("Golden Boots, Player of the Year, an Awards Night reveal, and a trophy cabinet that becomes the story of a great career.",
        "Botas de Oro, Jugador del Año, una Gala de Premios, y un palmarés que se convierte en la historia de una gran carrera.")}
    />
  );
}
