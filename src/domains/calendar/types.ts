export interface WorkshopBay {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  serviceType: "ppf" | "wrap" | "detailing" | "tint" | "general";
  defaultTechnicianName: string;
  status: "available" | "occupied" | "maintenance";
}

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  organizationId: string;
  quoteId?: string;
  quoteNumber?: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  customerId: string;
  customerName: string;
  bayId: string;
  bayName: string;
  technicianName: string;
  serviceTitle: string;
  startTime: string; // ISO or '09:00'
  endTime: string; // ISO or '17:30'
  date: string; // '2026-08-28'
  startIso?: string; // ISO completo (calendário)
  endIso?: string; // ISO completo (calendário)
  estimatedHours: number;
  status: AppointmentStatus;
  notes?: string;
}
