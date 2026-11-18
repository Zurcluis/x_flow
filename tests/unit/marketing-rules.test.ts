import { describe, expect, it } from "vitest";
import { buildDecember2026SeedPosts } from "@/domains/marketing/december-seed";
import {
  MarketingValidationError,
  buildMonthlyCalendarMatrix,
  buildSimulatedGridItems,
  computeMonthlyPlanStats,
  validateSimulatedProfileInput,
  validateSocialPostInput,
} from "@/domains/marketing/rules";
import type {
  SocialInstagramPublishedPost,
  SocialPostRecord,
} from "@/domains/marketing/types";

function makePost(overrides: Partial<SocialPostRecord> = {}): SocialPostRecord {
  return {
    id: "p1",
    organizationId: "org1",
    vehicleId: null,
    vehicleLabel: null,
    title: "Post teste",
    format: "reel",
    pillar: "process",
    status: "ready",
    scheduledFor: "2026-12-04",
    scheduledTime: "18:00",
    gridOrder: 10,
    isPinned: false,
    hook: "Gancho",
    caption: "Legenda teste",
    scriptNotes: "",
    cta: "Enviar DM",
    mediaItems: [],
    ownerConsent: true,
    publishedPermalink: null,
    createdAt: "2026-11-17T12:00:00Z",
    updatedAt: "2026-11-17T12:00:00Z",
    ...overrides,
  };
}

function makePublished(
  overrides: Partial<SocialInstagramPublishedPost> = {}
): SocialInstagramPublishedPost {
  return {
    id: "pub1",
    organizationId: "org1",
    externalMediaId: "1788",
    mediaType: "VIDEO",
    mediaProductType: "REELS",
    caption: "Corvette",
    mediaUrl: null,
    thumbnailUrl: null,
    children: [],
    permalink: "https://www.instagram.com/reel/abc/",
    likeCount: 50,
    commentsCount: 3,
    isPinned: false,
    publishedAt: "2026-09-01T18:00:00Z",
    syncedAt: "2026-11-17T12:00:00Z",
    ...overrides,
  };
}

