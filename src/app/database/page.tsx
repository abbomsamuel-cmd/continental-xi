"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The public archive was removed at the user's request — send anyone who lands
// here (old link / bookmark) back to the home page.
export default function DatabaseRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
