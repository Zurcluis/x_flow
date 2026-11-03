export type MaterialType =
  | "ppf_gloss"
  | "ppf_matte"
  | "color_ppf"
  | "cast_vinyl"
  | "ceramic"
  | "tint";

export type MaterialUnit = "meter" | "bottle" | "kit";
export type StockStatus = "available" | "low_stock" | "out_of_stock";

export type MaterialMovementType =
  | "entry"
  | "cut"
  | "waste"
  | "adjustment"
  | "remnant_created"
  | "remnant_used";

export type MaterialRemnantStatus = "available" | "used" | "discarded";

export type PurchaseOrderStatus = "draft" | "sent" | "received" | "cancelled";

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

export interface MaterialRemnant {
  id: string;
  materialId: string;
  materialName: string;
  brand: string;
  batchNumber?: string;
  widthCm: number;
  lengthCm: number;
  areaM2: number;
  location: string;
  status: MaterialRemnantStatus;
  usedWorkOrderId?: string;
  notes?: string;
  createdAt: string;
  usedAt?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  materialId?: string;
  materialName: string;
  quantityRolls: number;
  metersPerRoll: number;
  totalMeters: number;
  estimatedCost?: number;
  status: PurchaseOrderStatus;
  sentVia?: "whatsapp" | "email";
  notes?: string;
  createdAt: string;
  sentAt?: string;
  receivedAt?: string;
}

export function calculateRemnantAreaM2(widthCm: number, lengthCm: number): number {
  if (
    !Number.isFinite(widthCm) ||
    !Number.isFinite(lengthCm) ||
    widthCm <= 0 ||
    lengthCm <= 0
  ) {
    return 0;
  }
  return Math.round(((widthCm * lengthCm) / 10000) * 100) / 100;
}

export function buildSupplierOrderMessage(
  order: Pick<
    PurchaseOrder,
    | "orderNumber"
    | "supplierName"
    | "materialName"
    | "quantityRolls"
    | "metersPerRoll"
    | "notes"
  >
): { whatsappText: string; emailSubject: string; emailBody: string } {
  const rolls = Math.max(1, Number(order.quantityRolls) || 1);
  const metersPerRoll = Math.max(0, Number(order.metersPerRoll) || 0);
  const totalMeters = Math.round(rolls * metersPerRoll * 100) / 100;
  const trimmedNotes = order.notes?.trim();

  const emailSubject = `Encomenda ${order.orderNumber} — ${order.materialName} (${rolls} rolo(s))`;

  const whatsappText = [
    `Olá ${order.supplierName},`,
    `Segue encomenda *${order.orderNumber}* da oficina X-Motion:`,
    `• Material: *${order.materialName}*`,
    `• Quantidade: *${rolls} rolo(s)* (${metersPerRoll} m/rolo · Total: ${totalMeters} m)`,
    trimmedNotes ? `• Notas: ${trimmedNotes}` : null,
    `Por favor confirmem disponibilidade e prazo de entrega. Obrigado!`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const emailBody = [
    `Olá ${order.supplierName},`,
    "",
    `Enviamos os detalhes da nossa encomenda ${order.orderNumber}:`,
    `- Material: ${order.materialName}`,
    `- Quantidade: ${rolls} rolo(s) x ${metersPerRoll} m (${totalMeters} m lineares no total)`,
    trimmedNotes ? `- Notas: ${trimmedNotes}` : null,
    "",
    "Agradecemos confirmação de disponibilidade, lote e data prevista de entrega.",
    "",
    "Melhores cumprimentos,",
    "X-FLOW by X-Motion",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return { whatsappText, emailSubject, emailBody };
}
