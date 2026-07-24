"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Career Mode is now one screen — the chapter runner lives on /career. */
export default function SeasonRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/career"); }, [router]);
  return <div className="min-h-screen" />;
}
