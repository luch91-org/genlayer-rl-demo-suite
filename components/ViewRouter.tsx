/*
 * Maps a (domain, view) pair to the component that renders it. The overview is
 * the interactive control room; the rest are the per-phase views. This is the
 * one place that knows the set of views, so adding a view is a one-line change
 * here plus its component.
 */

import { ControlRoom } from "./controlroom/ControlRoom";
import { EpisodeView } from "./episode/EpisodeView";
import { LearningView } from "./learning/LearningView";
import { LiveView } from "./live/LiveView";
import { VerificationView } from "./verification/VerificationView";
import { ViewPlaceholder } from "./ViewPlaceholder";

export function ViewRouter({ domain, view }: { domain: string; view: string }) {
  switch (view) {
    case "overview":
      return <ControlRoom domainId={domain} />;
    case "episode":
      return <EpisodeView domainId={domain} />;
    case "learning":
      return <LearningView domainId={domain} />;
    case "verification":
      return <VerificationView domainId={domain} />;
    case "live":
      return <LiveView domainId={domain} />;
    default:
      return <ViewPlaceholder view={view} />;
  }
}
