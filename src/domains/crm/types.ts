export type CustomerType = "individual" | "business";
export type CustomerStatus = "active" | "lead" | "archived";
export type PreferredChannel = "whatsapp" | "phone" | "email";

export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  canApproveQuotes: boolean;
}

export interface B2BAccountDetails {
  id: string;
  customerId: string;
  discountRate: number; // e.g. 10 (%)
  paymentTermsDays: number; // e.g. 30 (dias)
  priorityLevel: "standard" | "high" | "vip";
  commercialNotes?: string;
}

export interface CustomerCommunication {
  id: string;
  customerId: string;
  type: "call" | "whatsapp" | "email" | "meeting" | "note";
  direction: "inbound" | "outbound";
  summary: string;
  authorName: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  type: CustomerType;
  name: string;
  legalName?: string;
  nif?: string;
  email: string;
  phone: string;
  phoneNormalized: string;
  preferredChannel: PreferredChannel;
  notes?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  // Associated summary metrics
  vehicleCount?: number;
  totalSpent?: number;
  lastInteractionDate?: string;
  b2bDetails?: B2BAccountDetails;
  contacts?: CustomerContact[];
  communications?: CustomerCommunication[];
}
