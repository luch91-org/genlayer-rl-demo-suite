"use client";

/*
 * Persistent chrome: brand, a tab per domain, and a tab per view. The active
 * domain and view are read from the pathname (/{domain}/{view}), so the shell
 * stays mounted while the content below switches. Tabs are real links, so deep
 * links and the back button work on the static host.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOMAIN_IDS } from "@/lib/manifest";
import { VIEWS, type View } from "@/lib/select";
import { useManifests } from "@/lib/store";

const VIEW_LABELS: Record<View, string> = {
  overview: "Overview",
  episode: "Episode",
  learning: "Learning",
  verification: "Verification",
  live: "Live",
};

function parsePath(pathname: string): { domain: string; view: string } {
  const parts = pathname.split("/").filter(Boolean);
  return { domain: parts[0] ?? "", view: parts[1] ?? "" };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { domain: activeDomain, view: activeView } = parsePath(pathname);
  const manifests = useManifests();

  const labelFor = (id: string): string => {
    const found = manifests?.find((r) => r.id === id);
    return found && found.ok ? found.manifest.domain.plain_name : id;
  };

  const currentDomain = DOMAIN_IDS.includes(activeDomain as never)
    ? activeDomain
    : DOMAIN_IDS[0];

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">GenLayer RL Demo Suite</span>
            <span className="brand-sub">agents learning judgment on-chain</span>
          </div>

          <nav className="tabs tabs-domains" aria-label="Domains">
            {DOMAIN_IDS.map((id) => (
              <Link
                key={id}
                href={`/${id}/overview/`}
                className="tab"
                aria-current={id === activeDomain ? "page" : undefined}
              >
                {labelFor(id)}
              </Link>
            ))}
          </nav>

          <nav className="tabs tab-views" aria-label="Views">
            {VIEWS.map((v) => (
              <Link
                key={v}
                href={`/${currentDomain}/${v}/`}
                className="tab"
                aria-current={v === activeView ? "page" : undefined}
              >
                {VIEW_LABELS[v]}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="wrap">{children}</main>
    </>
  );
}
