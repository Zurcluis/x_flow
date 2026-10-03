import { requireAuth } from "@/server/auth";
import { VisionOverviewView } from "./VisionOverviewView";

export const dynamic = "force-dynamic";

export default async function VisionOverviewPage() {
  await requireAuth();

  return <VisionOverviewView />;
}
