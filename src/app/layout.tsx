import type { Metadata, Viewport } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";
import { StadiumBackground } from "@/components/StadiumBackground";
import { NavBar } from "@/components/NavBar";
import { SiteCredit } from "@/components/SiteCredit";

const display = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Continental XI — Champions Draft & Tournament Simulator",
  description:
    "Draft legendary footballers from every European Cup era, build the ultimate XI, and lead your squad through the modern 36-team league phase to continental glory.",
  keywords: ["football draft", "champions league simulator", "ultimate team", "tournament simulator"],
  applicationName: "Continental XI",
  authors: [{ name: "Continental XI" }],
  openGraph: {
    title: "Continental XI — Champions Draft Simulator",
    description: "Build the greatest European XI ever and win the modern league-phase tournament.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#061a40",
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
        <StadiumBackground />
        <NavBar />
        <main className="relative z-10">{children}</main>
        <SiteCredit />
      </body>
    </html>
  );
}
