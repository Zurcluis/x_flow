export type OrganizationRole =
  | "admin"
  | "workshop_manager"
  | "technician"
  | "customer"
  | "b2b_user";

export const FINANCIAL_ROLES = ["admin", "workshop_manager"] as const;

export const MANAGEMENT_ROLES = ["admin", "workshop_manager"] as const;

export const SCHEDULING_ROLES = ["admin", "workshop_manager", "technician"] as const;

export function hasRole(
  role: OrganizationRole,
  allowed: readonly OrganizationRole[]
): boolean {
  return allowed.includes(role);
}

export function canSeeFinancials(role: OrganizationRole): boolean {
  return hasRole(role, FINANCIAL_ROLES);
}

export function canManageSettings(role: OrganizationRole): boolean {
  return role === "admin";
}
