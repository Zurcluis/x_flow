export type BodyType =
  | "sedan"
  | "coupe"
  | "suv"
  | "wagon"
  | "hatchback"
  | "cabrio"
  | "motorcycle"
  | "van";

export type ColorFamily =
  | "white"
  | "black"
  | "grey"
  | "silver"
  | "blue"
  | "red"
  | "green"
  | "yellow"
  | "orange"
  | "other";

export type FuelType = "gasoline" | "diesel" | "electric" | "hybrid";

export interface VehicleCustomerLink {
  id: string;
  vehicleId: string;
  customerId: string;
  customerName: string;
  relationshipType: "owner" | "driver" | "fleet_manager";
  startedAt: string;
  endedAt?: string;
  isCurrent: boolean;
}

export interface VehicleTimelineEvent {
  id: string;
  vehicleId: string;
  type:
    | "checkin"
    | "quote"
    | "work_order"
    | "service_completed"
    | "qc_passed"
    | "warranty_issued"
    | "owner_changed"
    | "note_added";
  title: string;
  description: string;
  date: string;
  authorName?: string;
  badgeText?: string;
  linkHref?: string;
}

export interface VehicleNote {
  id: string;
  vehicleId: string;
  authorName: string;
  category: "technical" | "bodywork" | "general";
  content: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  organizationId: string;
  plateDisplay: string;
  plateNormalized: string;
  vin?: string;
  make: string;
  model: string;
  generationYear: number;
  bodyType: BodyType;
  originalColorName: string;
  originalColorFamily: ColorFamily;
  originalColorCode?: string;
  currentMileage?: number;
  fuelType?: FuelType;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Current owner link info
  currentOwner?: {
    customerId: string;
    customerName: string;
    customerType: "individual" | "business";
    since: string;
  };
  // Technical passport elements
  ownerHistory?: VehicleCustomerLink[];
  timeline?: VehicleTimelineEvent[];
  technicalNotes?: VehicleNote[];
}
