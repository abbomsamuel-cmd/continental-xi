import type { MetadataRoute } from "next";

const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Continental XI — Champions Draft & Tournament Simulator",
    short_name: "Continental XI",
    description:
      "Draft legendary footballers from every European Cup era and lead your XI through the modern league phase to continental glory.",
    start_url: `${bp}/`,
    display: "standalone",
    background_color: "#020814",
    theme_color: "#061a40",
    icons: [{ src: `${bp}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
