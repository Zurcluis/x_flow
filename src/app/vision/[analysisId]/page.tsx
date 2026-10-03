import { requireAuth } from "@/server/auth";
import { VisionAnalysisDetailView } from "./VisionAnalysisDetailView";

export const dynamic = "force-dynamic";

export default async function VisionAnalysisDetailPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  await requireAuth();
  const { analysisId } = await params;

  return <VisionAnalysisDetailView analysisId={analysisId} />;
}
