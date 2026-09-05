import React from "react";
import { Logo } from "@/components/xflow/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SparklineWave,
  BarChartSparkline,
  StarRating,
} from "@/components/xflow/MetricSparkCard";
import {
  VehicleRenderSilhouette,
  CapacityRing,
  PendingQuotesIcon,
  StockDangerIcon,
  CoveredCarSilhouette,
} from "@/components/xflow/KpiCard";
import {
  Camera,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default function DesignSystemCatalogPage() {
  return (
    <div className="flex flex-col gap-10 py-4 max-w-5xl">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#d3a548]">
          Documentação Viva de UI
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-[#f1ede5] mt-1">
          Catálogo do Design System X-Flow
        </h1>
        <p className="text-sm text-[#a9adae] mt-2">
          Coleção canónica de tokens, componentes estruturais e estados visuais para o X-Flow by X-Motion.
        </p>
      </div>

      {/* 1. Identidade e Logótipo */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-[#f1ede5] border-b border-white/[0.08] pb-2">
          1. Identidade e Logótipo Canónico
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 flex flex-col gap-4">
            <span className="text-xs text-[#a9adae] font-medium">Logótipo Completo (Full)</span>
            <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-[#080a0b] border border-white/[0.04]">
              <Logo variant="full" size="lg" />
              <Logo variant="full" size="md" />
              <Logo variant="full" size="sm" />
            </div>
          </Card>
          <Card className="p-6 flex flex-col gap-4">
            <span className="text-xs text-[#a9adae] font-medium">Símbolo Linear Fino (Symbol-only)</span>
            <div className="flex items-center gap-6 p-4 rounded-xl bg-[#080a0b] border border-white/[0.04]">
              <Logo variant="symbol" size="lg" />
              <Logo variant="symbol" size="md" />
              <Logo variant="symbol" size="sm" />
            </div>
          </Card>
        </div>
      </section>

      {/* 2. Paleta de Cores e Tokens */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-[#f1ede5] border-b border-white/[0.08] pb-2">
          2. Cores e Superfícies
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#050606] border border-white/10">
            <span className="font-semibold text-[#f1ede5]">Canvas</span>
            <span className="text-[#8a9092]">#050606</span>
          </div>
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#080a0b] border border-white/10">
            <span className="font-semibold text-[#f1ede5]">Sidebar</span>
            <span className="text-[#8a9092]">#080A0B</span>
          </div>
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#101314] border border-white/10">
            <span className="font-semibold text-[#f1ede5]">Surface 1</span>
            <span className="text-[#8a9092]">#101314</span>
          </div>
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#15191a] border border-white/10">
            <span className="font-semibold text-[#f1ede5]">Surface 2</span>
            <span className="text-[#8a9092]">#15191A</span>
          </div>
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#d3a548] text-[#050606]">
            <span className="font-bold">Gold 500</span>
            <span className="opacity-80">#D3A548</span>
          </div>
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#68a46b] text-[#050606]">
            <span className="font-bold">Success</span>
            <span className="opacity-80">#68A46B</span>
          </div>
        </div>
      </section>

      {/* 3. Botões */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-[#f1ede5] border-b border-white/[0.08] pb-2">
          3. Botões e Ações
        </h2>
        <Card className="p-6 flex flex-wrap items-center gap-4">
          <Button variant="primary">
            <Camera className="h-4 w-4" />
            <span>CTA Principal (Gold)</span>
          </Button>
          <Button variant="secondary">
            <FileText className="h-4 w-4" />
            <span>Secundário (Surface)</span>
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 text-[#d3a548]" />
            <span>Outline Dourado</span>
          </Button>
          <Button variant="ghost">Ghost Action</Button>
          <Button variant="danger">
            <AlertTriangle className="h-4 w-4" />
            <span>Perigo</span>
          </Button>
          <Button variant="primary" disabled>
            Desativado
          </Button>
        </Card>
      </section>

      {/* 4. Badges de Estado */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-[#f1ede5] border-b border-white/[0.08] pb-2">
          4. Badges de Estado Operacional
        </h2>
        <Card className="p-6 flex flex-wrap items-center gap-3">
          <Badge variant="in_progress">Em Curso</Badge>
          <Badge variant="waiting_parts">A Guardar Peças</Badge>
          <Badge variant="success">Concluído</Badge>
          <Badge variant="danger">Atraso Crítico</Badge>
          <Badge variant="gold">Time Book Fiável</Badge>
          <Badge variant="default">Agendado</Badge>
          <Badge variant="outline">Orçamento Draft</Badge>
        </Card>
      </section>

      {/* 5. Indicadores Gráficos & Skeletons */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-[#f1ede5] border-b border-white/[0.08] pb-2">
          5. Indicadores Gráficos & Estados de Carregamento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 flex flex-col gap-4">
            <span className="text-xs text-[#a9adae] font-medium">Elementos Gráficos</span>
            <div className="flex flex-wrap items-center gap-6">
              <CapacityRing percentage={76} />
              <VehicleRenderSilhouette />
              <CoveredCarSilhouette />
              <PendingQuotesIcon />
              <StockDangerIcon />
            </div>
            <div className="flex items-center gap-6 pt-4 border-t border-white/[0.04]">
              <SparklineWave data={[10, 25, 18, 40, 35, 50]} />
              <BarChartSparkline data={[30, 45, 60, 80, 50, 70, 90]} />
              <StarRating stars={5} />
            </div>
          </Card>

          <Card className="p-6 flex flex-col gap-3">
            <span className="text-xs text-[#a9adae] font-medium">Estados Skeleton</span>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
