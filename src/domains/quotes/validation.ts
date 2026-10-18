import type {
  AdjustKind,
  CostLineType,
  CostLineUnit,
  ServiceLineMode,
} from "@/domains/pricing/types";
import type {
  CreateQuoteCostLine,
  CreateQuoteInput,
  CreateQuoteServiceLine,
  QuoteOptionInput,
  QuoteOptionItemInput,
} from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,120}$/;

export function isPublicToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export const MAX_QUOTE_OPTIONS = 5;
export const MAX_SERVICE_LINES = 20;
export const MAX_COST_LINES = 50;
export const MAX_OPTION_ITEMS = 100;
export const MAX_NAME_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_NOTES_LENGTH = 2000;
export const MAX_HOURS = 1000;
export const MAX_QUANTITY = 100000;
export const MAX_UNIT_COST = 1_000_000;
export const MAX_MANUAL_PRICE = 10_000_000;

const TIERS = new Set(["essential", "recommended", "premium"]);
const MODES = new Set<ServiceLineMode>(["complete", "spot"]);
const COST_LINE_TYPES = new Set<CostLineType>([
  "material",
  "consumable_kit",
  "sublet",
  "extra",
]);
const COST_LINE_UNITS = new Set<CostLineUnit>([
  "linear_meter",
  "m2",
  "unit",
  "package",
]);
const ADJUST_KINDS = new Set<AdjustKind>([
  "none",
  "manual_price",
  "percent_discount",
  "euro_adjust",
]);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasLength(value: string, max: number): boolean {
  return value.length <= max;
}

function validateServiceLine(
  line: CreateQuoteServiceLine,
  index: number
): string[] {
  const errors: string[] = [];
  const label = `linha de serviço ${index + 1}`;

  if (!line.name || line.name.trim() === "") {
    errors.push(`Indica o nome da ${label}.`);
  } else if (!hasLength(line.name.trim(), MAX_NAME_LENGTH)) {
    errors.push(`O nome da ${label} é demasiado longo.`);
  }
  if (line.description && !hasLength(line.description, MAX_DESCRIPTION_LENGTH)) {
    errors.push(`A descrição da ${label} é demasiado longa.`);
  }
  if (line.notes && !hasLength(line.notes, MAX_NOTES_LENGTH)) {
    errors.push(`As notas da ${label} são demasiado longas.`);
  }
  if (!MODES.has(line.mode)) {
    errors.push(`O modo da ${label} é inválido.`);
  }
  if (!isFiniteNumber(line.hours) || line.hours <= 0 || line.hours > MAX_HOURS) {
    errors.push(`As horas da ${label} têm de estar entre 0 e ${MAX_HOURS}.`);
  }

  return errors;
}

function validateCostLine(line: CreateQuoteCostLine, index: number): string[] {
  const errors: string[] = [];
  const label = `linha de custo ${index + 1}`;

  if (!COST_LINE_TYPES.has(line.lineType)) {
    errors.push(`O tipo da ${label} é inválido.`);
  }
  if (!line.name || line.name.trim() === "") {
    errors.push(`Indica o nome da ${label}.`);
  } else if (!hasLength(line.name.trim(), MAX_NAME_LENGTH)) {
    errors.push(`O nome da ${label} é demasiado longo.`);
  }
  if (!COST_LINE_UNITS.has(line.unit)) {
    errors.push(`A unidade da ${label} é inválida.`);
  }
  if (
    !isFiniteNumber(line.quantity) ||
    line.quantity <= 0 ||
    line.quantity > MAX_QUANTITY
  ) {
    errors.push(`A quantidade da ${label} tem de estar entre 0 e ${MAX_QUANTITY}.`);
  }
  if (
    !isFiniteNumber(line.unitCost) ||
    line.unitCost < 0 ||
    line.unitCost > MAX_UNIT_COST
  ) {
    errors.push(`O custo unitário da ${label} é inválido.`);
  }
  if (
    !isFiniteNumber(line.wasteRatePercent) ||
    line.wasteRatePercent < 0 ||
    line.wasteRatePercent > 100
  ) {
    errors.push(`A taxa de desperdício da ${label} tem de estar entre 0 e 100.`);
  }
  if (
    line.deductedHours !== null &&
    line.deductedHours !== undefined &&
    (!isFiniteNumber(line.deductedHours) ||
      line.deductedHours < 0 ||
      line.deductedHours > MAX_HOURS)
  ) {
    errors.push(`As horas deduzidas da ${label} são inválidas.`);
  }
  if (line.notes && !hasLength(line.notes, MAX_NOTES_LENGTH)) {
    errors.push(`As notas da ${label} são demasiado longas.`);
  }

  return errors;
}

function validateOptionItem(
  item: QuoteOptionItemInput,
  index: number
): string[] {
  const errors: string[] = [];
  const label = `item ${index + 1}`;

  if (!item.serviceName?.trim()) {
    errors.push(`Indica o serviço do ${label}.`);
  }
  if (!item.bodyPartCode?.trim() || !item.bodyPartName?.trim()) {
    errors.push(`Indica a peça do ${label}.`);
  }
  if (!isFiniteNumber(item.areaM2) || item.areaM2 < 0 || item.areaM2 > 10000) {
    errors.push(`A área do ${label} é inválida.`);
  }
  if (
    !isFiniteNumber(item.laborHours) ||
    item.laborHours < 0 ||
    item.laborHours > MAX_HOURS
  ) {
    errors.push(`As horas do ${label} são inválidas.`);
  }
  if (
    !isFiniteNumber(item.unitPrice) ||
    item.unitPrice < 0 ||
    item.unitPrice > MAX_MANUAL_PRICE
  ) {
    errors.push(`O preço unitário do ${label} é inválido.`);
  }
  if (
    !isFiniteNumber(item.totalPrice) ||
    item.totalPrice < 0 ||
    item.totalPrice > MAX_MANUAL_PRICE
  ) {
    errors.push(`O total do ${label} é inválido.`);
  }

  return errors;
}

