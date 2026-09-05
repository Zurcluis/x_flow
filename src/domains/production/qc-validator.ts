import { QCItem } from "./types";

/**
 * Validador estrito de Controlo de Qualidade (QC)
 * A viatura NUNCA pode ser aprovada para entrega se tiver algum item marcado como 'fail'.
 */
export function validateQCInspection(items: QCItem[]): {
  canApprove: boolean;
  failedItems: QCItem[];
  passedCount: number;
  totalCount: number;
  message?: string;
} {
  if (!items || items.length === 0) {
    return {
      canApprove: false,
      failedItems: [],
      passedCount: 0,
      totalCount: 0,
      message: "Nenhum critério de controlo de qualidade foi inspecionado.",
    };
  }

  const failedItems = items.filter((item) => item.status === "fail");
  const passedCount = items.filter((item) => item.status === "pass").length;

  if (failedItems.length > 0) {
    return {
      canApprove: false,
      failedItems,
      passedCount,
      totalCount: items.length,
      message: `Existem ${failedItems.length} defeito(s) de qualidade que exigem retrabalho antes da aprovação final.`,
    };
  }

  return {
    canApprove: true,
    failedItems: [],
    passedCount,
    totalCount: items.length,
  };
}

export function generateQCCertificateNumber(vehiclePlate: string): string {
  const cleanPlate = vehiclePlate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return `QC-2026-${cleanPlate}-PASS`;
}
