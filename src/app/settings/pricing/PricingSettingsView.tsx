"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Info,
  Landmark,
  Package,
  Receipt,
  Sigma,
} from "lucide-react";
import type { PricingContextData } from "@/server/pricing";
import {
  archiveExpenseItemAction,
  publishFormulaAction,
  saveExpenseItemAction,
  saveKitAction,
  savePolicySettingsAction,
  saveSupplierAction,
  saveSupplierServiceAction,
} from "@/app/actions/pricing";
import type {
  PublishFormulaInput,
  SaveExpenseItemInput,
  SaveKitInput,
  SavePolicyInput,
  SaveSupplierInput,
  SaveSupplierServiceInput,
} from "@/app/actions/pricing";
import type {
  ConsumableKit,
  PricingExpenseItem,
  PricingPolicy,
  PricingRates,
  SupplierService,
} from "@/domains/pricing/types";
import { round2 } from "@/domains/pricing/engine";
import { formatCurrency } from "@/lib/formatting";
import { ExpensesTab } from "./ExpensesTab";
import { BaseFinanceTab } from "./BaseFinanceTab";
import { FormulasTab } from "./FormulasTab";
import { KitsSuppliersTab } from "./KitsSuppliersTab";
import { todayISO } from "./controls";
import {
  buildFormPolicy,
  DEFAULT_POLICY_FORM,
  policyFormFromPolicy,
  tryResolveRates,
  type PolicyForm,
} from "./pricing-utils";

type TabId = "expenses" | "base" | "formulas" | "kits";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "expenses", label: "Despesas e reservas", icon: Receipt },
  { id: "base", label: "Base financeira", icon: Landmark },
  { id: "formulas", label: "Fórmulas", icon: Sigma },
  { id: "kits", label: "Kits e fornecedores", icon: Package },
];

export type SaveItemResult =
  | { ok: true; id: string; version: number }
  | { ok: false; error: string };

export type SaveWithIdResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type SimpleResult =
  | { ok: true }
  | { ok: false; error: string };

export type PublishResult =
  | { ok: true; versionId: string; version: number }
  | { ok: false; error: string };

