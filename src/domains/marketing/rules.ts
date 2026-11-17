import type {
  CalendarDayCell,
  MonthlyPlanStats,
  SocialFormat,
  SocialHighlightItem,
  SocialInstagramPublishedPost,
  SocialMediaItem,
  SocialPillar,
  SocialPostRecord,
  SocialPostStatus,
  SimulatedGridItem,
} from "./types";

export const INSTAGRAM_BIO_MAX_CHARS = 150;
export const INSTAGRAM_NAME_MAX_CHARS = 60;
export const INSTAGRAM_CAPTION_MAX_CHARS = 2200;
export const MAX_HIGHLIGHTS = 7;
export const MAX_CAROUSEL_SLIDES = 10;
export const MAX_MEDIA_BYTES = 1_500_000;
export const MAX_TOTAL_POST_MEDIA_BYTES = 4_500_000;

const FORMATS = new Set<SocialFormat>(["reel", "carousel", "static", "story"]);
const PILLARS = new Set<SocialPillar>(["ppf", "wrap", "process", "details", "institutional"]);
const STATUSES = new Set<SocialPostStatus>(["idea", "production", "ready", "scheduled", "published"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATA_IMAGE_RE = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i;

export class MarketingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketingValidationError";
  }
}

export function validateMediaItems(items: unknown): SocialMediaItem[] {
  if (!Array.isArray(items)) {
    throw new MarketingValidationError("Lista de imagens inválida.");
  }
  if (items.length > MAX_CAROUSEL_SLIDES) {
    throw new MarketingValidationError(`Máximo de ${MAX_CAROUSEL_SLIDES} imagens por publicação.`);
  }

  let totalBytes = 0;
  const normalized: SocialMediaItem[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const raw = items[i] as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object") {
      throw new MarketingValidationError("Imagem inválida na publicação.");
    }
    const dataUrl = typeof raw.dataUrl === "string" ? raw.dataUrl.trim() : "";
    const match = DATA_IMAGE_RE.exec(dataUrl);
    if (!match) {
      throw new MarketingValidationError("Formato de imagem inválido (use JPEG, PNG ou WebP).");
    }
    const byteLength = Math.floor((match[2].length * 3) / 4);
    if (byteLength < 64) {
      throw new MarketingValidationError("Imagem demasiado pequena ou corrompida.");
    }
    if (byteLength > MAX_MEDIA_BYTES) {
      throw new MarketingValidationError("Uma das imagens excede o limite de 1,5 MB.");
    }
    totalBytes += byteLength;
    if (totalBytes > MAX_TOTAL_POST_MEDIA_BYTES) {
      throw new MarketingValidationError("O conjunto de imagens excede o limite de 4,5 MB.");
    }

    const mimeType = `image/${match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase()}`;
    normalized.push({
      id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim().slice(0, 60) : `slide-${i + 1}`,
      dataUrl,
      mimeType,
      alt: typeof raw.alt === "string" ? raw.alt.trim().slice(0, 200) : "",
    });
  }

  return normalized;
}

export interface ValidatedSocialPostInput {
  vehicleId: string | null;
  title: string;
  format: SocialFormat;
  pillar: SocialPillar;
  status: SocialPostStatus;
  scheduledFor: string | null;
  scheduledTime: string | null;
  isPinned: boolean;
  hook: string;
  caption: string;
  scriptNotes: string;
  cta: string;
  mediaItems: SocialMediaItem[];
  ownerConsent: boolean;
  publishedPermalink: string | null;
}

