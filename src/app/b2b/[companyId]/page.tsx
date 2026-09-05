import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { B2BCompanyDetailView } from "./B2BCompanyDetailView";
import { listB2BAccounts } from "@/server/b2b";
import { getPrimaryOrganizationId } from "@/server/org";

export const dynamic = "force-dynamic";

export default async function B2BCompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const organizationId = await getPrimaryOrganizationId();
  const accounts = await listB2BAccounts(organizationId);
  const account = accounts.find((a) => a.id === companyId);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-2xl font-bold text-[#f1ede5]">Parceiro B2B não encontrado</h2>
        <Link href="/b2b">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao portal B2B</span>
          </Button>
        </Link>
      </div>
    );
  }

  return <B2BCompanyDetailView account={account} />;
}
