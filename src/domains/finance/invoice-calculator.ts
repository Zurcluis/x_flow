/**
 * Motor de cálculo determinístico de faturação com IVA português (23%)
 */
export function calculateInvoiceTotals(
  lines: { quantity: number; unitPrice: number; vatRate?: number }[],
  defaultVatRate: number = 23
): {
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  vatRate: number;
} {
  if (!lines || lines.length === 0) {
    return {
      subtotal: 0,
      vatAmount: 0,
      totalAmount: 0,
      vatRate: defaultVatRate,
    };
  }

  let subtotal = 0;
  let totalVat = 0;

  for (const line of lines) {
    const lineSubtotal = line.quantity * line.unitPrice;
    const lineVatRate = line.vatRate !== undefined ? line.vatRate : defaultVatRate;
    const lineVat = lineSubtotal * (lineVatRate / 100);

    subtotal += lineSubtotal;
    totalVat += lineVat;
  }

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const roundedVat = Math.round(totalVat * 100) / 100;
  const roundedTotal = Math.round((roundedSubtotal + roundedVat) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    vatAmount: roundedVat,
    totalAmount: roundedTotal,
    vatRate: defaultVatRate,
  };
}

export function formatInvoiceNumber(seq: number, year: number = 2026): string {
  // Formato real weoInvoice (histórico X-Motion): FT2025/2, FT2026/30 — sem espaços nem zeros à esquerda.
  return `FT${year}/${seq}`;
}
