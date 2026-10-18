import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";
import { initialVisionAnalyses } from "@/lib/demo-data/vision-simulation-data";
import { VisionOverviewView } from "./VisionOverviewView";

export const dynamic = "force-dynamic";

export default async function VisionOverviewPage() {
  await requireRole(SCHEDULING_ROLES);

  return <VisionOverviewView initialAnalyses={initialVisionAnalyses} />;
}
