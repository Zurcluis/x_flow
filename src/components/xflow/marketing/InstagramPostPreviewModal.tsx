"use client";

import React, { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Film,
  Heart,
  Layers,
  MessageCircle,
  Pencil,
  Pin,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  SOCIAL_FORMAT_LABELS,
  SOCIAL_PILLAR_LABELS,
  SOCIAL_STATUS_LABELS,
  type SimulatedGridItem,
  type SocialPostRecord,
} from "@/domains/marketing/types";
import { cn } from "@/lib/utils";

interface InstagramPostPreviewModalProps {
  item: SimulatedGridItem | null;
  username: string;
  avatarUrl: string | null;
  onClose: () => void;
  onEditPlanned: (post: SocialPostRecord) => void;
  onMarkPublished: (post: SocialPostRecord) => void;
}

export function InstagramPostPreviewModal({
  item,
  username,
  avatarUrl,
  onClose,
  onEditPlanned,
  onMarkPublished,
}: InstagramPostPreviewModalProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const isPlanned = item.kind === "planned";
  const slides: Array<{ url: string; alt: string }> = isPlanned
    ? item.post.mediaItems.map((m) => ({ url: m.dataUrl, alt: m.alt || item.post.title }))
    : item.published.children.length > 0
      ? item.published.children
          .map((c, idx) => ({
            url: c.thumbnailUrl || c.mediaUrl || "",
            alt: `Slide ${idx + 1}`,
          }))
          .filter((s) => Boolean(s.url))
      : item.coverUrl
        ? [{ url: item.coverUrl, alt: item.published.caption.slice(0, 60) || "Publicação" }]
        : [];

  const safeIndex = slides.length > 0 ? Math.min(slideIndex, slides.length - 1) : 0;
  const currentSlide = slides[safeIndex] ?? null;

  const captionText = isPlanned ? item.post.caption : item.published.caption;

  const handleCopyCaption = async () => {
    if (!captionText) return;
    await navigator.clipboard.writeText(captionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadSlides = () => {
    if (!isPlanned) return;
    item.post.mediaItems.forEach((media, index) => {
      const a = document.createElement("a");
      a.href = media.dataUrl;
      const ext = media.mimeType.includes("png") ? "png" : media.mimeType.includes("webp") ? "webp" : "jpg";
      const safeTitle = item.post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32);
      a.download = `${safeTitle || "xmotion"}-${index + 1}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Pré-visualização de publicação"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0b0d0e] shadow-2xl grid grid-cols-1 md:grid-cols-2">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-black/70 p-2 text-[#f1ede5] hover:bg-black cursor-pointer"
          aria-label="Fechar pré-visualização"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left: 3:4 Media Preview */}
        <div className="relative bg-[#050606] flex items-center justify-center min-h-[340px] md:min-h-[520px] border-b md:border-b-0 md:border-r border-white/[0.08]">
          {currentSlide ? (
            <div className="relative w-full aspect-[3/4] max-h-[540px] overflow-hidden flex items-center justify-center bg-[#080a0b]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSlide.url}
                alt={currentSlide.alt}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                    disabled={safeIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-1.5 text-white disabled:opacity-30 cursor-pointer"
                    aria-label="Slide anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
                    disabled={safeIndex === slides.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-1.5 text-white disabled:opacity-30 cursor-pointer"
                    aria-label="Slide seguinte"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1">
                    {slides.map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          idx === safeIndex ? "bg-[#f7d46d]" : "bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full aspect-[3/4] max-h-[540px] p-6 flex flex-col justify-between bg-gradient-to-br from-[#101211] via-[#141715] to-[#080a0b]">
              <div className="flex items-center justify-between text-xs text-[#d3a548] uppercase tracking-widest">
                <span>{isPlanned ? SOCIAL_FORMAT_LABELS[item.post.format] : "Instagram"}</span>
                <span>{isPlanned ? SOCIAL_PILLAR_LABELS[item.post.pillar] : ""}</span>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-[#8a9092]">
                  Sem imagem carregada (pré-visualização editorial)
                </p>
                <h3 className="text-xl font-bold text-[#f1ede5] leading-snug">
                  {isPlanned ? item.post.hook || item.post.title : "Publicação Instagram"}
                </h3>
                {isPlanned && item.post.cta && (
                  <p className="text-xs text-[#f7d46d] border-l-2 border-[#d3a548] pl-3">
                    {item.post.cta}
                  </p>
                )}
              </div>
              <div className="text-[11px] tracking-[0.2em] uppercase text-[#8a9092]">
                X-MOTION · BARCELOS
              </div>
            </div>
          )}
        </div>

        {/* Right: Instagram Header, Caption & Actions */}
        <div className="flex flex-col justify-between p-5 gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
              <div className="h-9 w-9 rounded-full bg-[#171A18] border border-[#d3a548]/40 overflow-hidden flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={username}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#f7d46d]">XM</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#f1ede5]">@{username}</span>
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded bg-[#1f1b14] border border-[#d3a548]/40 px-1.5 py-0.5 text-[10px] font-semibold text-[#f7d46d]">
                      <Pin className="h-2.5 w-2.5" /> Fixado
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8a9092]">
                  {isPlanned
                    ? `${SOCIAL_FORMAT_LABELS[item.post.format]} · ${SOCIAL_STATUS_LABELS[item.post.status]}${item.post.scheduledFor ? ` · ${item.post.scheduledFor}` : ""}`
                    : `Publicado em ${item.published.publishedAt.slice(0, 10)}`}
                </p>
              </div>
            </div>

            {isPlanned && item.post.hook && (
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.07] p-3">
                <p className="text-[11px] uppercase tracking-wider text-[#d3a548] font-semibold mb-1">
                  Gancho (Capa / 0-3s)
                </p>
                <p className="text-sm text-[#f1ede5]">{item.post.hook}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-[#8a9092] font-semibold">
                Legenda
              </p>
              <div className="max-h-56 overflow-y-auto rounded-lg bg-[#080a0b] border border-white/[0.06] p-3 text-sm text-[#d9d5cc] whitespace-pre-wrap leading-relaxed">
                {captionText || "Sem legenda definida."}
              </div>
            </div>

            {isPlanned && item.post.scriptNotes && (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-[#8a9092] font-semibold">
                  Notas de captação / slides
                </p>
                <p className="text-xs text-[#a9adae] whitespace-pre-wrap">{item.post.scriptNotes}</p>
              </div>
            )}

            {isPlanned ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 border",
                    item.post.ownerConsent
                      ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                      : "bg-amber-950/50 border-amber-500/30 text-amber-300"
                  )}
                >
                  {item.post.ownerConsent ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}
                  {item.post.ownerConsent
                    ? "Autorização do proprietário confirmada"
                    : "Falta confirmar autorização"}
                </span>
                {item.post.format === "reel" && (
                  <span className="inline-flex items-center gap-1 text-[#8a9092]">
                    <Film className="h-3.5 w-3.5" /> Vídeo publicado na app Instagram
                  </span>
                )}
                {item.post.format === "carousel" && (
                  <span className="inline-flex items-center gap-1 text-[#8a9092]">
                    <Layers className="h-3.5 w-3.5" /> {item.post.mediaItems.length} slides
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-5 text-sm text-[#a9adae] pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-[#d3a548]" /> {item.published.likeCount} gostos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-[#d3a548]" /> {item.published.commentsCount} comentários
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.08]">
            {captionText && (
              <button
                type="button"
                onClick={handleCopyCaption}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#f1ede5] hover:bg-white/[0.08] cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Legenda copiada" : "Copiar legenda"}
              </button>
            )}

            {isPlanned && item.post.mediaItems.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadSlides}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#f1ede5] hover:bg-white/[0.08] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Descarregar imagens ({item.post.mediaItems.length})
              </button>
            )}

            {isPlanned ? (
              <>
                <button
                  type="button"
                  onClick={() => onEditPlanned(item.post)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#d3a548] px-3 py-2 text-xs font-semibold text-[#050606] hover:bg-[#e1b75f] cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar peça
                </button>
                {item.post.status !== "published" && (
                  <button
                    type="button"
                    onClick={() => onMarkPublished(item.post)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-950/70 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Marcar publicado
                  </button>
                )}
              </>
            ) : (
              item.published.permalink && (
                <a
                  href={item.published.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#d3a548] px-3 py-2 text-xs font-semibold text-[#050606] hover:bg-[#e1b75f]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir no Instagram
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