function validateOption(option: QuoteOptionInput, index: number): string[] {
  const errors: string[] = [];
  const label = `opção ${index + 1}`;

  if (!option.name || option.name.trim() === "") {
    errors.push(`Indica o nome da ${label}.`);
  } else if (!hasLength(option.name.trim(), MAX_NAME_LENGTH)) {
    errors.push(`O nome da ${label} é demasiado longo.`);
  }
  if (!TIERS.has(option.tier)) {
    errors.push(`O nível da ${label} é inválido.`);
  }
  if (
    option.description &&
    !hasLength(option.description, MAX_DESCRIPTION_LENGTH)
  ) {
    errors.push(`A descrição da ${label} é demasiado longa.`);
  }
  if (
    option.warrantyYears !== undefined &&
    (!Number.isInteger(option.warrantyYears) ||
      option.warrantyYears < 0 ||
      option.warrantyYears > 50)
  ) {
    errors.push(`A garantia da ${label} tem de estar entre 0 e 50 anos.`);
  }
  if (
    option.discountRate !== undefined &&
    (!isFiniteNumber(option.discountRate) ||
      option.discountRate < 0 ||
      option.discountRate > 100)
  ) {
    errors.push(`O desconto da ${label} tem de estar entre 0% e 100%.`);
  }
  if (option.kind !== "flexible" && option.kind !== "configurator") {
    errors.push(`O formato da ${label} é inválido.`);
    return errors;
  }

  if (option.kind === "flexible") {
    const serviceLines = option.serviceLines ?? [];
    const costLines = option.costLines ?? [];

    if (serviceLines.length === 0) {
      errors.push(`A ${label} precisa de pelo menos uma linha de serviço.`);
    } else if (serviceLines.length > MAX_SERVICE_LINES) {
      errors.push(
        `A ${label} não pode ter mais de ${MAX_SERVICE_LINES} linhas de serviço.`
      );
    } else {
      serviceLines.forEach((line, lineIndex) => {
        errors.push(...validateServiceLine(line, lineIndex));
      });
    }

    if (costLines.length > MAX_COST_LINES) {
      errors.push(`A ${label} não pode ter mais de ${MAX_COST_LINES} linhas de custo.`);
    } else {
      costLines.forEach((line, lineIndex) => {
        errors.push(...validateCostLine(line, lineIndex));
      });
    }

    if (
      option.manualPriceBeforeVat !== null &&
      option.manualPriceBeforeVat !== undefined &&
      (!isFiniteNumber(option.manualPriceBeforeVat) ||
        option.manualPriceBeforeVat <= 0 ||
        option.manualPriceBeforeVat > MAX_MANUAL_PRICE)
    ) {
      errors.push(`O preço final da ${label} é inválido.`);
    }
  } else {
    const items = option.items ?? [];
    if (items.length === 0) {
      errors.push(`A ${label} precisa de pelo menos um item.`);
    } else if (items.length > MAX_OPTION_ITEMS) {
      errors.push(`A ${label} não pode ter mais de ${MAX_OPTION_ITEMS} itens.`);
    } else {
      items.forEach((item, itemIndex) => {
        errors.push(...validateOptionItem(item, itemIndex));
      });
    }
  }

  if (option.adjustKind && !ADJUST_KINDS.has(option.adjustKind)) {
    errors.push(`O ajuste da ${label} é inválido.`);
  }
  if (option.adjustKind === "percent_discount") {
    if (
      !isFiniteNumber(option.adjustValue) ||
      option.adjustValue <= -100 ||
      option.adjustValue > 100
    ) {
      errors.push(`O desconto da ${label} tem de estar entre -100% e 100%.`);
    }
  }
  if (option.adjustKind === "euro_adjust") {
    if (
      !isFiniteNumber(option.adjustValue) ||
      Math.abs(option.adjustValue) > MAX_MANUAL_PRICE
    ) {
      errors.push(`O ajuste em euros da ${label} é inválido.`);
    }
  }
  if (option.adjustReason && !hasLength(option.adjustReason, MAX_NOTES_LENGTH)) {
    errors.push(`O motivo do ajuste da ${label} é demasiado longo.`);
  }

  return errors;
}

export function validateCreateQuoteInput(input: CreateQuoteInput): string[] {
  const errors: string[] = [];

  if (!isUuid(input.vehicleId)) {
    errors.push("Seleciona uma viatura válida.");
  }
  if (!isUuid(input.customerId)) {
    errors.push("Seleciona um cliente válido.");
  }
  if (input.intent !== "draft" && input.intent !== "send") {
    errors.push("A intenção do orçamento é inválida.");
  }
  if (input.notes && !hasLength(input.notes, MAX_NOTES_LENGTH)) {
    errors.push(`As notas do orçamento não podem exceder ${MAX_NOTES_LENGTH} caracteres.`);
  }
  if (!Array.isArray(input.options) || input.options.length === 0) {
    errors.push("O orçamento precisa de pelo menos uma opção.");
  } else if (input.options.length > MAX_QUOTE_OPTIONS) {
    errors.push(`O orçamento não pode ter mais de ${MAX_QUOTE_OPTIONS} opções.`);
  } else {
    input.options.forEach((option, index) => {
      errors.push(...validateOption(option, index));
    });
  }

  return errors;
}

export function validateApproverName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (name.length === 0 || name.length > 150) return null;
  return name;
}
