export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "expired";

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
