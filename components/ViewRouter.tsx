/*
 * Maps a (domain, view) pair to the component that renders it. Overview is
 * live; the other views are honest placeholders until their phases land. This
 * is the one place that knows the set of views, so adding a view is a one-line
 * change here plus its component.
 */

import { EpisodeView } from "./episode/EpisodeView";
import { LearningView } from "./learning/LearningView";
import { Overview } from "./Overview";
import { VerificationView } from "./verification/VerificationView";
import { ViewPlaceholder } from "./ViewPlaceholder";

export function ViewRouter({ domain, view }: { domain: string; view: string }) {
  switch (view) {
    case "overview":
      return <Overview domainId={domain} />;
    case "episode":
      return <EpisodeView domainId={domain} />;
    case "learning":
      return <LearningView domainId={domain} />;
    case "verification":
      return <VerificationView domainId={domain} />;
    default:
      return <ViewPlaceholder view={view} />;
  }
}
