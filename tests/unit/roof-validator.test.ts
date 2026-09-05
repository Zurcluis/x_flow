import { describe, it, expect } from "vitest";
import {
  validateCheckinPhotos,
  validateCheckinSubmission,
} from "@/domains/checkins/roof-validator";
import { CheckinPhoto } from "@/domains/checkins/types";

describe("Check-in Photo Inspection Validator (5 Standard Perspectives)", () => {
  it("rejects check-in when no photos are provided", () => {
    const result = validateCheckinPhotos([]);
    expect(result.isValid).toBe(false);
    expect(result.missingAngles.length).toBe(5);
    expect(result.message).toContain("Não foram adicionadas fotografias");
  });

  it("identifies missing angles when only partial photos are uploaded", () => {
    const photos: CheckinPhoto[] = [
      {
        id: "p1",
        photoUrl: "https://example.com/front.jpg",
        angle: "front",
        label: "Frente",
        isMandatory: true,
        createdAt: "2026-08-28 10:00",
      },
      {
        id: "p2",
        photoUrl: "https://example.com/rear.jpg",
        angle: "rear",
        label: "Traseira",
        isMandatory: true,
        createdAt: "2026-08-28 10:01",
      },
    ];

    const result = validateCheckinPhotos(photos);
    expect(result.isValid).toBe(false);
    expect(result.missingAngles).toContain("Lateral Esquerdo");
    expect(result.missingAngles).toContain("Lateral Direito");
    expect(result.missingAngles).toContain("Tejadilho");
  });

  it("accepts check-in when all 5 standard perspectives are present", () => {
    const photos: CheckinPhoto[] = [
      {
        id: "p1",
        photoUrl: "https://example.com/front.jpg",
        angle: "front",
        label: "Frente",
        isMandatory: true,
        createdAt: "2026-08-28 10:00",
      },
      {
        id: "p2",
        photoUrl: "https://example.com/left.jpg",
        angle: "left_side",
        label: "Lateral Esquerdo",
        isMandatory: true,
        createdAt: "2026-08-28 10:01",
      },
      {
        id: "p3",
        photoUrl: "https://example.com/right.jpg",
        angle: "right_side",
        label: "Lateral Direito",
        isMandatory: true,
        createdAt: "2026-08-28 10:02",
      },
      {
        id: "p4",
        photoUrl: "https://example.com/rear.jpg",
        angle: "rear",
        label: "Traseira",
        isMandatory: true,
        createdAt: "2026-08-28 10:03",
      },
      {
        id: "p5",
        photoUrl: "https://example.com/roof.jpg",
        angle: "roof",
        label: "Tejadilho",
        isMandatory: true,
        createdAt: "2026-08-28 10:04",
      },
    ];

    const result = validateCheckinPhotos(photos);
    expect(result.isValid).toBe(true);
    expect(result.missingAngles).toHaveLength(0);
  });

  it("validates full checkin submission requirements", () => {
    const invalidSubmission = validateCheckinSubmission({
      mileage: 0,
      photos: [],
      signedByName: "Test",
    });

    expect(invalidSubmission.isValid).toBe(false);
    expect(invalidSubmission.errors.length).toBeGreaterThanOrEqual(2);

    const validSubmission = validateCheckinSubmission({
      mileage: 28400,
      photos: [
        {
          id: "p1",
          photoUrl: "https://example.com/front.jpg",
          angle: "front",
          label: "Frente",
          isMandatory: true,
          createdAt: "2026-08-28 10:00",
        },
        {
          id: "p2",
          photoUrl: "https://example.com/left.jpg",
          angle: "left_side",
          label: "Lateral Esquerdo",
          isMandatory: true,
          createdAt: "2026-08-28 10:01",
        },
        {
          id: "p3",
          photoUrl: "https://example.com/right.jpg",
          angle: "right_side",
          label: "Lateral Direito",
          isMandatory: true,
          createdAt: "2026-08-28 10:02",
        },
        {
          id: "p4",
          photoUrl: "https://example.com/rear.jpg",
          angle: "rear",
          label: "Traseira",
          isMandatory: true,
          createdAt: "2026-08-28 10:03",
        },
        {
          id: "p5",
          photoUrl: "https://example.com/roof.jpg",
          angle: "roof",
          label: "Tejadilho",
          isMandatory: true,
          createdAt: "2026-08-28 10:04",
        },
      ],
      signedByName: "Bernardo Silva",
    });

    expect(validSubmission.isValid).toBe(true);
    expect(validSubmission.errors).toHaveLength(0);
  });
});
