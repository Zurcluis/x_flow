export type PhotoAngle =
  | "front"
  | "left_side"
  | "right_side"
  | "rear"
  | "roof"
  | "odometer"
  | "damage_detail";

export type DamageType =
  | "stone_chip"
  | "scratch"
  | "dent"
  | "repainted"
  | "swirls"
  | "wear";

export type DamageSeverity = "minor" | "moderate" | "severe";
export type FuelLevel = "empty" | "quarter" | "half" | "three_quarters" | "full";

export interface CheckinPhoto {
  id: string;
  photoUrl: string;
  angle: PhotoAngle;
  label: string;
  isMandatory: boolean;
  createdAt: string;
}

export interface CheckinDamage {
  id: string;
  posX: number; // 0 to 100 percentage on 2D silhouette
  posY: number; // 0 to 100 percentage on 2D silhouette
  bodyPart: string;
  type: DamageType;
  severity: DamageSeverity;
  notes: string;
  photoUrl?: string;
}

export interface CheckinBelonging {
  id: string;
  itemName: string;
  isPresent: boolean;
  notes?: string;
}

export interface Checkin {
  id: string;
  organizationId: string;
  appointmentId?: string;
  quoteId?: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: "entry" | "exit";
  mileage: number;
  fuelLevel: FuelLevel;
  hasRoofPhoto: boolean; // MANDATÓRIO: Regra inegociável
  cleanlinessStatus: "clean" | "dusty" | "dirty" | "needs_decontamination";
  damages: CheckinDamage[];
  photos: CheckinPhoto[];
  belongings: CheckinBelonging[];
  status: "draft" | "completed" | "signed";
  technicianName: string;
  signedByName?: string;
  signatureDataUrl?: string;
  token: string; // Token público seguro para envio de relatório por WhatsApp
  createdAt: string;
  completedAt?: string;
}

export interface WorkOrder {
  id: string;
  organizationId: string;
  workOrderNumber: string; // ex: OT-2026-042
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  customerId: string;
  customerName: string;
  checkinId: string;
  status: "draft" | "in_progress" | "waiting_parts" | "quality_control" | "completed";
  serviceTitle: string;
  primaryTechnicianName: string;
  progressPercentage: number;
  estimatedHours: number;
  actualHoursSpent: number;
  startedAt: string;
  completedAt?: string;
}
