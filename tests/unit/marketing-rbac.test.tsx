import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarketingView } from "@/app/marketing/MarketingView";
import { navSectionsForRole } from "@/components/xflow/Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/marketing",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/actions/marketing", () => ({
  syncMarketingInstagramAction: vi.fn(),
  updateSimulatedProfileAction: vi.fn(),
  createSocialPostAction: vi.fn(),
  updateSocialPostAction: vi.fn(),
  deleteSocialPostAction: vi.fn(),
  moveSocialPostGridOrderAction: vi.fn(),
  importDecemberPlanAction: vi.fn(),
  draftSocialPostAiAction: vi.fn(),
}));

describe("marketing RBAC and view", () => {
  it("shows Marketing (/marketing) to admin and workshop_manager, and hides it from technician", () => {
    const adminHrefs = navSectionsForRole("admin").flatMap((s) => s.items.map((i) => i.href));
    const managerHrefs = navSectionsForRole("workshop_manager").flatMap((s) =>
      s.items.map((i) => i.href)
    );
    const techHrefs = navSectionsForRole("technician").flatMap((s) => s.items.map((i) => i.href));

    expect(adminHrefs).toContain("/marketing");
    expect(managerHrefs).toContain("/marketing");
    expect(techHrefs).not.toContain("/marketing");
  });

  it("renders MarketingView simulator, calendar tab, and profile header", () => {
    render(
      <MarketingView
        initialProfile={{
          id: "prof-1",
          organizationId: "org-1",
          externalAccountId: "ig-acc-1",
          username: "x_motion.wrap",
          displayName: "X-MOTION",
          biography: "X-Motion",
          websiteUrl: "https://x-flow-b8rt.vercel.app/ig",
          profilePictureUrl: null,
          followersCount: 2718,
          followsCount: 162,
          mediaCount: 156,
          simulatedName: "X-Motion | PPF & Car Wrap Barcelos",
          simulatedBio: "PPF, Car Wrap e Color PPF em Barcelos.",
          simulatedWebsite: "https://x-flow-b8rt.vercel.app/ig",
          highlights: [{ id: "h1", title: "Avaliar", subtitle: "Proposta" }],
          lastSyncedAt: "2026-11-17T13:00:00Z",
          lastError: null,
        }}
        initialPublishedPosts={[
          {
            id: "pub-1",
            organizationId: "org-1",
            externalMediaId: "17884957617615064",
            mediaType: "VIDEO",
            mediaProductType: "REELS",
            caption: "Chevrolet Corvette transformação",
            mediaUrl: null,
            thumbnailUrl: null,
            children: [],
            permalink: "https://www.instagram.com/reel/DcwQXA7R_rO/",
            likeCount: 50,
            commentsCount: 3,
            isPinned: false,
            publishedAt: "2026-09-01T18:00:06Z",
            syncedAt: "2026-11-17T13:00:00Z",
          },
        ]}
        initialPlannedPosts={[]}
        vehicles={[]}
        aiEnabled={true}
        autoSyncNeeded={false}
      />
    );

    expect(screen.getByText("Marketing e Simulador Instagram")).toBeInTheDocument();
    expect(screen.getByText("x_motion.wrap")).toBeInTheDocument();
    expect(screen.getByText(/2[\s.]?718/)).toBeInTheDocument();
    expect(screen.getByText("Carregar Plano Dezembro (18)")).toBeInTheDocument();
    expect(screen.getByText("Calendário Mensal")).toBeInTheDocument();
  });
});
