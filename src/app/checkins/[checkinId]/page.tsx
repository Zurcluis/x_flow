import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckinDetailView } from "./CheckinDetailView";
import { getCheckinById } from "@/server/checkins";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function CheckinDetailPage({
  params,
}: {
  params: Promise<{ checkinId: string }>;
}) {
  const { checkinId } = await params;
  const organizationId = await getPrimaryOrganizationId();
  const checkin = await getCheckinById(organizationId, checkinId);

  if (!checkin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold text-[#f1ede5]">Check-in não encontrado</h2>
        <Link href="/checkins">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar a Check-ins</span>
          </Button>
        </Link>
      </div>
    );
  }

  return <CheckinDetailView checkin={checkin} />;
}
