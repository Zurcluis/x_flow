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
  invoiceNumber: string; // e.g. "FT 2026/042"
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
