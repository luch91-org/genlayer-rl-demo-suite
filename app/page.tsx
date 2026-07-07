import { HomeOverview } from "@/components/HomeOverview";

/*
 * The home page renders the real overview: four agent cards with live status
 * and learning sparklines. No redirect, so there is no flash on entry.
 */
export default function Home() {
  return <HomeOverview />;
}
