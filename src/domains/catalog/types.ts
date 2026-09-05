import { BodyType } from "../vehicles/types";

export interface ServiceCategory {
  id: string;
  name: string;
  slug: "ppf" | "wrap" | "detailing" | "tint" | "protection";
  description: string;
  iconName: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  description: string;
  defaultWarrantyMonths: number;
  isActive: boolean;
}

export type BodyPartCategory = "front" | "side" | "roof" | "rear" | "interior" | "full";

export interface VehicleBodyPart {
  code: string;
  namePt: string;
  category: BodyPartCategory;
  defaultAreaM2: number;
  baseLaborHours: number;
  basePrice: number; // Preço base de tabela em EUR
}

export const VEHICLE_SEGMENT_MULTIPLIERS: Record<BodyType, number> = {
  coupe: 1.0,
  sedan: 1.1,
  hatchback: 0.95,
  wagon: 1.15,
  suv: 1.25,
  cabrio: 1.05,
  motorcycle: 0.6,
  van: 1.4,
};

export const FINISH_MULTIPLIERS: Record<string, number> = {
  gloss: 1.0,
  matte: 1.15,
  satin: 1.15,
  color_ppf: 1.3,
  carbon: 1.35,
};
