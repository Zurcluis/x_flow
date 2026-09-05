import React from "react";
import {
  KpiCard,
  VehicleRenderSilhouette,
  PendingQuotesIcon,
  CapacityRing,
  StockDangerIcon,
  CoveredCarSilhouette,
} from "@/components/xflow/KpiCard";
import { ActiveWorksCard } from "@/components/xflow/WorkOrderRow";
import { AgendaTimeline } from "@/components/xflow/AgendaTimeline";
import { XFlowIntelligenceCard } from "@/components/xflow/AlertCard";
import {
  MetricCard,
  SparklineWave,
  BarChartSparkline,
  StarRating,
} from "@/components/xflow/MetricSparkCard";
import { getDashboardData } from "@/server/dashboard";
import { formatCurrency, formatPercentage } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export default async function CentroDeComandoPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col pb-4 border-b border-white/[0.04]">
        <span className="text-xs font-medium text-[#a9adae] tracking-wide">
          {data.user.greeting}
        </span>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f1ede5]">
          Centro de Comando
        </h1>
      </div>

      {/* Top 5 KPI Cards Grid */}
      <section
        aria-label="Indicadores Chave do Dia"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* 1. Hoje na Oficina */}
        <KpiCard
          title="Hoje na Oficina"
          value={data.kpis.todayVehicles.count}
          label={data.kpis.todayVehicles.label}
          linkText={data.kpis.todayVehicles.linkText}
          href={data.kpis.todayVehicles.href}
        >
          <VehicleRenderSilhouette />
        </KpiCard>

        {/* 2. Orçamentos Pendentes */}
        <KpiCard
          title="Orçamentos Pendentes"
          value={data.kpis.pendingQuotes.count}
          label={data.kpis.pendingQuotes.label}
          linkText={data.kpis.pendingQuotes.linkText}
          href={data.kpis.pendingQuotes.href}
        >
          <PendingQuotesIcon />
        </KpiCard>

        {/* 3. Capacidade Semanal */}
        <KpiCard
          title="Capacidade Semanal"
          value={`${data.kpis.weeklyCapacity.percentage}%`}
          label={data.kpis.weeklyCapacity.detail}
          linkText={data.kpis.weeklyCapacity.linkText}
          href={data.kpis.weeklyCapacity.href}
        >
          <CapacityRing percentage={data.kpis.weeklyCapacity.percentage} />
        </KpiCard>

        {/* 4. Stock Crítico */}
        <KpiCard
          title="Stock Crítico"
          value={data.kpis.criticalStock.count}
          label={data.kpis.criticalStock.label}
          linkText={data.kpis.criticalStock.linkText}
          href={data.kpis.criticalStock.href}
          isDanger={true}
        >
          <StockDangerIcon />
        </KpiCard>

        {/* 5. Entregas de Hoje */}
        <KpiCard
          title="Entregas de Hoje"
          value={data.kpis.todayDeliveries.count}
          label={data.kpis.todayDeliveries.label}
          linkText={data.kpis.todayDeliveries.linkText}
          href={data.kpis.todayDeliveries.href}
        >
          <CoveredCarSilhouette />
        </KpiCard>
      </section>

      {/* Middle 3 Operational Blocks Grid */}
      <section
        aria-label="Operações em Curso e Alertas"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* Trabalhos em Curso (Left - 5 cols) */}
        <div className="lg:col-span-5">
          <ActiveWorksCard works={data.activeWorks} />
        </div>

        {/* Agenda de Hoje (Middle - 4 cols) */}
        <div className="lg:col-span-4">
          <AgendaTimeline events={data.todayAgenda} />
        </div>

        {/* X-Flow Intelligence (Right - 3 cols) */}
        <div className="lg:col-span-3">
          <XFlowIntelligenceCard alerts={data.intelligenceAlerts} />
        </div>
      </section>

      {/* Bottom 4 Financial & Operational Metric Cards */}
      <section
        aria-label="Métricas Financeiras e de Satisfação"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* 1. Faturação do Mês */}
        <MetricCard
          title="Faturação do Mês"
          value={formatCurrency(data.metrics.monthlyRevenue.value)}
          change={formatPercentage(data.metrics.monthlyRevenue.changePercentage, true)}
          subtitle={data.metrics.monthlyRevenue.comparisonText}
        >
          <SparklineWave data={data.metrics.monthlyRevenue.sparkline} />
        </MetricCard>

        {/* 2. Margem Estimada */}
        <MetricCard
          title="Margem Estimada"
          value={formatCurrency(data.metrics.estimatedMargin.value)}
          change={formatPercentage(data.metrics.estimatedMargin.changePercentage, true)}
          subtitle={`${data.metrics.estimatedMargin.marginRate}% de margem`}
        >
          <SparklineWave data={data.metrics.estimatedMargin.sparkline} />
        </MetricCard>

        {/* 3. Taxa de Ocupação */}
        <MetricCard
          title="Taxa de Ocupação"
          value={`${data.metrics.occupancyRate.percentage}%`}
          change={formatPercentage(data.metrics.occupancyRate.changePercentage, true)}
          subtitle={data.metrics.occupancyRate.hoursDetail}
        >
          <BarChartSparkline data={data.metrics.occupancyRate.barChart} />
        </MetricCard>

        {/* 4. Qualidade (QC) */}
        <MetricCard
          title="Aprovações em QC"
          value={`${data.metrics.customerSatisfaction.score} / ${data.metrics.customerSatisfaction.maxScore}`}
          change={`${data.metrics.customerSatisfaction.reviewsCount} inspeções`}
          subtitle={
            data.metrics.customerSatisfaction.reviewsCount
              ? `Baseado em ${data.metrics.customerSatisfaction.reviewsCount} inspeções QC`
              : "Sem inspeções registadas"
          }
        >
          <StarRating stars={data.metrics.customerSatisfaction.stars} />
        </MetricCard>
      </section>
    </div>
  );
}
