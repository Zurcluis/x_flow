export type PaymentMethod =
  | "bank_transfer"
  | "mbway"
  | "multibanco"
  | "cash"
  | "credit_30_days";

export type PaymentStatus = "paid" | "pending" | "overdue" | "cancelled";

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // 23%
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "FT2026/42" (formato weoInvoice real)
  workOrderId: string;
  quoteId?: string;
  customerId: string;
  customerName: string;
  customerNif: string;
  customerAddress?: string;
  vehiclePlate: string;
  vehicleModel: string;
  subtotal: number;
  vatRate: number; // 23.00
  vatAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  lines: InvoiceLine[];
}

export interface DeliveryCheckinBelonging {
  id: string;
  name: string;
  isReturned: boolean;
  returnedAt?: string;
}

export interface Delivery {
  id: string;
  workOrderId: string;
  vehiclePlate: string;
  vehicleModel: string;
  customerId: string;
  customerName: string;
  deliveredByName: string;
  receiverName: string;
  receiverIdDocument?: string;
  signatureDataUrl?: string;
  belongingsReturnedConfirmed: boolean;
  belongings: DeliveryCheckinBelonging[];
  notes?: string;
  deliveredAt: string;
  token: string;
}

export interface WarrantyMaintenanceRule {
  id: string;
  title: string;
  description: string;
  isCritical: boolean;
}

export interface WarrantyCertificate {
  id: string;
  vehiclePlate: string;
  vehicleModel: string;
  customerId: string;
  customerName: string;
  workOrderId: string;
  materialName: string;
  batchNumber: string;
  warrantyYears: number;
  certificateNumber: string;
  qcCertificateNumber: string;
  termsText: string;
  maintenanceRules: WarrantyMaintenanceRule[];
  startsAt: string;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
  token: string;
}

export interface PassportEvent {
  id: string;
  date: string;
  type:
    | "checkin"
    | "quote"
    | "work_order"
    | "qc_pass"
    | "invoice"
    | "delivery"
    | "warranty";
  title: string;
  subtitle: string;
  description: string;
  badgeText?: string;
  badgeVariant?: "success" | "gold" | "default" | "outline";
  actorName?: string;
  documentNumber?: string;
  linkHref?: string;
}

export interface PassportFullRecord {
  vehicleId: string;
  plate: string;
  make: string;
  model: string;
  generationYear: number;
  bodyType: string;
  colorName: string;
  vin: string;
  currentMileage: number;
  ownerName: string;
  ownerType: "individual" | "business";
  photoUrl?: string;
  events: PassportEvent[];
  activeWarranty?: {
    materialName: string;
    batchNumber: string;
    warrantyYears: number;
    expiresAt: string;
    certificateNumber: string;
  };
}

// ── Tesouraria (Fase 2 — Gestão Financeira) ──────────────────────────────────

export type TransactionType = "income" | "expense" | "transfer";
export type TransactionSourceType =
  | "manual"
  | "invoice_payment"
  | "recurring"
  | "import"
  | "tax_payment";

export interface TransactionCategory {
  id: string;
  name: string;
  kind:
    | "operational"
    | "tax"
    | "payroll"
    | "rent"
    | "marketing"
    | "supplier"
    | "other";
  isRecurring: boolean;
  vatDefaultRate: number;
}

export interface BankAccount {
  id: string;
  name: string;
  iban?: string;
  bic?: string;
  kind: "bank" | "cash" | "mbway";
  initialBalance: number;
  active: boolean;
}

export interface RecurringRule {
  id: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  type: "income" | "expense";
  amount: number;
  vatRate: number;
  frequency: "monthly" | "quarterly" | "yearly";
  dayOfMonth: number;
  startsAt: string;
  endsAt?: string;
  active: boolean;
  notes?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  occurredAt: string;
  amount: number;
  categoryId?: string;
  categoryName?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  description?: string;
  paymentMethod: string;
  reference?: string;
  vatAmount: number;
  sourceType: TransactionSourceType;
  sourceId?: string;
  sourceLabel?: string;
  recurringRuleId?: string;
  periodKey?: string;
}

export interface TreasurySummary {
  currentBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  recurringMonthlyTotal: number;
  pendingInvoiceTotal: number;
  pendingInvoiceCount: number;
  overdueInvoiceTotal: number;
  overdueInvoiceCount: number;
}

export interface TransactionCreateInput {
  type: Exclude<TransactionType, "transfer">;
  occurredAt: string;
  amount: number;
  categoryId?: string;
  bankAccountId?: string;
  description?: string;
  paymentMethod?: string;
  reference?: string;
  vatAmount?: number;
}

export interface RecurringRuleCreateInput {
  name: string;
  type: "income" | "expense";
  amount: number;
  categoryId?: string;
  vatRate?: number;
  frequency?: "monthly" | "quarterly" | "yearly";
  dayOfMonth?: number;
  notes?: string;
}

export interface InvoicePaymentInput {
  method: PaymentMethod;
  occurredAt: string;
  reference?: string;
}
