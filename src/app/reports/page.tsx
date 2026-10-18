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
import { requireRole } from "@/server/auth";
import { FINANCIAL_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  month: "short",
  year: "2-digit",
});

function monthLabel(value: string): string {
  const date = new Date(`${value}-01T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : MONTH_FORMATTER.format(date);
}

export default async function ReportsPage() {
  const auth = await requireRole(FINANCIAL_ROLES);
  const {
    serviceStats,
    quarterlyRevenue,
    previousQuarterRevenue,
    quarterChangePercent,
    avgMargin,
    laborEfficiency,
    scrapRate,
    monthlyRevenue,
  } = await getReportsData(auth.organizationId);

  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 0);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Relatórios Operacionais & Rentabilidade
          </h1>
          <p className="text-xs text-[#a9adae]">
            Dados reais da organização: margens dos orçamentos aprovados, eficiência das ordens
            concluídas e faturação espelhada do weoInvoice.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] self-start">
          Sem valores demonstrativos
        </Badge>
      </div>

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
            <span
              className={
                "block text-[12px] mt-0.5 " +
                (quarterChangePercent === null
                  ? "text-[#8a9092]"
                  : quarterChangePercent >= 0
                    ? "text-[#68a46b]"
                    : "text-[#c96a6a]")
              }
            >
              {quarterChangePercent === null
                ? `Sem trimestre anterior comparável (${formatCurrency(previousQuarterRevenue)})`
                : `${quarterChangePercent >= 0 ? "+" : ""}${quarterChangePercent.toFixed(1)}% vs trimestre anterior`}
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
              {avgMargin.toFixed(1)}%
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              ponderada sobre a base tributável dos orçamentos aprovados
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9adae]">Horas Reais / Estimadas</span>
            <CheckCircle2 className="h-4 w-4 text-[#f7d46d]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#f7d46d]">
              {laborEfficiency.toFixed(1)}%
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              100% = dentro do estimado, em ordens concluídas
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
              {scrapRate.toFixed(1)}%
            </span>
            <span className="block text-[12px] text-[#a9adae] mt-0.5">
              média registada nas utilizações de material
            </span>
          </div>
        </Card>
      </div>

      <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-[#d3a548]" />
            <h2 className="font-bold text-sm text-[#f1ede5]">
              Rentabilidade & Margem Real por Categoria de Serviço
            </h2>
          </div>
          <Badge variant="gold" className="text-xs">
            Base: orçamentos aprovados
          </Badge>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.04]">
          <div className="grid grid-cols-12 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#8a9092]">
            <span className="col-span-4">Serviço</span>
            <span className="col-span-2 text-center">Orçamentos</span>
            <span className="col-span-2 text-right">Valor c/ IVA</span>
            <span className="col-span-2 text-right">Custo Direto</span>
            <span className="col-span-2 text-right">Margem Real</span>
          </div>

          {serviceStats.length === 0 && (
            <div className="py-8 text-center text-xs text-[#8a9092]">
              Sem orçamentos aprovados para calcular margens.
            </div>
          )}

          {serviceStats.map((item) => (
            <div key={item.service} className="grid grid-cols-12 py-3 text-xs items-center">
              <span className="col-span-4 font-semibold text-[#f1ede5]">{item.service}</span>
              <span className="col-span-2 text-center font-mono text-[#a9adae]">
                {item.jobsCount}
              </span>
              <span className="col-span-2 text-right font-mono text-[#f1ede5]">
                {formatCurrency(item.revenue)}
              </span>
              <span className="col-span-2 text-right font-mono text-[#a9adae]">
                {formatCurrency(item.directCost)}
              </span>
              <div className="col-span-2 text-right">
                <span
                  className={
                    "font-mono font-bold " +
                    (item.marginPercent >= 0 ? "text-[#68a46b]" : "text-[#c96a6a]")
                  }
                >
                  {item.marginPercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 flex flex-col gap-4 bg-[#101314] border border-white/[0.06]">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h2 className="font-bold text-sm text-[#f1ede5]">
            Faturação mensal — últimos 6 meses
          </h2>
          <span className="text-[11px] text-[#8a9092]">Inclui o mês em curso · faturas não anuladas</span>
        </div>

        {maxMonthlyRevenue <= 0 ? (
          <div className="py-8 text-center text-xs text-[#8a9092]">
            Sem faturação registada nos últimos 6 meses.
          </div>
        ) : (
          <div className="grid grid-cols-6 items-end gap-3 h-40">
            {monthlyRevenue.map((month) => {
              const height = Math.max(
                month.revenue > 0 ? 4 : 0,
                Math.round((month.revenue / maxMonthlyRevenue) * 100)
              );
              return (
                <div key={month.month} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="font-mono text-[10px] text-[#a9adae]">
                    {formatCurrency(month.revenue)}
                  </span>
                  <div
                    className="w-full rounded-t-sm bg-[#d3a548]/70"
                    style={{ height: `${height}%` }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] text-[#8a9092] capitalize">
                    {monthLabel(month.month)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
