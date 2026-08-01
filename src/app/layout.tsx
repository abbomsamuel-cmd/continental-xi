import type { Metadata, Viewport } from "next";
import { Oswald, Manrope } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { StadiumBackground } from "@/components/StadiumBackground";
import { Ambience } from "@/components/fx/Ambience";
import { NavBar } from "@/components/NavBar";
import { BottomNav } from "@/components/BottomNav";
import { AppMain } from "@/components/AppMain";
import { SiteCredit } from "@/components/SiteCredit";
import { EggToast } from "@/components/EggToast";
import { MotionGate } from "@/components/MotionGate";
import { LangProvider } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

// A bold, condensed broadcast-scoreboard face for headings and stat labels —
// reads as sports HUD/graphics, not a generic startup sans.
const display = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Continental XI — Champions Draft & Tournament Simulator",
  description:
    "Draft legendary footballers from every European Cup era, build the ultimate XI, and lead your squad through the modern 36-team league phase to continental glory.",
  keywords: ["football draft", "champions league simulator", "ultimate team", "tournament simulator"],
  applicationName: "Continental XI",
  authors: [{ name: "Continental XI" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Continental XI — Champions Draft Simulator",
    description: "Build the greatest European XI ever and win the modern league-phase tournament.",
    type: "website",
    url: SITE_URL,
    siteName: "Continental XI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Continental XI — Champions Draft Simulator",
    description: "Build the greatest European XI ever and win the modern league-phase tournament.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e17",
  width: "device-width",
  initialScale: 1,
  // cover lets env(safe-area-inset-*) work on notched phones; zoom stays enabled
  // for accessibility — accidental double-tap zoom is handled via touch-action.
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LangProvider>
          <MotionGate>
            <StadiumBackground />
            <Ambience />
            <NavBar />
            <AppMain>{children}</AppMain>
            <BottomNav />
            <SiteCredit />
            <EggToast />
          </MotionGate>
        </LangProvider>
      </body>
    </html>
  );
}
