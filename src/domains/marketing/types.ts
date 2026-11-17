export type SocialFormat = "reel" | "carousel" | "static" | "story";

export type SocialPillar = "ppf" | "wrap" | "process" | "details" | "institutional";

export type SocialPostStatus = "idea" | "production" | "ready" | "scheduled" | "published";

export interface SocialHighlightItem {
  id: string;
  title: string;
  subtitle: string;
}

export interface SocialMediaItem {
  id: string;
  dataUrl: string;
  mimeType: string;
  alt: string;
}

export interface SocialInstagramProfile {
  id: string;
  organizationId: string;
  externalAccountId: string | null;
  username: string;
  displayName: string;
  biography: string;
  websiteUrl: string;
  profilePictureUrl: string | null;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  simulatedName: string;
  simulatedBio: string;
  simulatedWebsite: string;
  highlights: SocialHighlightItem[];
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface SocialInstagramChildMedia {
  mediaUrl: string | null;
  mediaType: string | null;
  thumbnailUrl: string | null;
}

export interface SocialInstagramPublishedPost {
  id: string;
  organizationId: string;
  externalMediaId: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaProductType: "FEED" | "REELS";
  caption: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  children: SocialInstagramChildMedia[];
  permalink: string | null;
  likeCount: number;
  commentsCount: number;
  isPinned: boolean;
  publishedAt: string;
  syncedAt: string;
}

export interface SocialPostRecord {
  id: string;
  organizationId: string;
  vehicleId: string | null;
  vehicleLabel: string | null;
  title: string;
  format: SocialFormat;
  pillar: SocialPillar;
  status: SocialPostStatus;
  scheduledFor: string | null; // YYYY-MM-DD
  scheduledTime: string | null; // HH:mm
  gridOrder: number;
  isPinned: boolean;
  hook: string;
  caption: string;
  scriptNotes: string;
  cta: string;
  mediaItems: SocialMediaItem[];
  ownerConsent: boolean;
  publishedPermalink: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SimulatedGridItem =
  | {
      kind: "planned";
      key: string;
      post: SocialPostRecord;
      coverUrl: string | null;
      isPinned: boolean;
    }
  | {
      kind: "published";
      key: string;
      published: SocialInstagramPublishedPost;
      coverUrl: string | null;
      isPinned: boolean;
    };

export interface CalendarDayCell {
  dateKey: string; // YYYY-MM-DD
  dayNumber: number;
  inCurrentMonth: boolean;
  posts: SocialPostRecord[];
}

export interface MonthlyPlanStats {
  total: number;
  byFormat: Record<SocialFormat, number>;
  byPillar: Record<SocialPillar, number>;
  readyOrScheduledCount: number;
  publishedCount: number;
  withCtaCount: number;
  withConsentCount: number;
  withMediaCount: number;
}

export const SOCIAL_FORMAT_LABELS: Record<SocialFormat, string> = {
  reel: "Reel",
  carousel: "Carrossel",
  static: "Estático",
  story: "Stories",
};

export const SOCIAL_PILLAR_LABELS: Record<SocialPillar, string> = {
  ppf: "Proteção (PPF)",
  wrap: "Transformação (Wrap)",
  process: "Processo e Cuidado",
  details: "Detalhes e Motas",
  institutional: "Institucional",
};

export const SOCIAL_STATUS_LABELS: Record<SocialPostStatus, string> = {
  idea: "Ideia",
  production: "Em produção",
  ready: "Pronto",
  scheduled: "Agendado",
  published: "Publicado",
};
