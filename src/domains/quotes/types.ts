export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "expired";

import type {
  AdjustKind,
  CostLineType,
  CostLineUnit,
  QuoteCostLine,
  ServiceLine,
  ServiceLineMode,
} from "@/domains/pricing/types";

export type OptionTier = "essential" | "recommended" | "premium";

export interface QuoteOptionItem {
  id: string;
  serviceName: string;
  bodyPartCode: string;
  bodyPartName: string;
  materialName: string;
  areaM2: number;
  laborHours: number;
  unitPrice: number;
  totalPrice: number;
}

export interface QuoteOption {
  id: string;
  quoteId: string;
  tier: OptionTier;
  name: string;
  description: string;
  isRecommended: boolean;
  warrantyYears: number;
  subtotal: number;
  discountRate: number; // %
  discountAmount: number;
  taxableBase: number;
  vatRate: number; // 0.23 (23%)
  vatAmount: number;
  totalWithVat: number;
  // Margem e custos internos (NUNCA expostos na página pública)
  estimatedCost: number;
  estimatedMarginAmount: number;
  estimatedMarginPercentage: number;
  estimatedHours: number;
  items: QuoteOptionItem[];
}

export interface QuoteEvent {
  id: string;
  quoteId: string;
  eventType:
    | "created"
    | "sent_whatsapp"
    | "sent_email"
    | "viewed_by_client"
    | "option_selected"
    | "approved"
    | "rejected";
  description: string;
  authorName?: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  organizationId: string;
  quoteNumber: string; // ex: ORC-2026-042
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerType: "individual" | "business";
  status: QuoteStatus;
  selectedOptionId?: string;
  publicToken: string; // Token único seguro para /quotes/public/[token]
  expiresAt: string;
  notes?: string;
  createdBy: string;
  approvedAt?: string;
  approvedByName?: string;
  options: QuoteOption[];
  events: QuoteEvent[];
  createdAt: string;
  updatedAt: string;
}

// ===== Orçamentos flexíveis (contrato partilhado entre servidor e interfaces) =====

export interface QuoteOptionItemInput {
  serviceName: string;
  bodyPartCode: string;
  bodyPartName: string;
  materialName: string;
  areaM2: number;
  laborHours: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateQuoteServiceLine {
  name: string;
  description?: string | null;
  mode: ServiceLineMode;
  hours: number;
  notes?: string | null;
  sortOrder: number;
}

export interface CreateQuoteCostLine {
  lineType: CostLineType;
  name: string;
  quantity: number;
  unit: CostLineUnit;
  unitCost: number;
  wasteRatePercent: number;
  totalCost: number;
  kitId?: string | null;
  supplierServiceId?: string | null;
  materialId?: string | null;
  deductedHours?: number | null;
  notes?: string | null;
  sortOrder: number;
}

export interface QuoteOptionInput {
  tier: OptionTier;
  name: string;
  description?: string | null;
  isRecommended?: boolean;
  warrantyYears?: number;
  discountRate?: number;
  kind: "flexible" | "configurator";
  serviceLines?: CreateQuoteServiceLine[];
  costLines?: CreateQuoteCostLine[];
  items?: QuoteOptionItemInput[];
  manualPriceBeforeVat?: number | null;
  adjustKind?: AdjustKind;
  adjustValue?: number;
  adjustReason?: string | null;
}

export interface CreateQuoteInput {
  vehicleId: string;
  customerId: string;
  notes?: string | null;
  intent: "draft" | "send";
  options: QuoteOptionInput[];
}

// Rascunho editável: contrato de carregamento entre servidor e interface.
export interface DraftQuoteOption {
  optionId: string;
  kind: "flexible" | "configurator";
  tier: OptionTier;
  name: string;
  discountRate: number;
  serviceLines: ServiceLine[];
  costLines: QuoteCostLine[];
  items: QuoteOptionItemInput[];
  adjustKind: AdjustKind;
  adjustValue: number;
  adjustReason: string | null;
}

export interface DraftQuoteData {
  quoteId: string;
  quoteNumber: string;
  status: QuoteStatus;
  vehicleId: string;
  customerId: string;
  notes: string | null;
  options: DraftQuoteOption[];
}

// DTO público: só campos destinados ao cliente. Custos, margens, horas e
// parâmetros internos nunca atravessam esta fronteira.

export interface PublicQuoteOptionLine {
  kind: "service" | "material";
  name: string;
  description?: string | null;
  quantity?: number | null;
  unitLabel?: string | null;
}

export interface PublicQuoteOption {
  id: string;
  tier: OptionTier;
  name: string;
  description?: string | null;
  isRecommended: boolean;
  warrantyYears: number;
  taxableBase: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
  discountRate: number;
  discountAmount: number;
  displayLines: PublicQuoteOptionLine[];
}

export interface PublicQuote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  customerName: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear?: number | null;
  vehicleColor?: string | null;
  expiresAt: string;
  notes?: string | null;
  selectedOptionId?: string | null;
  approvedByName?: string | null;
  options: PublicQuoteOption[];
}
