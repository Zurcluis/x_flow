"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ListTodo,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import {
  importDecemberPlanAction,
  syncMarketingInstagramAction,
  updateSocialPostAction,
} from "@/app/actions/marketing";
import { InstagramPostPreviewModal } from "@/components/xflow/marketing/InstagramPostPreviewModal";
import { InstagramSimulator } from "@/components/xflow/marketing/InstagramSimulator";
import { MarketingPostModal } from "@/components/xflow/marketing/MarketingPostModal";
import { MonthlyCalendar } from "@/components/xflow/marketing/MonthlyCalendar";
import {
  SOCIAL_FORMAT_LABELS,
  SOCIAL_PILLAR_LABELS,
  SOCIAL_STATUS_LABELS,
  type SimulatedGridItem,
  type SocialFormat,
  type SocialInstagramProfile,
  type SocialInstagramPublishedPost,
  type SocialPostRecord,
  type SocialPostStatus,
} from "@/domains/marketing/types";
import type { MarketingVehicleOption } from "@/server/marketing/repository";
import { cn } from "@/lib/utils";

interface MarketingViewProps {
  initialProfile: SocialInstagramProfile;
  initialPublishedPosts: SocialInstagramPublishedPost[];
  initialPlannedPosts: SocialPostRecord[];
  vehicles: MarketingVehicleOption[];
  aiEnabled: boolean;
  autoSyncNeeded: boolean;
}

