import { Customer } from "./types";

export interface DuplicateMatch {
  customer: Customer;
  matchedField: "email" | "phone" | "nif";
  matchedValue: string;
}

export function normalizePhoneForLookup(phone: string): string {
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, "");
  // If starts with 351 (Portugal) and has 12 digits (351 + 9 digits), strip 351 for standard 9 digits
  if (digits.startsWith("351") && digits.length >= 11) {
    return digits.slice(3);
  }
  return digits;
}

export function normalizeEmailForLookup(email: string): string {
  return email.trim().toLowerCase();
}

export function detectDuplicateCustomer(
  input: { email?: string; phone?: string; nif?: string; excludeId?: string },
  existingCustomers: Customer[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const normalizedInputEmail = input.email ? normalizeEmailForLookup(input.email) : null;
  const normalizedInputPhone = input.phone ? normalizePhoneForLookup(input.phone) : null;
  const cleanInputNif = input.nif ? input.nif.trim().toUpperCase() : null;

  for (const customer of existingCustomers) {
    if (input.excludeId && customer.id === input.excludeId) {
      continue;
    }

    // Check email
    if (
      normalizedInputEmail &&
      customer.email &&
      normalizeEmailForLookup(customer.email) === normalizedInputEmail
    ) {
      matches.push({
        customer,
        matchedField: "email",
        matchedValue: customer.email,
      });
      continue;
    }

    // Check phone
    if (
      normalizedInputPhone &&
      customer.phone &&
      normalizePhoneForLookup(customer.phone) === normalizedInputPhone
    ) {
      matches.push({
        customer,
        matchedField: "phone",
        matchedValue: customer.phone,
      });
      continue;
    }

    // Check NIF
    if (
      cleanInputNif &&
      customer.nif &&
      customer.nif.trim().toUpperCase() === cleanInputNif
    ) {
      matches.push({
        customer,
        matchedField: "nif",
        matchedValue: customer.nif,
      });
      continue;
    }
  }

  return matches;
}
