import { CheckinReportView } from "./CheckinReportView";
import { getCheckinByToken } from "@/server/checkins";

export const dynamic = "force-dynamic";

export default async function PublicCheckinReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const checkin = await getCheckinByToken(token);

  return <CheckinReportView checkin={checkin} />;
}
