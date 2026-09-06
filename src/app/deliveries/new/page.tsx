import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listDeliveryCandidates } from "@/server/deliveries";
import { getPrimaryOrganizationId } from "@/server/org";
import { NewDeliveryWizard } from "./NewDeliveryWizard";

export const dynamic = "force-dynamic";

export default async function NewDeliveryPage() {
  const organizationId = await getPrimaryOrganizationId();
  const candidates = await listDeliveryCandidates(organizationId);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <Link
          href="/deliveries"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a9adae] hover:text-[#f7d46d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar às Entregas</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#d3a548]">
            Processo Formal de Levantamento do Veículo
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Nova Entrega ao Cliente
          </h1>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="p-8 rounded-[18px] bg-[#101314] border border-white/[0.06] text-sm text-[#a9adae]">
          Não há ordens de trabalho concluídas com QC aprovado à espera de entrega.
          As OTs aparecem aqui assim que estiverem <strong className="text-[#f1ede5]">concluídas</strong> e
          com o <strong className="text-[#f1ede5]">QC aprovado</strong>.
        </div>
      ) : (
        <NewDeliveryWizard candidates={candidates} />
      )}
    </div>
  );
}