describe("marketing rules", () => {
  it("validates social post inputs and rejects invalid formats or long captions", () => {
    const valid = validateSocialPostInput({
      title: "Reel PPF",
      format: "reel",
      pillar: "ppf",
      status: "ready",
      scheduledFor: "2026-12-02",
      scheduledTime: "18:00",
      isPinned: true,
      hook: "Gancho claro",
      caption: "Legenda pt-PT",
      cta: "Pedir avaliação",
      ownerConsent: true,
    });
    expect(valid.isPinned).toBe(true);
    expect(valid.scheduledFor).toBe("2026-12-02");

    // Stories cannot be pinned to feed grid
    const story = validateSocialPostInput({
      title: "Story dia",
      format: "story",
      pillar: "process",
      status: "idea",
      isPinned: true,
    });
    expect(story.isPinned).toBe(false);

    expect(() =>
      validateSocialPostInput({
        title: "A",
        format: "reel",
        pillar: "ppf",
        status: "idea",
      })
    ).toThrow(MarketingValidationError);

    expect(() =>
      validateSocialPostInput({
        title: "Legenda gigante",
        format: "static",
        pillar: "ppf",
        status: "idea",
        caption: "x".repeat(2205),
      })
    ).toThrow(MarketingValidationError);
  });

  it("enforces Instagram 150-char bio limit and https link validation", () => {
    const ok = validateSimulatedProfileInput({
      simulatedName: "X-Motion | PPF & Car Wrap Barcelos",
      simulatedBio: "PPF, Car Wrap e Color PPF em Barcelos.",
      simulatedWebsite: "https://x-flow-b8rt.vercel.app/ig",
      highlights: [{ id: "h1", title: "Avaliar", subtitle: "Proposta" }],
    });
    expect(ok.highlights).toHaveLength(1);

    expect(() =>
      validateSimulatedProfileInput({
        simulatedName: "X-Motion",
        simulatedBio: "a".repeat(151),
        simulatedWebsite: "https://x-flow-b8rt.vercel.app/ig",
        highlights: [],
      })
    ).toThrow(MarketingValidationError);

    expect(() =>
      validateSimulatedProfileInput({
        simulatedName: "X-Motion",
        simulatedBio: "Bio curta",
        simulatedWebsite: "ftp://invalido",
        highlights: [],
      })
    ).toThrow(MarketingValidationError);
  });

  it("builds simulated grid stacking planned feed items above real published posts", () => {
    const planned = [
      makePost({ id: "story-1", format: "story", gridOrder: 1 }),
      makePost({ id: "pub-done", status: "published", gridOrder: 2 }),
      makePost({ id: "regular-2", gridOrder: 20 }),
      makePost({ id: "regular-1", gridOrder: 10 }),
      makePost({ id: "pinned-1", isPinned: true, gridOrder: 30 }),
    ];
    const published = [
      makePublished({ id: "ig-old", publishedAt: "2026-08-01T12:00:00Z" }),
      makePublished({ id: "ig-new", publishedAt: "2026-09-01T12:00:00Z" }),
    ];

    const grid = buildSimulatedGridItems(planned, published);
    expect(grid.map((g) => g.key)).toEqual([
      "planned-pinned-1",
      "planned-regular-1",
      "planned-regular-2",
      "pub-ig-new",
      "pub-ig-old",
    ]);

    const liveOnly = buildSimulatedGridItems(planned, published, { includePlanned: false });
    expect(liveOnly.map((g) => g.key)).toEqual(["pub-ig-new", "pub-ig-old"]);
  });

  it("builds Monday-first calendar matrix for December 2026 and computes stats", () => {
    const seed = buildDecember2026SeedPosts();
    const records: SocialPostRecord[] = seed.map((item, idx) =>
      makePost({
        id: `dec-${idx}`,
        title: item.title,
        format: item.format,
        pillar: item.pillar,
        status: item.status,
        scheduledFor: item.scheduledFor,
        scheduledTime: item.scheduledTime,
        gridOrder: item.gridOrder,
        isPinned: item.isPinned,
        hook: item.hook,
        caption: item.caption,
        cta: item.cta,
        ownerConsent: item.ownerConsent,
      })
    );

    const matrix = buildMonthlyCalendarMatrix(2026, 11, records);
    expect(matrix[0].dateKey).toBe("2026-11-30"); // 1 Dec 2026 is Tuesday -> Monday is Nov 30
    expect(matrix[0].inCurrentMonth).toBe(false);
    expect(matrix[1].dateKey).toBe("2026-12-01");
    expect(matrix[1].posts).toHaveLength(1);

    const stats = computeMonthlyPlanStats(records, 2026, 11);
    expect(stats.total).toBe(18);
    expect(stats.byFormat.reel).toBe(9);
    expect(stats.byFormat.carousel).toBe(7);
    expect(stats.byFormat.static).toBe(1);
    expect(stats.byFormat.story).toBe(1);
    expect(stats.withCtaCount).toBe(18);
  });

  it("seed posts pass strict validation, contain no emojis, never use atelier, and use direct tu form", () => {
    const seed = buildDecember2026SeedPosts();
    expect(seed).toHaveLength(19);
    expect(seed[0].mediaItems).toHaveLength(5);
    const emojiRegex = /\p{Extended_Pictographic}/u;
    const forbiddenPlaceRegex = /ateli[eê]/i;
    const formalThirdPersonRegex = /\b(gostaria|preferia|o seu carro|peça a sua|envie-nos|partilhe|comente|guarde)\b/i;
    for (const item of seed) {
      const validated = validateSocialPostInput({ ...item });
      expect(validated.title.length).toBeGreaterThan(2);
      expect(emojiRegex.test(item.title)).toBe(false);
      expect(emojiRegex.test(item.hook)).toBe(false);
      expect(emojiRegex.test(item.caption)).toBe(false);
      expect(emojiRegex.test(item.cta)).toBe(false);
      expect(forbiddenPlaceRegex.test(item.title)).toBe(false);
      expect(forbiddenPlaceRegex.test(item.hook)).toBe(false);
      expect(forbiddenPlaceRegex.test(item.caption)).toBe(false);
      expect(forbiddenPlaceRegex.test(item.scriptNotes)).toBe(false);
      expect(forbiddenPlaceRegex.test(item.cta)).toBe(false);
      expect(formalThirdPersonRegex.test(item.hook)).toBe(false);
      expect(formalThirdPersonRegex.test(item.caption)).toBe(false);
      expect(formalThirdPersonRegex.test(item.cta)).toBe(false);
    }
  });

  it("allows internal /conteudos/ image paths and blocks path traversal", () => {
    const valid = validateSocialPostInput({
      title: "Carrossel com criativos locais",
      format: "carousel",
      pillar: "wrap",
      status: "ready",
      mediaItems: [
        {
          id: "slide-1",
          dataUrl: "/conteudos/carrossel-01-car-wrap/01-mudar-de-cor.png",
          mimeType: "image/png",
          alt: "Capa",
        },
      ],
    });
    expect(valid.mediaItems).toHaveLength(1);
    expect(valid.mediaItems[0].mimeType).toBe("image/png");

    expect(() =>
      validateSocialPostInput({
        title: "Traversal bloqueado",
        format: "carousel",
        pillar: "wrap",
        status: "ready",
        mediaItems: [
          {
            id: "bad",
            dataUrl: "/conteudos/../secret.png",
            mimeType: "image/png",
            alt: "Bad",
          },
        ],
      })
    ).toThrow(MarketingValidationError);
  });
});
