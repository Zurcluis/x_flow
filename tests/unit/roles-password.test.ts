import { describe, expect, it } from "vitest";
import {
  canManageSettings,
  canSeeFinancials,
  hasRole,
  type OrganizationRole,
} from "@/lib/roles";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/lib/password-policy";

describe("roles", () => {
  it("allows only admin and workshop_manager to see financials", () => {
    const allowed: OrganizationRole[] = ["admin", "workshop_manager"];
    const denied: OrganizationRole[] = ["technician", "customer", "b2b_user"];
    for (const role of allowed) expect(canSeeFinancials(role)).toBe(true);
    for (const role of denied) expect(canSeeFinancials(role)).toBe(false);
  });

  it("restricts general settings to admin", () => {
    expect(canManageSettings("admin")).toBe(true);
    expect(canManageSettings("workshop_manager")).toBe(false);
    expect(canManageSettings("technician")).toBe(false);
  });

  it("checks explicit role lists", () => {
    expect(hasRole("technician", ["admin", "technician"])).toBe(true);
    expect(hasRole("customer", ["admin", "technician"])).toBe(false);
  });
});

describe("password policy", () => {
  const current = "OldPassword-2026";

  it("accepts a strong new password", () => {
    expect(validateNewPassword(current, "NewPassword-2026", "NewPassword-2026")).toBeNull();
  });

  it("rejects short passwords", () => {
    const short = "Aa1!";
    expect(short.length).toBeLessThan(MIN_PASSWORD_LENGTH);
    expect(validateNewPassword(current, short, short)).toMatch(/pelo menos/);
  });

  it("rejects passwords without enough character classes", () => {
    expect(validateNewPassword(current, "onlylowercaseletters", "onlylowercaseletters")).toMatch(
      /três tipos/
    );
  });

  it("rejects mismatched confirmation", () => {
    expect(validateNewPassword(current, "NewPassword-2026", "OtherPassword-2026")).toMatch(
      /confirmação/
    );
  });

  it("rejects reusing the current password", () => {
    expect(validateNewPassword(current, current, current)).toMatch(/diferente/);
  });

  it("requires the current password", () => {
    expect(validateNewPassword("", "NewPassword-2026", "NewPassword-2026")).toMatch(/atual/);
  });
});
