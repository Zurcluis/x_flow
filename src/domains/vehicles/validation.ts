export class VehicleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleValidationError";
  }
}

export function parseGenerationYear(value: unknown, now = new Date()): number {
  const raw = value === undefined || value === null || value === "" ? NaN : Number(value);
  const currentYear = now.getUTCFullYear();
  if (!Number.isInteger(raw) || raw < 1900 || raw > currentYear + 1) {
    throw new VehicleValidationError(
      `O ano tem de ser um número inteiro entre 1900 e ${currentYear + 1}.`
    );
  }
  return raw;
}

export function parseMileage(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const raw = Number(value);
  if (!Number.isInteger(raw) || raw < 0 || raw > 5_000_000) {
    throw new VehicleValidationError("A quilometragem tem de ser um número inteiro válido.");
  }
  return raw;
}

export function parseOptionalVin(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new VehicleValidationError("O VIN é inválido.");
  }
  const vin = value.trim().toUpperCase();
  if (vin.length === 0) return undefined;
  if (vin.length > 50) {
    throw new VehicleValidationError("O VIN excede o limite de 50 caracteres.");
  }
  return vin;
}
