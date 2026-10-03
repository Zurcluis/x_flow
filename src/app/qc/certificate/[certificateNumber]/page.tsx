import { requirePublicToken } from "@/server/auth";
import { QcCertificateView } from "./QcCertificateView";

export const dynamic = "force-dynamic";

export default async function QcCertificatePage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>;
}) {
  const { certificateNumber } = await params;
  await requirePublicToken("qc_certificate", certificateNumber);

  return <QcCertificateView certificateNumber={certificateNumber} />;
}
