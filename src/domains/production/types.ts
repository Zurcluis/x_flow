export type PhaseKey =
  | "prep_decontamination"
  | "disassembly"
  | "film_cutting"
  | "application"
  | "assembly"
  | "thermal_cure"
  | "detailing_finish"
  | "quality_control";

export type PhaseStatus = "pending" | "in_progress" | "completed";

export interface WorkOrderChecklistItem {
  id: string;
  phaseKey: PhaseKey;
  label: string;
  isCompleted: boolean;
  completedByName?: string;
  completedAt?: string;
}

export interface WorkOrderPhase {
  id: string;
  workOrderId: string;
  phaseKey: PhaseKey;
  name: string;
  status: PhaseStatus;
  orderIndex: number;
  startedAt?: string;
  completedAt?: string;
  estimatedHours: number;
  actualHours: number;
  checklist: WorkOrderChecklistItem[];
}

export interface WorkOrderTimeEntry {
  id: string;
  workOrderId: string;
  phaseKey: PhaseKey;
  technicianName: string;
  hoursSpent: number;
  notes?: string;
  createdAt: string;
}

export interface MaterialUsage {
  id: string;
  workOrderId: string;
  materialId: string;
  materialName: string;
  batchNumber: string;
  estimatedMeters: number;
  actualMeters: number;
  scrapPercentage: number;
  rollWidthMeters: number;
  costPerMeter: number;
}

export type QCCategory = "finish" | "edges" | "alignment" | "cleanliness" | "safety";
export type QCItemStatus = "pass" | "fail" | "na";

export interface QCItem {
  id: string;
  criterionName: string;
  category: QCCategory;
  status: QCItemStatus;
  reworkNotes?: string;
  resolvedAt?: string;
  photoUrl?: string;
}

export interface QCInspection {
  id: string;
  workOrderId: string;
  vehiclePlate: string;
  vehicleModel: string;
  customerName: string;
  inspectorName: string;
  status: "passed" | "failed" | "in_rework";
  items: QCItem[];
  overallNotes?: string;
  certificateNumber?: string;
  approvedAt?: string;
  signatureDataUrl?: string;
  createdAt: string;
}
