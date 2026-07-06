import { ViewRouter } from "@/components/ViewRouter";
import { DOMAIN_IDS } from "@/lib/manifest";
import { VIEWS } from "@/lib/select";

/*
 * Static export: pre-render every domain x view combination so each is a real
 * page with its own URL for deep linking. Query params (run/ep/step) are read
 * client-side by the views that need them.
 */
export function generateStaticParams() {
  return DOMAIN_IDS.flatMap((domain) => VIEWS.map((view) => ({ domain, view })));
}

export const dynamicParams = false;

export default async function Page({
  params,
}: {
  params: Promise<{ domain: string; view: string }>;
}) {
  const { domain, view } = await params;
  return <ViewRouter domain={domain} view={view} />;
}