export function validateSocialPostInput(raw: Record<string, unknown>): ValidatedSocialPostInput {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (title.length < 2 || title.length > 180) {
    throw new MarketingValidationError("Indica um título entre 2 e 180 caracteres.");
  }

  const format = raw.format as SocialFormat;
  if (!FORMATS.has(format)) {
    throw new MarketingValidationError("Formato de publicação inválido.");
  }

  const pillar = raw.pillar as SocialPillar;
  if (!PILLARS.has(pillar)) {
    throw new MarketingValidationError("Pilar de conteúdo inválido.");
  }

  const status = raw.status as SocialPostStatus;
  if (!STATUSES.has(status)) {
    throw new MarketingValidationError("Estado da publicação inválido.");
  }

  const scheduledForRaw = typeof raw.scheduledFor === "string" ? raw.scheduledFor.trim() : "";
  const scheduledFor = scheduledForRaw ? scheduledForRaw : null;
  if (scheduledFor && !DATE_RE.test(scheduledFor)) {
    throw new MarketingValidationError("Data prevista inválida (use AAAA-MM-DD).");
  }

  const scheduledTimeRaw = typeof raw.scheduledTime === "string" ? raw.scheduledTime.trim() : "";
  const scheduledTime = scheduledTimeRaw ? scheduledTimeRaw : null;
  if (scheduledTime && !TIME_RE.test(scheduledTime)) {
    throw new MarketingValidationError("Hora prevista inválida (use HH:MM).");
  }

  const caption = typeof raw.caption === "string" ? raw.caption.trim() : "";
  if (caption.length > INSTAGRAM_CAPTION_MAX_CHARS) {
    throw new MarketingValidationError(
      `A legenda excede o limite do Instagram (${INSTAGRAM_CAPTION_MAX_CHARS} caracteres).`
    );
  }

  const hook = typeof raw.hook === "string" ? raw.hook.trim().slice(0, 280) : "";
  const scriptNotes = typeof raw.scriptNotes === "string" ? raw.scriptNotes.trim().slice(0, 4000) : "";
  const cta = typeof raw.cta === "string" ? raw.cta.trim().slice(0, 220) : "";

  const vehicleIdRaw = typeof raw.vehicleId === "string" ? raw.vehicleId.trim() : "";
  const vehicleId = vehicleIdRaw ? vehicleIdRaw : null;

  const permalinkRaw =
    typeof raw.publishedPermalink === "string" ? raw.publishedPermalink.trim() : "";
  const publishedPermalink = permalinkRaw ? permalinkRaw.slice(0, 400) : null;

  const mediaItems = raw.mediaItems !== undefined ? validateMediaItems(raw.mediaItems) : [];

  return {
    vehicleId,
    title,
    format,
    pillar,
    status,
    scheduledFor,
    scheduledTime,
    isPinned: Boolean(raw.isPinned) && format !== "story",
    hook,
    caption,
    scriptNotes,
    cta,
    mediaItems,
    ownerConsent: Boolean(raw.ownerConsent),
    publishedPermalink,
  };
}

export function validateSimulatedProfileInput(raw: {
  simulatedName: string;
  simulatedBio: string;
  simulatedWebsite: string;
  highlights: SocialHighlightItem[];
}): {
  simulatedName: string;
  simulatedBio: string;
  simulatedWebsite: string;
  highlights: SocialHighlightItem[];
} {
  const simulatedName = raw.simulatedName.trim();
  if (simulatedName.length === 0 || simulatedName.length > INSTAGRAM_NAME_MAX_CHARS) {
    throw new MarketingValidationError(
      `O nome no perfil deve ter entre 1 e ${INSTAGRAM_NAME_MAX_CHARS} caracteres.`
    );
  }

  const simulatedBio = raw.simulatedBio.replace(/\r\n/g, "\n").trim();
  if (simulatedBio.length > INSTAGRAM_BIO_MAX_CHARS) {
    throw new MarketingValidationError(
      `A bio do Instagram tem limite de ${INSTAGRAM_BIO_MAX_CHARS} caracteres.`
    );
  }

  const simulatedWebsite = raw.simulatedWebsite.trim();
  if (simulatedWebsite && !/^https?:\/\/\S+$/i.test(simulatedWebsite)) {
    throw new MarketingValidationError("O link da bio deve começar por https:// ou http://.");
  }

  const highlights = (raw.highlights ?? [])
    .slice(0, MAX_HIGHLIGHTS)
    .map((item, idx) => ({
      id: (item.id || `h${idx + 1}`).trim().slice(0, 32),
      title: item.title.trim().slice(0, 18),
      subtitle: item.subtitle.trim().slice(0, 60),
    }))
    .filter((item) => item.title.length > 0);

  return {
    simulatedName,
    simulatedBio,
    simulatedWebsite,
    highlights,
  };
}

