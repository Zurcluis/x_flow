"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Film,
  Grid3X3,
  Layers,
  Link2,
  Loader2,
  Pin,
  Plus,
  Save,
} from "lucide-react";
import {
  moveSocialPostGridOrderAction,
  updateSimulatedProfileAction,
} from "@/app/actions/marketing";
import {
  INSTAGRAM_BIO_MAX_CHARS,
  INSTAGRAM_NAME_MAX_CHARS,
  buildSimulatedGridItems,
} from "@/domains/marketing/rules";
import {
  SOCIAL_FORMAT_LABELS,
  SOCIAL_STATUS_LABELS,
  type SimulatedGridItem,
  type SocialHighlightItem,
  type SocialInstagramProfile,
  type SocialInstagramPublishedPost,
  type SocialPostRecord,
} from "@/domains/marketing/types";
import { cn } from "@/lib/utils";

interface InstagramSimulatorProps {
  profile: SocialInstagramProfile;
  publishedPosts: SocialInstagramPublishedPost[];
  plannedPosts: SocialPostRecord[];
  onProfileUpdated: (profile: SocialInstagramProfile) => void;
  onPostsReordered: (posts: SocialPostRecord[]) => void;
  onSelectGridItem: (item: SimulatedGridItem) => void;
  onCreatePost: () => void;
}

const STATUS_BADGE_CLASSES: Record<SocialPostRecord["status"], string> = {
  idea: "bg-zinc-900/90 text-zinc-200 border-white/20",
  production: "bg-sky-950/90 text-sky-200 border-sky-400/40",
  ready: "bg-emerald-950/90 text-emerald-200 border-emerald-400/40",
  scheduled: "bg-[#2a2210]/95 text-[#f7d46d] border-[#d3a548]/50",
  published: "bg-white/10 text-white border-white/20",
};

function GridTileImage({
  url,
  alt,
  fallbackTitle,
}: {
  url: string | null;
  alt: string;
  fallbackTitle: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="h-full w-full flex flex-col justify-between p-2.5 bg-gradient-to-br from-[#121513] via-[#171A18] to-[#080a0b] text-left">
        <span className="text-[9px] uppercase tracking-[0.16em] text-[#d3a548]/80 font-semibold">
          X-Motion
        </span>
        <p className="text-[11px] sm:text-xs font-semibold text-[#f1ede5] line-clamp-3 leading-snug">
          {fallbackTitle}
        </p>
        <span className="text-[9px] text-[#8a9092] truncate">Barcelos</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    />
  );
}

