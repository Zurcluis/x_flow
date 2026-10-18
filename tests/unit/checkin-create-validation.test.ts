import { describe, it, expect } from "vitest";
import {
  CheckinValidationError,
  validateCreateCheckinInput,
} from "@/server/checkins";
import type { CreateCheckinInput } from "@/server/checkins";

const VEHICLE_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

function validInput(): CreateCheckinInput {
  return {
    vehicleId: VEHICLE_ID,
    customerId: CUSTOMER_ID,
    mileage: 42_000,
    fuelLevel: "half",
    cleanlinessStatus: "clean",
    belongings: [
      { id: "b1", itemName: "Chave", isPresent: true },
    ],
    photos: [
      { id: "p-front", photoUrl: PHOTO, angle: "front", label: "Frente" },
      { id: "p-left", photoUrl: PHOTO, angle: "left_side", label: "Lateral Esquerdo" },
      { id: "p-right", photoUrl: PHOTO, angle: "right_side", label: "Lateral Direito" },
      { id: "p-rear", photoUrl: PHOTO, angle: "rear", label: "Traseira" },
      { id: "p-roof", photoUrl: PHOTO, angle: "roof", label: "Tejadilho" },
    ],
    damages: [
      {
        photoId: "p-front",
        posX: 20,
        posY: 30,
        type: "stone_chip",
        severity: "minor",
        notes: "Picada superficial",
      },
    ],
    signedByName: "Miguel Cruz",
  };
}

function expectValidationError(input: CreateCheckinInput, message: RegExp) {
  expect(() => validateCreateCheckinInput(input)).toThrow(CheckinValidationError);
  expect(() => validateCreateCheckinInput(input)).toThrow(message);
}

describe("Check-in input validation", () => {
  it("accepts a complete check-in payload", () => {
    expect(() => validateCreateCheckinInput(validInput())).not.toThrow();
  });

  it("rejects a payload without every mandatory inspection angle", () => {
    const input = validInput();
    input.photos = input.photos.filter((photo) => photo.angle !== "roof");
    expectValidationError(input, /Tejadilho/);
  });

  it("rejects damage records linked to unknown photos", () => {
    const input = validInput();
    input.damages[0].photoId = "missing-photo";
    expectValidationError(input, /fotografia inexistente/i);
  });

  it("rejects damage coordinates outside the photo", () => {
    const input = validInput();
    input.damages[0].posX = 120;
    expectValidationError(input, /Posição do dano inválida/);
  });

  it("rejects non-image photo payloads", () => {
    const input = validInput();
    input.photos[0].photoUrl = "https://example.com/front.jpg";
    expectValidationError(input, /Fotografia inválida/);
  });

  it("rejects payloads whose bytes do not match the declared image type", () => {
    const input = validInput();
    input.photos[0].photoUrl = `data:image/png;base64,${"A".repeat(300)}`;
    expectValidationError(input, /corresponde a uma imagem/);
  });

  it("requires the signer name", () => {
    const input = validInput();
    input.signedByName = "   ";
    expectValidationError(input, /signatário/i);
  });

  it("rejects a non-positive odometer value", () => {
    const input = validInput();
    input.mileage = 0;
    expectValidationError(input, /Quilometragem inválida/);
  });

  it("limits baggage entries to valid objects", () => {
    const input = validInput();
    input.belongings = [
      { id: "b1", itemName: "", isPresent: true },
    ];
    expectValidationError(input, /Nome do pertence inválido/);
  });
});
