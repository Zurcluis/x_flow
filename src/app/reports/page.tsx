import React from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatting";
import { getReportsData } from "@/server/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { serviceStats, quarterlyRevenue, avgMargin, laborEfficiency, scrapRate } = await getReportsData();

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Relatórios Operacionais & Rentabilidade
          </h1>
          <p className="text-xs text-[#a9adae]">
            Análise determinística de margens por serviço, eficiência de mão de obra e controlo de consumo.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Faturação Trimestral</span>
            <DollarSign className="h-4 w-4 text-[#d3a548]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f1ede5]">
{formatCurrency(quarterlyRevenue)}
            </span>
            <span className="block text-[12px] text-[#68a46b] mt-0.5">
+24.5% vs trimestre anterior
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Margem Bruta Média</span>
            <TrendingUp className="h-4 w-4 text-[#68a46b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#68a46b]">
{avgMargin.toFixed(1) + "%"}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
Acima da meta de 60%
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Eficiência de Mão de Obra</span>
            <CheckCircle2 className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
{laborEfficiency + "%"}
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
X-Motion Time Book benchmarks
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Taxa de Desperdício (Scrap)</span>
            <PieChart className="h-4 w-4 text-[#86abcf]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#86abcf]">
              {scrapRate.toFixed(1) + '%'}
            </span>
            <span className="block text-[12px] text-[#68a46b] mt-0.5">
Meta atingida (&lt; 10%)
            </span>
          </div>
        </Card>
      </div>

      {/* Service Margins Table */}
      <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-[#d3a548]" />
            <h2 className="font-bold text-sm text-[#f1ede5]">
Rentabilidade & Margem Real por Categoria de Serviço
            </h2>
          </div>

          <Badge variant="gold" className="text-xs">
            Cálculo Determinístico (€33/h base)
          </Badge>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.04]">
          <div className="grid grid-cols-12 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#8a9092]">
            <span className="col-span-4">Serviço</span>
            <span className="col-span-2 text-center">Trabalhos</span>
            <span className="col-span-2 text-right">Faturação</span>
            <span className="col-span-2 text-right">Custo Direto</span>
            <span className="col-span-2 text-right">Margem Real</span>
          </div>

          {serviceStats.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 py-3 text-xs items-center">
<span className="col-span-4 font-semibold text-[#f1ede5]">
  {item.service}
</span>
<span className="col-span-2 text-center font-mono text-[#a9adae]">
  {item.jobsCount} viaturas
</span>
<span className="col-span-2 text-right font-mono text-[#f1ede5]">
  {formatCurrency(item.revenue)}
</span>
<span className="col-span-2 text-right font-mono text-[#a9adae]">
  {formatCurrency(item.directCost)}
</span>
<div className="col-span-2 text-right">
  <span className="font-mono font-bold text-[#68a46b]">
    {item.marginPercent}%
  </span>
</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Workshop Bays Occupancy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col justify-between bg-[#101314] border border-white/[0.06]">
          <span className="font-bold text-xs text-[#f1ede5]">Baia 1 — Sala Limpa PPF</span>
          <div className="flex items-end justify-between mt-3">
            <span className="text-2xl font-black font-mono text-[#68a46b]">92%</span>
            <span className="text-[12px] text-[#a9adae]">Taxa de Ocupação</span>
          </div>
          <div className="w-full bg-[#15191a] h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#68a46b] h-full rounded-full" style={{ width: "92%" }} />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between bg-[#101314] border border-white/[0.06]">
          <span className="font-bold text-xs text-[#f1ede5]">Baia 2 — Desmontagem e Wrap</span>
          <div className="flex items-end justify-between mt-3">
            <span className="text-2xl font-black font-mono text-[#f7d46d]">85%</span>
            <span className="text-[12px] text-[#a9adae]">Taxa de Ocupação</span>
          </div>
          <div className="w-full bg-[#15191a] h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#f7d46d] h-full rounded-full" style={{ width: "85%" }} />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between bg-[#101314] border border-white/[0.06]">
          <span className="font-bold text-xs text-[#f1ede5]">Baia 3 — Lavagem & Cura</span>
          <div className="flex items-end justify-between mt-3">
            <span className="text-2xl font-black font-mono text-[#68a46b]">78%</span>
            <span className="text-[12px] text-[#a9adae]">Taxa de Ocupação</span>
          </div>
          <div className="w-full bg-[#15191a] h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#68a46b] h-full rounded-full" style={{ width: "78%" }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