export function PricingSettingsView({ context }: { context: PricingContextData }) {
  const [activeTab, setActiveTab] = useState<TabId>("expenses");

  const [items, setItems] = useState<PricingExpenseItem[]>(context.expenseItems);
  const [currentPolicy, setCurrentPolicy] = useState<PricingPolicy | null>(
    context.policy
  );
  const [formulas, setFormulas] = useState(context.formulas);
  const [kits, setKits] = useState<ConsumableKit[]>(context.kits);
  const [supplierServices, setSupplierServices] = useState<SupplierService[]>(
    context.supplierServices
  );

  const [form, setForm] = useState<PolicyForm>(() =>
    context.policy ? policyFormFromPolicy(context.policy) : {
      ...DEFAULT_POLICY_FORM,
      effectiveFrom: todayISO(),
    }
  );

  const editedRates: PricingRates | null = useMemo(
    () => tryResolveRates(buildFormPolicy(form), items),
    [form, items]
  );

  const methodNote =
    form.method === "manual"
      ? `A base diária de ${formatCurrency(form.manualDailyExpenses)} mantém-se; alteraste a previsão mensal.`
      : null;

  const handleFormChange = (patch: Partial<PolicyForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSavePolicy = async (
    intent: "draft" | "publish"
  ): Promise<{ ok: true; version: number } | { ok: false; error: string }> => {
    const input: SavePolicyInput = {
      method: form.method,
      manualDailyExpenses: form.manualDailyExpenses,
      dailyCapacityHours: form.dailyCapacityHours,
      profitDailyTarget: form.profitDailyTarget,
      spotSurchargePerHour: form.spotSurchargePerHour,
      productiveDaysPerMonth:
        form.method === "monthly" ? form.productiveDaysPerMonth : null,
      subletFeePercent: form.subletFeePercent,
      wasteRatePercent: form.wasteRatePercent,
      vatRate: form.vatRate,
      intent,
      effectiveFrom: form.effectiveFrom,
    };
    const result = await savePolicySettingsAction(input);
    if (result.ok && intent === "publish") {
      setCurrentPolicy({
        ...buildFormPolicy(form),
        id: result.policyId,
        organizationId: currentPolicy?.organizationId ?? "",
        version: result.version,
        status: "active",
        publishedAt: new Date().toISOString(),
        createdAt: currentPolicy?.createdAt ?? new Date().toISOString(),
      });
    }
    return result;
  };

  const handleSaveExpenseItem = async (
    input: SaveExpenseItemInput
  ): Promise<SaveItemResult> => {
    const result = await saveExpenseItemAction(input);
    if (result.ok) {
      const monthlyEquivalent =
        input.periodicity === "yearly"
          ? round2(input.amount / 12)
          : round2(input.amount);
      setItems((prev) => {
        const index = prev.findIndex((item) => item.id === input.id);
        const target = index >= 0 ? prev[index] : undefined;
        const next: PricingExpenseItem = {
          id: result.id,
          organizationId: target?.organizationId ?? "",
          version: result.version,
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          kind: input.kind,
          amount: input.amount,
          periodicity: input.periodicity,
          monthlyEquivalent,
          includedInPricing: input.includedInPricing,
          includesPersonnel: input.includesPersonnel,
          source: input.source ?? null,
          validationState: input.validationState,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: null,
          notes: input.notes ?? null,
          createdAt: target?.createdAt ?? new Date().toISOString(),
        };
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = next;
          return copy;
        }
        return [...prev, next];
      });
    }
    return result;
  };

  const handleArchiveExpenseItem = async (
    itemId: string,
    effectiveTo: string
  ): Promise<SimpleResult> => {
    const result = await archiveExpenseItemAction(itemId, effectiveTo);
    if (result.ok) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
    return result;
  };

  const handlePublishFormula = async (
    input: PublishFormulaInput
  ): Promise<PublishResult> => {
    const result = await publishFormulaAction(input);
    if (result.ok) {
      setFormulas((prev) =>
        prev.map((summary) => {
          if (summary.formulaId !== input.formulaId) return summary;
          return {
            ...summary,
            published: {
              id: result.versionId,
              organizationId: summary.published?.organizationId ?? "",
              formulaId: input.formulaId,
              code: summary.code,
              name: input.name,
              description: input.description ?? null,
              version: result.version,
              components: input.components,
              status: "published" as const,
              effectiveFrom: input.effectiveFrom,
              publishedAt: new Date().toISOString(),
              createdAt:
                summary.published?.createdAt ?? new Date().toISOString(),
            },
          };
        })
      );
    }
    return result;
  };

  const handleSaveKit = async (
    input: SaveKitInput
  ): Promise<SaveWithIdResult> => {
    const result = await saveKitAction(input);
    if (result.ok) {
      setKits((prev) => {
        const index = prev.findIndex((kit) => kit.id === input.id);
        const target = index >= 0 ? prev[index] : undefined;
        const next: ConsumableKit = {
          id: result.id,
          organizationId: target?.organizationId ?? "",
          code: target?.code ?? `kit-${input.kind}-${Date.now()}`,
          name: input.name,
          kind: input.kind,
          price: input.price,
          active: input.active ?? true,
          createdAt: target?.createdAt ?? new Date().toISOString(),
        };
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = next;
          return copy;
        }
        return [...prev, next];
      });
    }
    return result;
  };

  const handleSaveSupplier = async (
    input: SaveSupplierInput
  ): Promise<SaveWithIdResult> => {
    return saveSupplierAction(input);
  };

  const handleSaveSupplierService = async (
    input: SaveSupplierServiceInput,
    supplierName: string
  ): Promise<SaveWithIdResult> => {
    const result = await saveSupplierServiceAction(input);
    if (result.ok) {
      setSupplierServices((prev) => {
        const index = prev.findIndex((service) => service.id === input.id);
        const target = index >= 0 ? prev[index] : undefined;
        const next: SupplierService = {
          id: result.id,
          organizationId: target?.organizationId ?? "",
          supplierId: input.supplierId,
          supplierName,
          serviceName: input.serviceName,
          basePrice: input.basePrice,
          replacedPhaseKey: input.replacedPhaseKey ?? null,
          phaseHours: input.phaseHours ?? null,
          active: input.active ?? true,
          createdAt: target?.createdAt ?? new Date().toISOString(),
        };
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = next;
          return copy;
        }
        return [...prev, next];
      });
    }
    return result;
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-4 border-b border-white/[0.04]">
        <Link href="/settings" className="self-start">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#a9adae] hover:text-[#f1ede5] transition-colors cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" />
            Configurações
          </span>
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
            Orçamentos e preços
          </h1>
          <p className="text-xs text-[#a9adae]">
            Rubricas mensais, base financeira, fórmulas de preço e kits de
            consumíveis para precificar os orçamentos.
          </p>
        </div>
      </div>

      {/* Primeira configuração */}
      {!currentPolicy && (
        <div className="flex items-start gap-3 p-4 rounded-md bg-[#d3a548]/10 border border-[#d3a548]/30">
          <Info className="h-4 w-4 text-[#d3a548] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#f7d46d]">
              Primeira configuração
            </span>
            <span className="text-xs text-[#a9adae]">
              Ainda não existe base financeira ativa. Regista as rubricas
              mensais e define os parâmetros no separador «Base financeira»
              para começar a precificar orçamentos.
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:flex gap-2 p-1 rounded-md bg-[#080a0b] border border-white/[0.06] select-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                active
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                  : "text-[#a9adae] hover:text-[#f1ede5]"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "expenses" && (
        <ExpensesTab
          items={items}
          saveItem={handleSaveExpenseItem}
          archiveItem={handleArchiveExpenseItem}
          methodNote={methodNote}
        />
      )}

      {activeTab === "base" && (
        <BaseFinanceTab
          form={form}
          onFormChange={handleFormChange}
          items={items}
          initialPolicy={currentPolicy}
          onSavePolicy={handleSavePolicy}
          onGoToExpenses={() => setActiveTab("expenses")}
        />
      )}

      {activeTab === "formulas" && (
        <FormulasTab
          formulas={formulas}
          rates={editedRates}
          publishFormula={handlePublishFormula}
        />
      )}

      {activeTab === "kits" && (
        <KitsSuppliersTab
          kits={kits}
          supplierServices={supplierServices}
          saveKit={handleSaveKit}
          saveSupplier={handleSaveSupplier}
          saveSupplierService={handleSaveSupplierService}
        />
      )}
    </div>
  );
}
