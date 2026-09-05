export type SearchCategory =
  | "vehicles"
  | "customers"
  | "quotes"
  | "production"
  | "checkins"
  | "stock"
  | "tools"
  | "invoices"
  | "warranties"
  | "vision"
  | "pages"
  | "actions";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  categoryLabel: string;
  href: string;
  badge?: string;
  badgeVariant?: "gold" | "outline" | "success" | "danger" | "in_progress";
  keywords: string[];
}

export interface SearchFilter {
  category?: SearchCategory | "all";
}
