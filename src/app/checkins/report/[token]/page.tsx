import { CheckinReportView } from "./CheckinReportView";
import { getCheckinByToken } from "@/server/checkins";
import { requirePublicToken } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function PublicCheckinReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await requirePublicToken("checkin", token);
  const checkin = await getCheckinByToken(token);

  return <CheckinReportView checkin={checkin} />;
}
