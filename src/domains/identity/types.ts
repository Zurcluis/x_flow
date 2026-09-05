export type UserRole =
  | "admin"
  | "workshop_manager"
  | "technician"
  | "customer"
  | "b2b_user";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  locale: string;
  currency: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  organizationId: string;
  createdAt: string;
}
