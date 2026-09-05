import { CheckinPhoto, PhotoAngle } from "./types";

export const MANDATORY_PHOTO_ANGLES: { angle: PhotoAngle; label: string }[] = [
  { angle: "front", label: "Frente" },
  { angle: "left_side", label: "Lateral Esquerdo" },
  { angle: "right_side", label: "Lateral Direito" },
  { angle: "rear", label: "Traseira" },
  { angle: "roof", label: "Tejadilho" },
];

/**
 * Validador das 5 Fotografias de Inspeção de Check-in
 * Exige as 5 perspetivas da viatura: Frente, Lateral Esquerdo, Lateral Direito, Traseira e Tejadilho.
 */
export function validateCheckinPhotos(photos: CheckinPhoto[]): {
  isValid: boolean;
  missingAngles: string[];
  message?: string;
} {
  if (!photos || photos.length === 0) {
    return {
      isValid: false,
      missingAngles: MANDATORY_PHOTO_ANGLES.map((m) => m.label),
      message: "Não foram adicionadas fotografias de inspeção.",
    };
  }

  const missing = MANDATORY_PHOTO_ANGLES.filter(
    (m) => !photos.some((p) => p.photoUrl && p.angle === m.angle)
  );

  if (missing.length > 0) {
    const missingNames = missing.map((m) => m.label).join(", ");
    return {
      isValid: false,
      missingAngles: missing.map((m) => m.label),
      message: `Faltam as seguintes fotografias obrigatórias: ${missingNames}.`,
    };
  }

  return {
    isValid: true,
    missingAngles: [],
  };
}

/**
 * Compatibilidade com funções existentes
 */
export function validateRoofPhotoInspection(photos: CheckinPhoto[]): {
  isValid: boolean;
  message?: string;
} {
  const hasRoof = photos?.some((p) => p.photoUrl && p.angle === "roof");
  if (!hasRoof) {
    return {
      isValid: false,
      message: "Falta a fotografia do tejadilho.",
    };
  }
  return { isValid: true };
}

export function validateCheckinSubmission(checkin: {
  mileage: number;
  photos: CheckinPhoto[];
  signedByName?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!checkin.mileage || checkin.mileage <= 0) {
    errors.push("A quilometragem do odómetro é obrigatória e deve ser superior a zero.");
  }

  const photoValidation = validateCheckinPhotos(checkin.photos);
  if (!photoValidation.isValid && photoValidation.message) {
    errors.push(photoValidation.message);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
