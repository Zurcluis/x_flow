export type BenchmarkConfidence = "initial" | "learning" | "reliable";

export interface PanelTimeBenchmark {
  panelCode: string;
  panelName: string;
  serviceType: "PPF" | "Wrap";
  medianMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  sampleCount: number;
  confidence: BenchmarkConfidence;
}

export interface VehicleTimeBookModel {
  id: string;
  make: string;
  model: string;
  generationYear: number;
  bodyType: string;
  serviceType: "PPF" | "Wrap";
  totalEstimatedHours: number;
  totalMedianHours: number;
  totalSamples: number;
  overallConfidence: BenchmarkConfidence;
  panels: PanelTimeBenchmark[];
  notes?: string;
}

export interface B2BVehicleEntry {
  id: string;
  plate: string;
  make: string;
  model: string;
  service: string;
  status: "scheduled" | "in_production" | "qc" | "ready" | "delivered";
  deliveryDueDate: string;
  assignedTechnician: string;
  amountCents: number;
}

export interface B2BAccount {
  id: string;
  companyName: string;
  tradeName: string;
  nif: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  discountRate: number; // e.g. 15%
  paymentTermsDays: number; // 30 days
  currentBalanceCents: number;
  totalBilledCents: number;
  fleetVehicles: B2BVehicleEntry[];
}
