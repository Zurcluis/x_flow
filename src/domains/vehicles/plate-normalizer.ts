/**
 * Normalizador de Matrículas para o X-Flow
 * Suporta formatos portugueses (00-AA-00, AA-00-AA, 00-00-AA, AA-00-00) e europeus.
 */

export function normalizePlate(plate: string): string {
  if (!plate) return "";
  return plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function formatPlateForDisplay(plate: string): string {
  const normalized = normalizePlate(plate);

  if (normalized.length === 6) {
    // Check standard 2-2-2 Portuguese formats
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 4)}-${normalized.slice(4, 6)}`;
  }

  return plate.toUpperCase().trim();
}

export function isValidPlate(plate: string): boolean {
  const normalized = normalizePlate(plate);
  // Validates standard 6-character plates or custom formats between 4 and 10 alphanumeric chars
  return normalized.length >= 4 && normalized.length <= 10;
}
