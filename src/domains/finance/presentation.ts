import {
  todayWorkshopDateKey,
  workshopDateKey,
} from "@/domains/calendar/datetime";
import type { Invoice, PaymentStatus, RecurringRule } from "./types";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function parseDate(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatInvoiceDate(value?: string | null): string {
  if (!value) return "Data indisponível";
  const date = parseDate(value);
  return date ? DATE_FORMATTER.format(date) : "Data indisponível";
}

export function invoiceMonthKey(value: string): string {
  const date = parseDate(value);
  return date ? workshopDateKey(date).slice(0, 7) : "";
}

export function currentInvoiceMonthKey(now = new Date()): string {
  return workshopDateKey(now).slice(0, 7);
}

export function isInvoiceOverdue(
  invoice: Pick<Invoice, "paymentStatus" | "dueAt">,
  today = todayWorkshopDateKey()
): boolean {
  return invoice.paymentStatus === "pending" && invoice.dueAt.slice(0, 10) < today;
}

export function effectiveInvoiceStatus(
  invoice: Pick<Invoice, "paymentStatus" | "dueAt">,
  today = todayWorkshopDateKey()
): PaymentStatus {
  return isInvoiceOverdue(invoice, today) ? "overdue" : invoice.paymentStatus;
}

export interface InvoiceTotalsIntegrity {
  linesNet: number;
  linesMatchSubtotal: boolean;
  subtotalPlusVat: number;
  totalMatches: boolean;
  isConsistent: boolean;
}

export function invoiceTotalsIntegrity(invoice: Invoice): InvoiceTotalsIntegrity {
  const linesNet = Math.round(
    invoice.lines.reduce((acc, line) => acc + line.lineTotal, 0) * 100
  ) / 100;
  const subtotal = Math.round(invoice.subtotal * 100) / 100;
  const subtotalPlusVat =
    Math.round((invoice.subtotal + invoice.vatAmount) * 100) / 100;
  const total = Math.round(invoice.totalAmount * 100) / 100;
  const linesMatchSubtotal = invoice.lines.length === 0 || Math.abs(linesNet - subtotal) < 0.01;
  const totalMatches = Math.abs(subtotalPlusVat - total) < 0.01;
  return {
    linesNet,
    linesMatchSubtotal,
    subtotalPlusVat,
    totalMatches,
    isConsistent: linesMatchSubtotal && totalMatches,
  };
}

export function monthlyAmountFor(
  amount: number,
  frequency: RecurringRule["frequency"]
): number {
  const factor =
    frequency === "yearly" ? 1 / 12 : frequency === "quarterly" ? 1 / 3 : 1;
  return Math.round(amount * factor * 100) / 100;
}