export function InstagramSimulator({
  profile,
  publishedPosts,
  plannedPosts,
  onProfileUpdated,
  onPostsReordered,
  onSelectGridItem,
  onCreatePost,
}: InstagramSimulatorProps) {
  const [previewMode, setPreviewMode] = useState<"future" | "live">("future");
  const [gridFilter, setGridFilter] = useState<"all" | "reels">("all");
  const [simName, setSimName] = useState(profile.simulatedName);
  const [simBio, setSimBio] = useState(profile.simulatedBio);
  const [simWebsite, setSimWebsite] = useState(profile.simulatedWebsite);
  const [highlights, setHighlights] = useState<SocialHighlightItem[]>(
    profile.highlights.length > 0
      ? profile.highlights
      : [
          { id: "h1", title: "Avaliar", subtitle: "Como pedir proposta" },
          { id: "h2", title: "PPF", subtitle: "Proteção de pintura" },
          { id: "h3", title: "Car Wrap", subtitle: "Mudança de cor" },
          { id: "h4", title: "Color PPF", subtitle: "Cor e proteção" },
          { id: "h5", title: "Barcelos", subtitle: "Morada e horário" },
        ]
  );
  const [bioCopied, setBioCopied] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, startSavingProfile] = useTransition();
  const [isReordering, startReordering] = useTransition();

  const allGridItems = useMemo(
    () =>
      buildSimulatedGridItems(plannedPosts, publishedPosts, {
        includePlanned: previewMode === "future",
      }),
    [plannedPosts, publishedPosts, previewMode]
  );

  const visibleGridItems = useMemo(() => {
    if (gridFilter === "all") return allGridItems;
    return allGridItems.filter((item) =>
      item.kind === "planned"
        ? item.post.format === "reel"
        : item.published.mediaProductType === "REELS"
    );
  }, [allGridItems, gridFilter]);

  const futureFeedCount = useMemo(
    () => plannedPosts.filter((p) => p.format !== "story" && p.status !== "published").length,
    [plannedPosts]
  );

  const activeName = previewMode === "future" ? simName : profile.displayName;
  const activeBio =
    previewMode === "future"
      ? simBio
      : profile.biography || "Bio não devolvida pela API neste perfil (use o modo Pré-visualização Futura).";
  const activeWebsite = previewMode === "future" ? simWebsite : profile.websiteUrl;
  const totalPostsCounter =
    (profile.mediaCount > 0 ? profile.mediaCount : publishedPosts.length) +
    (previewMode === "future" ? futureFeedCount : 0);

  const handleSaveSimulatedProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileNotice(null);
    setProfileError(null);
    startSavingProfile(async () => {
      const res = await updateSimulatedProfileAction({
        simulatedName: simName,
        simulatedBio: simBio,
        simulatedWebsite: simWebsite,
        highlights,
      });
      if (!res.ok) {
        setProfileError(res.error);
        return;
      }
      onProfileUpdated(res.profile);
      setProfileNotice("Vitrine simulada guardada.");
      setTimeout(() => setProfileNotice(null), 2500);
    });
  };

  const handleMoveGrid = (e: React.MouseEvent, postId: string, direction: "earlier" | "later") => {
    e.stopPropagation();
    startReordering(async () => {
      const res = await moveSocialPostGridOrderAction(postId, direction);
      if (res.ok) {
        onPostsReordered(res.posts);
      }
    });
  };

  const handleCopyBio = async () => {
    await navigator.clipboard.writeText(simBio);
    setBioCopied(true);
    setTimeout(() => setBioCopied(false), 1800);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left/Center: Realistic Instagram Phone Preview */}
      <div className="xl:col-span-7 flex flex-col items-center">
        <div className="w-full max-w-[460px] mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-white/[0.1] bg-[#0b0d0e] p-1">
            <button
              type="button"
              onClick={() => setPreviewMode("future")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                previewMode === "future"
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
                  : "text-[#8a9092] hover:text-[#f1ede5]"
              )}
            >
              Pré-visualização Futura (+{futureFeedCount})
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("live")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                previewMode === "live"
                  ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
                  : "text-[#8a9092] hover:text-[#f1ede5]"
              )}
            >
              Atual no Instagram ({publishedPosts.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onCreatePost}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#d3a548] px-3 py-1.5 text-xs font-semibold text-[#050606] hover:bg-[#e1b75f] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar à grelha
          </button>
        </div>

        {/* Phone Mockup Frame */}
        <div className="w-full max-w-[460px] rounded-[28px] border border-white/[0.12] bg-[#050606] shadow-[0_24px_70px_rgba(0,0,0,0.65)] overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#080a0b]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold tracking-tight text-[#f1ede5] truncate">
                {profile.username}
              </span>
              <span className="rounded bg-[#1f1b14] border border-[#d3a548]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#f7d46d]">
                {previewMode === "future" ? "Simulação" : "Real"}
              </span>
            </div>
            <span className="text-[11px] text-[#8a9092]">
              {profile.lastSyncedAt
                ? `Sincronizado ${profile.lastSyncedAt.slice(0, 10)}`
                : "Por sincronizar"}
            </span>
          </div>

          {/* Profile Header */}
          <div className="px-4 pt-4 pb-3 space-y-3">
            <div className="flex items-center gap-5">
              <div className="h-[74px] w-[74px] rounded-full p-[2px] bg-gradient-to-tr from-[#d3a548] to-[#f7d46d]/40 shrink-0">
                <div className="h-full w-full rounded-full bg-[#101211] overflow-hidden flex items-center justify-center border-2 border-[#050606]">
                  {profile.profilePictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.profilePictureUrl}
                      alt={profile.username}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-bold text-[#f7d46d]">XM</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 flex-1 text-center gap-2">
                <div>
                  <p className="text-base font-bold text-[#f1ede5] tabular-nums">{totalPostsCounter}</p>
                  <p className="text-[11px] text-[#a9adae]">Publicações</p>
                </div>
                <div>
                  <p className="text-base font-bold text-[#f1ede5] tabular-nums">
                    {profile.followersCount.toLocaleString("pt-PT")}
                  </p>
                  <p className="text-[11px] text-[#a9adae]">Seguidores</p>
                </div>
                <div>
                  <p className="text-base font-bold text-[#f1ede5] tabular-nums">
                    {profile.followsCount.toLocaleString("pt-PT")}
                  </p>
                  <p className="text-[11px] text-[#a9adae]">A seguir</p>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <p className="text-xs font-bold text-[#f1ede5]">{activeName}</p>
              <p className="text-xs text-[#d9d5cc] whitespace-pre-line leading-relaxed">{activeBio}</p>
              {activeWebsite ? (
                <p className="inline-flex items-center gap-1 text-xs font-medium text-[#9cc6ff] truncate max-w-full">
                  <Link2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{activeWebsite.replace(/^https?:\/\//, "")}</span>
                </p>
              ) : null}
            </div>

            {/* Action Buttons Mock */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg bg-white/[0.08] py-1.5 text-center text-xs font-semibold text-[#f1ede5]">
                Seguir
              </div>
              <div className="rounded-lg bg-white/[0.08] py-1.5 text-center text-xs font-semibold text-[#f1ede5]">
                Mensagem
              </div>
            </div>

            {/* Highlights Row */}
            <div className="flex items-start gap-3 overflow-x-auto py-2 no-scrollbar">
              {highlights.map((hl) => (
                <div key={hl.id} className="flex flex-col items-center gap-1 shrink-0 w-14">
                  <div className="h-12 w-12 rounded-full border border-[#d3a548]/45 bg-[#101211] flex items-center justify-center p-0.5">
                    <div className="h-full w-full rounded-full bg-[#171A18] flex items-center justify-center">
                      <span className="text-[10px] font-semibold tracking-wider text-[#f7d46d] uppercase">
                        {hl.title.slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#d9d5cc] truncate w-full text-center">
                    {hl.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Tabs */}
          <div className="grid grid-cols-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setGridFilter("all")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer",
                gridFilter === "all"
                  ? "border-[#f7d46d] text-[#f1ede5]"
                  : "border-transparent text-[#8a9092]"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
              Grelha 3:4
            </button>
            <button
              type="button"
              onClick={() => setGridFilter("reels")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer",
                gridFilter === "reels"
                  ? "border-[#f7d46d] text-[#f1ede5]"
                  : "border-transparent text-[#8a9092]"
              )}
            >
              <Film className="h-4 w-4" />
              Reels
            </button>
          </div>

          {/* 3-Column 3:4 Grid */}
          {visibleGridItems.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-2">
              <p className="text-sm font-medium text-[#f1ede5]">
                Ainda não há publicações nesta grelha.
              </p>
              <p className="text-xs text-[#8a9092]">
                Sincronize o @x_motion.wrap ou importe o plano de dezembro para pré-visualizar o feed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] bg-[#050606]">
              {visibleGridItems.map((item) => {
                const isPlanned = item.kind === "planned";
                const isReel = isPlanned
                  ? item.post.format === "reel"
                  : item.published.mediaProductType === "REELS";
                const isCarousel = isPlanned
                  ? item.post.format === "carousel"
                  : item.published.mediaType === "CAROUSEL_ALBUM";

                return (
                  <div
                    key={item.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectGridItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectGridItem(item);
                      }
                    }}
                    className="group relative aspect-[3/4] bg-[#101211] overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d3a548]"
                  >
                    <GridTileImage
                      url={item.coverUrl}
                      alt={isPlanned ? item.post.title : item.published.caption.slice(0, 60) || "Post"}
                      fallbackTitle={
                        isPlanned
                          ? item.post.hook || item.post.title
                          : item.published.caption.split("\n")[0] || "Publicação Instagram"
                      }
                    />

                    {/* Top-right indicators */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                      {item.isPinned ? (
                        <span className="rounded bg-black/75 p-1 text-[#f7d46d]" title="Fixado">
                          <Pin className="h-2.5 w-2.5" />
                        </span>
                      ) : null}
                      {isReel ? (
                        <span className="rounded bg-black/75 p-1 text-white" title="Reel">
                          <Film className="h-2.5 w-2.5" />
                        </span>
                      ) : null}
                      {isCarousel ? (
                        <span className="rounded bg-black/75 p-1 text-white" title="Carrossel">
                          <Layers className="h-2.5 w-2.5" />
                        </span>
                      ) : null}
                    </div>

                    {/* Top-left Planned Status Badge */}
                    {isPlanned ? (
                      <span
                        className={cn(
                          "absolute top-1.5 left-1.5 rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                          STATUS_BADGE_CLASSES[item.post.status]
                        )}
                      >
                        {SOCIAL_STATUS_LABELS[item.post.status]}
                      </span>
                    ) : (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white/85">
                        {item.published.publishedAt.slice(5, 10)}
                      </span>
                    )}

                    {/* Planned Reorder Controls (visible on hover/focus) */}
                    {isPlanned && !item.isPinned ? (
                      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={isReordering}
                          onClick={(e) => handleMoveGrid(e, item.post.id, "earlier")}
                          className="rounded bg-black/80 p-1 text-[#f1ede5] hover:text-[#f7d46d] cursor-pointer"
                          aria-label="Mover para posição anterior na grelha"
                          title="Mover para a esquerda / topo"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isReordering}
                          onClick={(e) => handleMoveGrid(e, item.post.id, "later")}
                          className="rounded bg-black/80 p-1 text-[#f1ede5] hover:text-[#f7d46d] cursor-pointer"
                          aria-label="Mover para posição seguinte na grelha"
                          title="Mover para a direita"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null}

                    {/* Format hover hint */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                      {isPlanned ? (
                        <span className="text-[9px] text-white/90 truncate">
                          {SOCIAL_FORMAT_LABELS[item.post.format]}
                          {item.post.scheduledFor ? ` · ${item.post.scheduledFor.slice(5)}` : ""}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Bio / Name / Link / Highlights Simulator Editor */}
      <form
        onSubmit={handleSaveSimulatedProfile}
        className="xl:col-span-5 rounded-2xl border border-white/[0.08] bg-[#0b0d0e] p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-bold text-[#f1ede5]">Simular Vitrine do Perfil</h2>
            <p className="text-xs text-[#8a9092] mt-0.5">
              Teste o Nome pesquisável, Bio, Link e Destaques antes de atualizar na app do Instagram.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyBio}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-[#f1ede5] hover:bg-white/[0.08] cursor-pointer shrink-0"
          >
            {bioCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {bioCopied ? "Copiada" : "Copiar Bio"}
          </button>
        </div>

        {profileError ? (
          <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
            {profileError}
          </div>
        ) : null}
        {profileNotice ? (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
            {profileNotice}
          </div>
        ) : null}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[#a9adae]">Nome pesquisável</label>
            <span className="text-[11px] text-[#8a9092]">
              {simName.length}/{INSTAGRAM_NAME_MAX_CHARS}
            </span>
          </div>
          <input
            type="text"
            value={simName}
            maxLength={INSTAGRAM_NAME_MAX_CHARS}
            onChange={(e) => setSimName(e.target.value)}
            className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[#a9adae]">Bio simulada</label>
            <span
              className={cn(
                "text-[11px]",
                simBio.length > INSTAGRAM_BIO_MAX_CHARS ? "text-red-400" : "text-[#8a9092]"
              )}
            >
              {simBio.length}/{INSTAGRAM_BIO_MAX_CHARS}
            </span>
          </div>
          <textarea
            rows={4}
            value={simBio}
            onChange={(e) => setSimBio(e.target.value)}
            className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#a9adae] mb-1">Link da Bio</label>
          <input
            type="url"
            value={simWebsite}
            onChange={(e) => setSimWebsite(e.target.value)}
            placeholder="https://x-flow-b8rt.vercel.app/ig"
            className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
          />
        </div>

        <div className="space-y-2 pt-1">
          <label className="block text-xs font-medium text-[#a9adae]">Destaques (até 7)</label>
          <div className="space-y-2">
            {highlights.map((hl, idx) => (
              <div key={hl.id} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  value={hl.title}
                  maxLength={18}
                  placeholder="Título"
                  onChange={(e) => {
                    const next = [...highlights];
                    next[idx] = { ...hl, title: e.target.value };
                    setHighlights(next);
                  }}
                  className="col-span-5 rounded-lg border border-white/[0.1] bg-[#080a0b] px-2.5 py-1.5 text-xs text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
                />
                <input
                  type="text"
                  value={hl.subtitle}
                  maxLength={60}
                  placeholder="Descrição"
                  onChange={(e) => {
                    const next = [...highlights];
                    next[idx] = { ...hl, subtitle: e.target.value };
                    setHighlights(next);
                  }}
                  className="col-span-7 rounded-lg border border-white/[0.1] bg-[#080a0b] px-2.5 py-1.5 text-xs text-[#a9adae] focus:border-[#d3a548] focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="inline-flex items-center gap-2 rounded-lg bg-[#d3a548] px-4 py-2 text-xs font-semibold text-[#050606] hover:bg-[#e1b75f] disabled:opacity-50 cursor-pointer"
          >
            {isSavingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Guardar vitrine simulada
          </button>
        </div>
      </form>
    </div>
  );
}
