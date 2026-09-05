export type MaterialType =
  | "ppf_gloss"
  | "ppf_matte"
  | "color_ppf"
  | "cast_vinyl"
  | "ceramic"
  | "tint";

export type MaterialUnit = "meter" | "bottle" | "kit";
export type StockStatus = "available" | "low_stock" | "out_of_stock";

export interface MaterialBatch {
  id: string;
  organizationId: string;
  materialId: string;
  batchNumber: string;
  supplierName: string;
  receivedDate: string;
  initialMeters: number;
  remainingMeters: number;
  expiryDate?: string;
}

export interface Material {
  id: string;
  organizationId: string;
  brand: string; // Stek, SunTek, Xpel, 3M, Avery Dennison, Gyeon
  name: string;
  type: MaterialType;
  thicknessMicrons?: number; // e.g. 200µm
  finish: string; // Gloss, Matte, Satin, Metallic
  rollWidthMeters: number; // e.g. 1.52m
  costPerMeter: number; // Custo de compra da oficina (€)
  pricePerMeter: number; // Preço de venda tabelado (€)
  currentStockMeters: number; // Metragem disponível
  minimumStockAlertMeters: number; // Alerta de stock crítico
  unit: MaterialUnit;
  status: StockStatus;
  supplierName?: string;
  batches?: MaterialBatch[];
}
