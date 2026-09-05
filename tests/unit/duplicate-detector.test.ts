import { describe, it, expect } from "vitest";
import {
  detectDuplicateCustomer,
  normalizePhoneForLookup,
  normalizeEmailForLookup,
} from "@/domains/crm/duplicate-detector";
import { Customer } from "@/domains/crm/types";

const mockCustomers: Customer[] = [
  {
    id: "c-1",
    organizationId: "org-1",
    type: "individual",
    name: "Bernardo Silva",
    email: "bernardo@email.pt",
    phone: "912345678",
    phoneNormalized: "912345678",
    nif: "123456789",
    preferredChannel: "whatsapp",
    status: "active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "c-2",
    organizationId: "org-1",
    type: "business",
    name: "AutoStand Prime",
    email: "comercial@prime.pt",
    phone: "918765432",
    phoneNormalized: "918765432",
    nif: "509999888",
    preferredChannel: "email",
    status: "active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

describe("Duplicate customer detector", () => {
  it("normalizes phone numbers removing formatting and standard prefixes", () => {
    expect(normalizePhoneForLookup("+351 912 345 678")).toBe("912345678");
    expect(normalizePhoneForLookup("912-345-678")).toBe("912345678");
  });

  it("normalizes emails", () => {
    expect(normalizeEmailForLookup(" Bernardo@Email.PT ")).toBe("bernardo@email.pt");
  });

  it("detects duplicates by email match", () => {
    const matches = detectDuplicateCustomer(
      { email: "BERNARDO@email.pt" },
      mockCustomers
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedField).toBe("email");
    expect(matches[0].customer.id).toBe("c-1");
  });

  it("detects duplicates by phone match", () => {
    const matches = detectDuplicateCustomer(
      { phone: "+351 918 765 432" },
      mockCustomers
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedField).toBe("phone");
    expect(matches[0].customer.id).toBe("c-2");
  });

  it("detects duplicates by NIF match", () => {
    const matches = detectDuplicateCustomer(
      { nif: "509999888" },
      mockCustomers
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedField).toBe("nif");
  });

  it("ignores the customer when excludeId is provided (editing self)", () => {
    const matches = detectDuplicateCustomer(
      { email: "bernardo@email.pt", excludeId: "c-1" },
      mockCustomers
    );
    expect(matches).toHaveLength(0);
  });
});
