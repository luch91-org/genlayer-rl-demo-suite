/*
 * Maps a (domain, view) pair to the component that renders it. Overview is
 * live; the other views are honest placeholders until their phases land. This
 * is the one place that knows the set of views, so adding a view is a one-line
 * change here plus its component.
 */

import { Overview } from "./Overview";
import { ViewPlaceholder } from "./ViewPlaceholder";

export function ViewRouter({ domain, view }: { domain: string; view: string }) {
  switch (view) {
    case "overview":
      return <Overview domainId={domain} />;
    default:
      return <ViewPlaceholder view={view} />;
  }
}
