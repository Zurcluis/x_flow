import { describe, it, expect } from "vitest";
import {
  validateQCInspection,
  generateQCCertificateNumber,
} from "@/domains/production/qc-validator";
import { QCItem } from "@/domains/production/types";

describe("Quality Control (QC) Validator", () => {
  const sampleItems: QCItem[] = [
    {
      id: "1",
      criterionName: "Sem bolhas",
      category: "finish",
      status: "pass",
    },
    {
      id: "2",
      criterionName: "Bordos selados",
      category: "edges",
      status: "pass",
    },
    {
      id: "3",
      criterionName: "Folgas alinhadas",
      category: "alignment",
      status: "pass",
    },
  ];

  it("should approve inspection when all items pass", () => {
    const result = validateQCInspection(sampleItems);
    expect(result.canApprove).toBe(true);
    expect(result.failedItems.length).toBe(0);
    expect(result.passedCount).toBe(3);
  });

  it("should strictly reject approval when any item fails", () => {
    const itemsWithFailure: QCItem[] = [
      ...sampleItems,
      {
        id: "4",
        criterionName: "Sem marcas de corte",
        category: "finish",
        status: "fail",
        reworkNotes: "Risco detectado na borracha",
      },
    ];

    const result = validateQCInspection(itemsWithFailure);
    expect(result.canApprove).toBe(false);
    expect(result.failedItems.length).toBe(1);
    expect(result.failedItems[0].id).toBe("4");
    expect(result.message).toContain("Existem 1 defeito(s)");
  });

  it("should correctly format QC certificate number", () => {
    expect(generateQCCertificateNumber("44-TX-88")).toBe("QC-2026-44TX88-PASS");
    expect(generateQCCertificateNumber("AA-00-BB")).toBe("QC-2026-AA00BB-PASS");
  });
});
