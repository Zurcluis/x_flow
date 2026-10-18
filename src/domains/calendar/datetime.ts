export const WORKSHOP_TIME_ZONE = "Europe/Lisbon";

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

const workshopFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: WORKSHOP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export interface WorkshopDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface CivilDateParts {
  year: number;
  month: number;
  day: number;
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

function readPart(parts: Intl.DateTimeFormatPart[], type: string): number {
  const part = parts.find((item) => item.type === type);
  return part ? Number(part.value) : 0;
}

export function workshopDateTimeParts(date: Date): WorkshopDateTimeParts {
  const parts = workshopFormatter.formatToParts(date);
  return {
    year: readPart(parts, "year"),
    month: readPart(parts, "month"),
    day: readPart(parts, "day"),
    hour: readPart(parts, "hour"),
    minute: readPart(parts, "minute"),
    second: readPart(parts, "second"),
  };
}

/** Chave civil (YYYY-MM-DD) no fuso da oficina. */
export function workshopDateKey(date: Date): string {
  const parts = workshopDateTimeParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** Hora local da oficina (HH:MM). */
export function workshopTime(date: Date): string {
  const parts = workshopDateTimeParts(date);
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Minutos desde a meia-noite no fuso da oficina. */
export function workshopMinutes(date: Date): number {
  const parts = workshopDateTimeParts(date);
  return parts.hour * 60 + parts.minute;
}

export function todayWorkshopDateKey(now = new Date()): string {
  return workshopDateKey(now);
}

export function parseDateKey(value: string): CivilDateParts | null {
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function parseTime(value: string): { hour: number; minute: number } | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function offsetAt(date: Date): number {
  const parts = workshopDateTimeParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/**
 * Converte uma hora de parede da oficina (ex.: 17/10 às 09:00 em Lisboa)
 * para um instante UTC em ISO. Faz duas passagens para acertar o offset
 * quando a data cai perto de uma mudança de hora (DST).
 */
export function workshopIsoFromWallTime(dateKey: string, time: string): string | null {
  const dateParts = parseDateKey(dateKey);
  const timeParts = parseTime(time);
  if (!dateParts || !timeParts) return null;

  const wallClockUtc = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute,
    0,
    0
  );

  let timestamp = wallClockUtc - offsetAt(new Date(wallClockUtc));
  timestamp = wallClockUtc - offsetAt(new Date(timestamp));

  const result = new Date(timestamp);
  if (Number.isNaN(result.getTime())) return null;
  // Hora de parede inexistente (início do horário de verão): o instante
  // resultante não corresponde ao que foi pedido, por isso rejeitamos.
  if (workshopDateKey(result) !== dateKey || workshopTime(result) !== time) return null;
  return result.toISOString();
}

/**
 * Chave civil (YYYY-MM-DD) de um valor DATE vindo do Postgres.
 * O driver devolve DATE como Date à meia-noite local; usar os getters
 * locais preserva o dia original sem deslocar por causa do fuso.
 */
export function postgresDateKey(value: unknown): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  if (typeof value === "string") {
    const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
    if (match) return match[0];
  }
  return "";
}

/** Data civil (meia-noite UTC) usada apenas para aritmética de calendário. */
export function civilDateFromKey(dateKey: string): Date {
  const parts = parseDateKey(dateKey);
  if (!parts) return new Date(Date.UTC(1970, 0, 1, 12));
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
}

export function civilToday(): Date {
  return civilDateFromKey(todayWorkshopDateKey());
}

export function civilDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addCivilDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function startOfCivilWeek(date: Date): Date {
  const weekday = (date.getUTCDay() + 6) % 7;
  return addCivilDays(date, -weekday);
}

export function civilMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

export function isoFromCivil(date: Date, time: string): string | null {
  return workshopIsoFromWallTime(civilDateKey(date), time);
}

export function durationHoursBetween(startIso?: string, endIso?: string): number {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round(((end - start) / 3600000) * 100) / 100;
}
