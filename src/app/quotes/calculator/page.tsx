import { requireRole } from "@/server/auth";
import { FINANCIAL_ROLES } from "@/lib/roles";
import { loadPricingContext } from "@/server/pricing";
import { listMaterials } from "@/server/materials";
import { resolvePricingContext, round2 } from "@/domains/pricing/engine";
import {
  DEFAULT_VAT_RATE,
  EXCEL_DEFAULT_FIXED_HOURLY_COST,
} from "@/domains/pricing/quick-calculator";
import { QuickCalculatorView } from "./QuickCalculatorView";

export const dynamic = "force-dynamic";

export default async function QuickCalculatorPage() {
  const auth = await requireRole(FINANCIAL_ROLES);
  const [pricingContext, materials] = await Promise.all([
    loadPricingContext(auth.organizationId),
    listMaterials(auth.organizationId),
  ]);

  let policyHourlyCost: number | null = null;
  let policyVatRate = DEFAULT_VAT_RATE;
  let policyWasteRate = 0;

  if (pricingContext.policy) {
    try {
      const rates = resolvePricingContext({
        policy: pricingContext.policy,
        expenseItems: pricingContext.expenseItems,
      });
      policyHourlyCost = round2(rates.hourlyExpenseAggregated);
      policyVatRate = rates.vatRate;
      policyWasteRate = rates.wasteRatePercent;
    } catch {
      policyHourlyCost = null;
    }
  }

  return (
    <QuickCalculatorView
      initialFixedHourlyCost={policyHourlyCost ?? EXCEL_DEFAULT_FIXED_HOURLY_COST}
      policyHourlyCost={policyHourlyCost}
      initialVatRate={policyVatRate}
      defaultWasteRate={policyWasteRate}
      stockMaterials={materials}
    />
  );
}
