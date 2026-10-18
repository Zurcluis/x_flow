export class CustomerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerValidationError";
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCustomerEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function parseRequiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CustomerValidationError(`${label} é obrigatório.`);
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw new CustomerValidationError(`${label} excede o limite de ${maxLength} caracteres.`);
  }
  return text;
}

export function parseOptionalText(
  value: unknown,
  label: string,
  maxLength: number
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new CustomerValidationError(`${label} inválido.`);
  }
  const text = value.trim();
  if (text.length === 0) return undefined;
  if (text.length > maxLength) {
    throw new CustomerValidationError(`${label} excede o limite de ${maxLength} caracteres.`);
  }
  return text;
}

export function parseDiscountRate(value: unknown, fallback = 0): number {
  const raw = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
    throw new CustomerValidationError("O desconto tem de estar entre 0 e 100.");
  }
  return Math.round(raw * 100) / 100;
}

export function parsePaymentTermsDays(value: unknown, fallback = 30): number {
  const raw = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isInteger(raw) || raw < 0 || raw > 365) {
    throw new CustomerValidationError("O prazo de pagamento tem de estar entre 0 e 365 dias.");
  }
  return raw;
}

export function parseCustomerPriority(value: unknown): "standard" | "high" | "vip" {
  if (value === undefined || value === null) return "standard";
  if (value === "standard" || value === "high" || value === "vip") return value;
  throw new CustomerValidationError("Prioridade B2B inválida.");
}
