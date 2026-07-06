"use client";

/*
 * The suite opens on the first domain's overview. Static hosts cannot issue a
 * server redirect, so this is a client-side replace that keeps the entry URL
 * clean and the back button sane.
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DOMAIN_IDS } from "@/lib/manifest";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/${DOMAIN_IDS[0]}/overview/`);
  }, [router]);

  return (
    <main className="wrap">
      <p className="mono muted">Opening the demo suite...</p>
    </main>
  );
}
