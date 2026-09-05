/**
 * Utilitários de formatação para o X-Flow by X-Motion
 * Idioma: pt-PT
 * Moeda: EUR (€)
 * Timezone: Europe/Lisbon
 */

export function formatCurrency(amountInEuros: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(amountInEuros)
    .replace("€", "€ ");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-PT").format(value);
}

export function formatPercentage(value: number, includeSign = false): string {
  const formatted = `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
  if (includeSign && value > 0) {
    return `+${formatted}`;
  }
  return formatted;
}
