export type ColorContrastLevel = "low" | "medium" | "high";
export type RecommendedCoverage = "exterior" | "extended" | "integral" | "manual_review";
export type ReviewAction = "pending" | "confirmed" | "corrected" | "rejected";

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface VisionDamageSuggestion {
  id: string;
  photoAngle: string;
  bodyPart: string;
  type: string;
  severity: "minor" | "moderate" | "severe";
  description: string;
  boundingBox: BoundingBox;
  confidence: number;
  status: ReviewAction;
}

export interface VisionPanelAssessment {
  panelCode: string;
  panelName: string;
  complexity: "low" | "medium" | "high";
  estimatedMinutes: number;
  disassemblyRecommended: string[];
  risks: string[];
  confidence: number;
  status: ReviewAction;
}

export interface VisionAnalysis {
  id: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  originalColorName: string;
  originalColorFamily: string;
  targetColorName: string;
  targetColorFamily: string;
  serviceType: "PPF" | "Wrap" | "Color PPF";
  contrastLevel: ColorContrastLevel;
  recommendedCoverage: RecommendedCoverage;
  photoCompleteness: boolean;
  vehicleConfidence: number;
  colorConfidence: number;
  damageSuggestions: VisionDamageSuggestion[];
  panels: VisionPanelAssessment[];
  recommendedSequence: string[];
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface FinishPreset {
  id: string;
  name: string;
  brand: string;
  type: "clear_ppf_gloss" | "clear_ppf_matte" | "color_ppf" | "vinyl_wrap" | "chrome_delete";
  colorHex: string;
  textureEffect: "gloss" | "satin" | "matte" | "carbon";
  costPerMeterCents: number;
  warrantyYears: number;
  /** Brilho mediano a 60° em GU (0-100) — datasheet da película */
  glossGu?: number;
  /** Intensidade de flocado metálico (0-1) */
  metallic?: number;
  /** Granulação do flocado (0-3) */
  flakeScale?: number;
  sku?: string;
}