export function buildSimulatedGridItems(
  plannedPosts: SocialPostRecord[],
  publishedPosts: SocialInstagramPublishedPost[],
  options: { includePlanned?: boolean } = {}
): SimulatedGridItem[] {
  const includePlanned = options.includePlanned ?? true;

  const activePlanned = includePlanned
    ? plannedPosts.filter((p) => p.format !== "story" && p.status !== "published")
    : [];

  const pinnedPlanned: SimulatedGridItem[] = activePlanned
    .filter((p) => p.isPinned)
    .sort((a, b) => a.gridOrder - b.gridOrder)
    .map((post) => ({
      kind: "planned",
      key: `planned-${post.id}`,
      post,
      coverUrl: post.mediaItems[0]?.dataUrl ?? null,
      isPinned: true,
    }));

  const regularPlanned: SimulatedGridItem[] = activePlanned
    .filter((p) => !p.isPinned)
    .sort((a, b) => {
      if (a.gridOrder !== b.gridOrder) return a.gridOrder - b.gridOrder;
      return (b.scheduledFor ?? "").localeCompare(a.scheduledFor ?? "");
    })
    .map((post) => ({
      kind: "planned",
      key: `planned-${post.id}`,
      post,
      coverUrl: post.mediaItems[0]?.dataUrl ?? null,
      isPinned: false,
    }));

  const pinnedPublished: SimulatedGridItem[] = publishedPosts
    .filter((p) => p.isPinned)
    .map((published) => ({
      kind: "published",
      key: `pub-${published.id}`,
      published,
      coverUrl: published.thumbnailUrl || published.mediaUrl || null,
      isPinned: true,
    }));

  const regularPublished: SimulatedGridItem[] = publishedPosts
    .filter((p) => !p.isPinned)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((published) => ({
      kind: "published",
      key: `pub-${published.id}`,
      published,
      coverUrl: published.thumbnailUrl || published.mediaUrl || null,
      isPinned: false,
    }));

  return [...pinnedPlanned, ...pinnedPublished, ...regularPlanned, ...regularPublished];
}

export function buildMonthlyCalendarMatrix(
  year: number,
  monthZeroBased: number,
  posts: SocialPostRecord[]
): CalendarDayCell[] {
  const firstOfMonth = new Date(Date.UTC(year, monthZeroBased, 1));
  const lastOfMonth = new Date(Date.UTC(year, monthZeroBased + 1, 0));

  // Portugal: semana começa na segunda-feira (0 = Seg ... 6 = Dom)
  const firstDayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const totalDaysInMonth = lastOfMonth.getUTCDate();
  const totalCells = Math.ceil((firstDayOffset + totalDaysInMonth) / 7) * 7;

  const byDate = new Map<string, SocialPostRecord[]>();
  for (const post of posts) {
    if (!post.scheduledFor) continue;
    const list = byDate.get(post.scheduledFor) ?? [];
    list.push(post);
    byDate.set(post.scheduledFor, list);
  }

  for (const [, list] of byDate) {
    list.sort((a, b) => (a.scheduledTime ?? "99:99").localeCompare(b.scheduledTime ?? "99:99"));
  }

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < totalCells; i += 1) {
    const cellDate = new Date(Date.UTC(year, monthZeroBased, 1 - firstDayOffset + i));
    const yyyy = cellDate.getUTCFullYear();
    const mm = String(cellDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(cellDate.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const inCurrentMonth =
      cellDate.getUTCFullYear() === year && cellDate.getUTCMonth() === monthZeroBased;

    cells.push({
      dateKey,
      dayNumber: cellDate.getUTCDate(),
      inCurrentMonth,
      posts: byDate.get(dateKey) ?? [],
    });
  }

  return cells;
}

export function computeMonthlyPlanStats(
  posts: SocialPostRecord[],
  year: number,
  monthZeroBased: number
): MonthlyPlanStats {
  const prefix = `${year}-${String(monthZeroBased + 1).padStart(2, "0")}-`;
  const monthPosts = posts.filter((p) => p.scheduledFor?.startsWith(prefix));

  const byFormat: Record<SocialFormat, number> = {
    reel: 0,
    carousel: 0,
    static: 0,
    story: 0,
  };
  const byPillar: Record<SocialPillar, number> = {
    ppf: 0,
    wrap: 0,
    process: 0,
    details: 0,
    institutional: 0,
  };

  let readyOrScheduledCount = 0;
  let publishedCount = 0;
  let withCtaCount = 0;
  let withConsentCount = 0;
  let withMediaCount = 0;

  for (const post of monthPosts) {
    byFormat[post.format] += 1;
    byPillar[post.pillar] += 1;
    if (post.status === "ready" || post.status === "scheduled") readyOrScheduledCount += 1;
    if (post.status === "published") publishedCount += 1;
    if (post.cta.trim().length > 0) withCtaCount += 1;
    if (post.ownerConsent) withConsentCount += 1;
    if (post.mediaItems.length > 0) withMediaCount += 1;
  }

  return {
    total: monthPosts.length,
    byFormat,
    byPillar,
    readyOrScheduledCount,
    publishedCount,
    withCtaCount,
    withConsentCount,
    withMediaCount,
  };
}
