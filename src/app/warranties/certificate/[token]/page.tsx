import { requirePublicToken } from "@/server/auth";
import { WarrantyCertificateView } from "./WarrantyCertificateView";

export const dynamic = "force-dynamic";

export default async function PublicWarrantyCertificatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await requirePublicToken("warranty", token);

  return <WarrantyCertificateView token={token} />;
}
