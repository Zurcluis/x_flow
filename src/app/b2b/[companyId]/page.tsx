import { notFound } from "next/navigation";
import { B2BCompanyDetailView } from "./B2BCompanyDetailView";
import { getB2BAccountById } from "@/server/b2b";
import { requireRole } from "@/server/auth";
import { MANAGEMENT_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function B2BCompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const auth = await requireRole(MANAGEMENT_ROLES);
  const { companyId } = await params;
  const account = await getB2BAccountById(auth.organizationId, companyId);
  if (!account) notFound();

  return <B2BCompanyDetailView account={account} />;
}