export function MarketingView({
  initialProfile,
  initialPublishedPosts,
  initialPlannedPosts,
  vehicles,
  aiEnabled,
  autoSyncNeeded,
}: MarketingViewProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [publishedPosts, setPublishedPosts] = useState(initialPublishedPosts);
  const [plannedPosts, setPlannedPosts] = useState(initialPlannedPosts);
  const [activeTab, setActiveTab] = useState<"simulator" | "calendar" | "list">("simulator");

  const [statusFilter, setStatusFilter] = useState<SocialPostStatus | "all">("all");
  const [formatFilter, setFormatFilter] = useState<SocialFormat | "all">("all");

  const [previewItem, setPreviewItem] = useState<SimulatedGridItem | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPostRecord | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | null>(null);

  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSyncing, startSync] = useTransition();
  const [isImporting, startImport] = useTransition();
  const autoSyncedRef = useRef(false);

  const handleSync = (silent = false) => {
    if (!silent) setBanner(null);
    startSync(async () => {
      const res = await syncMarketingInstagramAction();
      if (!res.ok) {
        if (!silent) {
          setBanner({ type: "error", text: res.error });
        }
        return;
      }
      setProfile(res.profile);
      setPublishedPosts(res.publishedPosts);
      if (!silent) {
        setBanner({
          type: "success",
          text: `Sincronizado @${res.profile.username}: ${res.publishedPosts.length} publicações reais carregadas.`,
        });
      }
    });
  };

  useEffect(() => {
    if (autoSyncNeeded && !autoSyncedRef.current) {
      autoSyncedRef.current = true;
      startSync(async () => {
        const res = await syncMarketingInstagramAction();
        if (res.ok) {
          setProfile(res.profile);
          setPublishedPosts(res.publishedPosts);
        }
      });
    }
  }, [autoSyncNeeded]);

  const handleImportDecember = () => {
    setBanner(null);
    startImport(async () => {
      const res = await importDecemberPlanAction();
      if (!res.ok) {
        setBanner({ type: "error", text: res.error });
        return;
      }
      setPlannedPosts(res.posts);
      setBanner({
        type: "success",
        text:
          res.insertedCount > 0
            ? `${res.insertedCount} publicações do plano de dezembro adicionadas.`
            : "O plano de dezembro já está carregado nesta organização.",
      });
    });
  };

  const openCreateModal = (dateKey?: string) => {
    setEditingPost(null);
    setDefaultDate(dateKey ?? null);
    setEditorOpen(true);
  };

  const openEditModal = (post: SocialPostRecord) => {
    setPreviewItem(null);
    setEditingPost(post);
    setDefaultDate(null);
    setEditorOpen(true);
  };

  const handleMarkPublished = async (post: SocialPostRecord) => {
    const res = await updateSocialPostAction(post.id, {
      vehicleId: post.vehicleId,
      title: post.title,
      format: post.format,
      pillar: post.pillar,
      status: "published",
      scheduledFor: post.scheduledFor,
      scheduledTime: post.scheduledTime,
      isPinned: post.isPinned,
      hook: post.hook,
      caption: post.caption,
      scriptNotes: post.scriptNotes,
      cta: post.cta,
      mediaItems: post.mediaItems,
      ownerConsent: post.ownerConsent,
      publishedPermalink: post.publishedPermalink,
    });
    if (!res.ok) {
      setBanner({ type: "error", text: res.error });
      return;
    }
    setPlannedPosts((prev) => prev.map((p) => (p.id === post.id ? res.post : p)));
    setPreviewItem(null);
    setBanner({ type: "success", text: `"${post.title}" marcada como publicada.` });
  };

  const hasDecemberPosts = useMemo(
    () => plannedPosts.some((p) => p.scheduledFor?.startsWith("2026-12-")),
    [plannedPosts]
  );

  const filteredListPosts = useMemo(() => {
    return plannedPosts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (formatFilter !== "all" && p.format !== formatFilter) return false;
      return true;
    });
  }, [plannedPosts, statusFilter, formatFilter]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d3a548]">
            Social Studio · @{profile.username}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5] mt-1">
            Marketing e Simulador Instagram
          </h1>
          <p className="text-sm text-[#a9adae] mt-1">
            Pré-visualize o feed futuro por cima das publicações reais, organize legendas e construa o calendário mensal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSync(false)}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#0b0d0e] px-3.5 py-2 text-xs font-semibold text-[#f1ede5] hover:border-[#d3a548]/50 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-[#d3a548]", isSyncing && "animate-spin")} />
            {isSyncing ? "A sincronizar..." : "Sincronizar Instagram"}
          </button>

          {!hasDecemberPosts ? (
            <button
              type="button"
              onClick={handleImportDecember}
              disabled={isImporting}
              className="inline-flex items-center gap-2 rounded-lg border border-[#d3a548]/40 bg-[#1f1b14] px-3.5 py-2 text-xs font-semibold text-[#f7d46d] hover:bg-[#2a2419] disabled:opacity-50 cursor-pointer"
            >
              {isImporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Carregar Plano Dezembro (18)
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#d3a548] px-4 py-2 text-xs font-semibold text-[#050606] hover:bg-[#e1b75f] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nova publicação
          </button>
        </div>
      </div>

      {banner ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-2",
            banner.type === "success"
              ? "border-emerald-500/35 bg-emerald-950/35 text-emerald-200"
              : "border-red-500/35 bg-red-950/35 text-red-200"
          )}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      ) : null}

      {profile.lastError && !banner ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-2.5 text-xs text-amber-200">
          Último aviso de sincronização Instagram: {profile.lastError}
        </div>
      ) : null}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="inline-flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer",
              activeTab === "simulator"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
                : "text-[#a9adae] hover:bg-white/[0.04] hover:text-[#f1ede5]"
            )}
          >
            <Smartphone className="h-4 w-4" />
            Simulador Instagram
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer",
              activeTab === "calendar"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
                : "text-[#a9adae] hover:bg-white/[0.04] hover:text-[#f1ede5]"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Calendário Mensal
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer",
              activeTab === "list"
                ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40"
                : "text-[#a9adae] hover:bg-white/[0.04] hover:text-[#f1ede5]"
            )}
          >
            <ListTodo className="h-4 w-4" />
            Fila e Produção ({plannedPosts.length})
          </button>
        </div>

        <span className="text-xs text-[#8a9092]">
          Publicação final feita por si na app do Instagram (ou agendada em fase seguinte).
        </span>
      </div>

      {/* Active View */}
      {activeTab === "simulator" ? (
        <InstagramSimulator
          profile={profile}
          publishedPosts={publishedPosts}
          plannedPosts={plannedPosts}
          onProfileUpdated={(updated) => setProfile(updated)}
          onPostsReordered={(reordered) => setPlannedPosts(reordered)}
          onSelectGridItem={(item) => setPreviewItem(item)}
          onCreatePost={() => openCreateModal()}
        />
      ) : activeTab === "calendar" ? (
        <MonthlyCalendar
          posts={plannedPosts}
          initialYear={2026}
          initialMonthZeroBased={11}
          onSelectPost={(post) =>
            setPreviewItem({
              kind: "planned",
              key: `planned-${post.id}`,
              post,
              coverUrl: post.mediaItems[0]?.dataUrl ?? null,
              isPinned: post.isPinned,
            })
          }
          onCreateForDate={(dateKey) => openCreateModal(dateKey)}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SocialPostStatus | "all")}
              className="rounded-lg border border-white/[0.1] bg-[#0b0d0e] px-3 py-1.5 text-xs text-[#f1ede5]"
            >
              <option value="all">Todos os estados</option>
              {(Object.keys(SOCIAL_STATUS_LABELS) as SocialPostStatus[]).map((key) => (
                <option key={key} value={key}>
                  {SOCIAL_STATUS_LABELS[key]}
                </option>
              ))}
            </select>

            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as SocialFormat | "all")}
              className="rounded-lg border border-white/[0.1] bg-[#0b0d0e] px-3 py-1.5 text-xs text-[#f1ede5]"
            >
              <option value="all">Todos os formatos</option>
              {(Object.keys(SOCIAL_FORMAT_LABELS) as SocialFormat[]).map((key) => (
                <option key={key} value={key}>
                  {SOCIAL_FORMAT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          {filteredListPosts.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0d0e] p-8 text-center space-y-3">
              <p className="text-sm font-medium text-[#f1ede5]">
                Nenhuma peça corresponde aos filtros atuais.
              </p>
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#d3a548] px-4 py-2 text-xs font-semibold text-[#050606] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar publicação
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredListPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0b0d0e] p-4 flex flex-col justify-between gap-3 hover:border-[#d3a548]/40 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded bg-[#1f1b14] border border-[#d3a548]/35 px-2 py-0.5 font-semibold text-[#f7d46d]">
                        {SOCIAL_FORMAT_LABELS[post.format]}
                      </span>
                      <span className="text-[#8a9092]">
                        {post.scheduledFor ? `${post.scheduledFor}${post.scheduledTime ? ` · ${post.scheduledTime}` : ""}` : "Sem data"}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#f1ede5] leading-snug">{post.title}</h3>
                    {post.hook ? (
                      <p className="text-xs text-[#a9adae] line-clamp-2">{post.hook}</p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8a9092]">
                      <span>{SOCIAL_PILLAR_LABELS[post.pillar]}</span>
                      <span>·</span>
                      <span>{SOCIAL_STATUS_LABELS[post.status]}</span>
                      {post.vehicleLabel ? (
                        <>
                          <span>·</span>
                          <span className="text-[#d3a548]">{post.vehicleLabel}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px]",
                        post.ownerConsent ? "text-emerald-300" : "text-amber-300"
                      )}
                    >
                      {post.ownerConsent ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                      {post.ownerConsent ? "Autorizado" : "Sem autorização"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewItem({
                            kind: "planned",
                            key: `planned-${post.id}`,
                            post,
                            coverUrl: post.mediaItems[0]?.dataUrl ?? null,
                            isPinned: post.isPinned,
                          })
                        }
                        className="rounded-lg border border-white/[0.12] px-2.5 py-1.5 text-xs font-medium text-[#f1ede5] hover:bg-white/[0.06] cursor-pointer"
                      >
                        Pré-ver
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(post)}
                        className="rounded-lg bg-[#d3a548] px-2.5 py-1.5 text-xs font-semibold text-[#050606] hover:bg-[#e1b75f] cursor-pointer"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <InstagramPostPreviewModal
        item={previewItem}
        username={profile.username}
        avatarUrl={profile.profilePictureUrl}
        onClose={() => setPreviewItem(null)}
        onEditPlanned={openEditModal}
        onMarkPublished={handleMarkPublished}
      />

      {editorOpen ? (
        <MarketingPostModal
          key={editingPost?.id ?? defaultDate ?? "new"}
          open={editorOpen}
          editingPost={editingPost}
          defaultDate={defaultDate}
          vehicles={vehicles}
          aiEnabled={aiEnabled}
          onClose={() => setEditorOpen(false)}
          onSaved={(savedPost, isNew) => {
            setPlannedPosts((prev) =>
              isNew ? [savedPost, ...prev] : prev.map((p) => (p.id === savedPost.id ? savedPost : p))
            );
            setEditorOpen(false);
            setBanner({
              type: "success",
              text: isNew ? `Publicação "${savedPost.title}" criada.` : `Publicação "${savedPost.title}" atualizada.`,
            });
          }}
          onDeleted={(deletedId) => {
            setPlannedPosts((prev) => prev.filter((p) => p.id !== deletedId));
            setEditorOpen(false);
            setBanner({ type: "success", text: "Publicação eliminada." });
          }}
        />
      ) : null}

      {hasDecemberPosts ? (
        <div className="flex items-center justify-end text-[11px] text-[#8a9092] gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Plano de dezembro carregado ({plannedPosts.filter((p) => p.scheduledFor?.startsWith("2026-12-")).length} peças).
        </div>
      ) : null}
    </div>
  );
}
