import { MANAGEMENT_ROLES } from "@/lib/roles";
import { isGeminiConfigured } from "@/server/ai/gemini";
import { requireRole } from "@/server/auth";
import {
  getOrCreateInstagramProfile,
  listMarketingVehicleOptions,
  listPublishedInstagramPosts,
  listSocialPosts,
} from "@/server/marketing/repository";
import { MarketingView } from "./MarketingView";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const auth = await requireRole(MANAGEMENT_ROLES);

  const [profile, publishedPosts, plannedPosts, vehicles] = await Promise.all([
    getOrCreateInstagramProfile(auth.organizationId),
    listPublishedInstagramPosts(auth.organizationId, 36),
    listSocialPosts(auth.organizationId),
    listMarketingVehicleOptions(auth.organizationId),
  ]);

  const nowDate = new Date();
  const autoSyncNeeded =
    !profile.lastSyncedAt ||
    publishedPosts.length === 0 ||
    nowDate.getTime() - Date.parse(profile.lastSyncedAt) > 30 * 60 * 1000;

  return (
    <MarketingView
      initialProfile={profile}
      initialPublishedPosts={publishedPosts}
      initialPlannedPosts={plannedPosts}
      vehicles={vehicles}
      aiEnabled={isGeminiConfigured()}
      autoSyncNeeded={autoSyncNeeded}
    />
  );
}
