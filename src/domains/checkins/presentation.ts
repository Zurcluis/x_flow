import { WORKSHOP_TIME_ZONE } from "@/domains/calendar/datetime";
import { Checkin } from "./types";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: WORKSHOP_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCheckinDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return DATE_FORMATTER.format(date);
}

export function fuelLevelLabel(level: Checkin["fuelLevel"]): string {
  switch (level) {
    case "full":
      return "100% Cheio";
    case "three_quarters":
      return "3/4 Depósito";
    case "half":
      return "1/2 Depósito";
    case "quarter":
      return "1/4 Depósito";
    case "empty":
      return "Reserva";
  }
}

export function cleanlinessLabel(status: Checkin["cleanlinessStatus"]): string {
  switch (status) {
    case "clean":
      return "Limpa";
    case "dusty":
      return "Poeira ligeira";
    case "dirty":
      return "Suja";
    case "needs_decontamination":
      return "Requer descontaminação";
  }
}

export function checkinTypeLabel(type: Checkin["type"]): string {
  return type === "entry" ? "Entrada" : "Saída";
}

export function isCheckinSigned(checkin: Checkin): boolean {
  return (
    checkin.status === "signed" &&
    (checkin.hasSignature ?? Boolean(checkin.signatureDataUrl))
  );
}

export function checkinStatusLabel(checkin: Checkin): string {
  if (checkin.status === "draft") return "Rascunho";
  const action = checkinTypeLabel(checkin.type);
  return isCheckinSigned(checkin) ? `${action} Assinada` : `${action} Concluída`;
}
