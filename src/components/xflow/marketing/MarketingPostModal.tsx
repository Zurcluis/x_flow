"use client";

import React, { useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Pin,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  createSocialPostAction,
  deleteSocialPostAction,
  draftSocialPostAiAction,
  updateSocialPostAction,
} from "@/app/actions/marketing";
import {
  INSTAGRAM_CAPTION_MAX_CHARS,
  MAX_CAROUSEL_SLIDES,
} from "@/domains/marketing/rules";
import {
  SOCIAL_FORMAT_LABELS,
  SOCIAL_PILLAR_LABELS,
  SOCIAL_STATUS_LABELS,
  type SocialFormat,
  type SocialMediaItem,
  type SocialPillar,
  type SocialPostRecord,
  type SocialPostStatus,
} from "@/domains/marketing/types";
import type { MarketingVehicleOption } from "@/server/marketing/repository";

interface MarketingPostModalProps {
  open: boolean;
  editingPost: SocialPostRecord | null;
  defaultDate?: string | null;
  vehicles: MarketingVehicleOption[];
  aiEnabled: boolean;
  onClose: () => void;
  onSaved: (post: SocialPostRecord, isNew: boolean) => void;
  onDeleted: (postId: string) => void;
}

const MAX_UPLOAD_DIMENSION = 1080;

async function compressUploadToDataUrl(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Ficheiro de imagem inválido."));
    image.src = rawUrl;
  });

  const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { dataUrl: rawUrl, mimeType: file.type || "image/jpeg" };
  }
  ctx.drawImage(img, 0, 0, width, height);
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.82),
    mimeType: "image/jpeg",
  };
}

export function MarketingPostModal({
  open,
  editingPost,
  defaultDate,
  vehicles,
  aiEnabled,
  onClose,
  onSaved,
  onDeleted,
}: MarketingPostModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(editingPost?.title ?? "");
  const [format, setFormat] = useState<SocialFormat>(editingPost?.format ?? "reel");
  const [pillar, setPillar] = useState<SocialPillar>(editingPost?.pillar ?? "process");
  const [status, setStatus] = useState<SocialPostStatus>(editingPost?.status ?? "idea");
  const [scheduledFor, setScheduledFor] = useState(
    editingPost?.scheduledFor ?? defaultDate ?? ""
  );
  const [scheduledTime, setScheduledTime] = useState(editingPost?.scheduledTime ?? "18:00");
  const [vehicleId, setVehicleId] = useState(editingPost?.vehicleId ?? "");
  const [isPinned, setIsPinned] = useState(editingPost?.isPinned ?? false);
  const [hook, setHook] = useState(editingPost?.hook ?? "");
  const [caption, setCaption] = useState(editingPost?.caption ?? "");
  const [scriptNotes, setScriptNotes] = useState(editingPost?.scriptNotes ?? "");
  const [cta, setCta] = useState(editingPost?.cta ?? "");
  const [ownerConsent, setOwnerConsent] = useState(editingPost?.ownerConsent ?? false);
  const [publishedPermalink, setPublishedPermalink] = useState(
    editingPost?.publishedPermalink ?? ""
  );
  const [mediaItems, setMediaItems] = useState<SocialMediaItem[]>(editingPost?.mediaItems ?? []);

  if (!open) return null;

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_CAROUSEL_SLIDES - mediaItems.length;
    if (remaining <= 0) {
      setError(`Máximo de ${MAX_CAROUSEL_SLIDES} imagens por publicação.`);
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const nextItems: SocialMediaItem[] = [...mediaItems];
      for (const file of files.slice(0, remaining)) {
        const compressed = await compressUploadToDataUrl(file);
        nextItems.push({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl: compressed.dataUrl,
          mimeType: compressed.mimeType,
          alt: title || file.name.slice(0, 60),
        });
      }
      setMediaItems(nextItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const moveSlide = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= mediaItems.length) return;
    const copy = [...mediaItems];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setMediaItems(copy);
  };

  const handleAiDraft = async () => {
    if (!title.trim()) {
      setError("Escreva primeiro o título ou tema para a IA preparar o rascunho.");
      return;
    }
    setError(null);
    setIsAiLoading(true);
    try {
      const vehicleLabel = vehicles.find((v) => v.id === vehicleId)?.label ?? null;
      const res = await draftSocialPostAiAction({
        title,
        format,
        pillar,
        vehicleLabel,
        existingHook: hook,
        existingCaption: caption,
      });
      if (!res.ok) {
        setError(res.error);
      } else {
        setHook(res.hook);
        setCaption(res.caption);
        setCta(res.cta);
        if (res.scriptNotes) setScriptNotes(res.scriptNotes);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      vehicleId: vehicleId || null,
      title,
      format,
      pillar,
      status,
      scheduledFor: scheduledFor || null,
      scheduledTime: scheduledFor ? scheduledTime || null : null,
      isPinned: format !== "story" ? isPinned : false,
      hook,
      caption,
      scriptNotes,
      cta,
      mediaItems,
      ownerConsent,
      publishedPermalink: publishedPermalink || null,
    };

    startTransition(async () => {
      const res = editingPost
        ? await updateSocialPostAction(editingPost.id, payload)
        : await createSocialPostAction(payload);

      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSaved(res.post, !editingPost);
    });
  };

  const handleDelete = () => {
    if (!editingPost) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteSocialPostAction(editingPost.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onDeleted(editingPost.id);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={editingPost ? "Editar publicação" : "Nova publicação"}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0b0d0e] p-5 sm:p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-lg font-bold text-[#f1ede5]">
              {editingPost ? "Editar publicação" : "Nova publicação"}
            </h2>
            <p className="text-xs text-[#8a9092]">
              Pré-visualização na grelha e calendário de conteúdo da X-Motion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8a9092] hover:bg-white/[0.06] hover:text-[#f1ede5] cursor-pointer"
            aria-label="Fechar editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Images / Covers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#a9adae]">
              Capa / Slides ({mediaItems.length}/{MAX_CAROUSEL_SLIDES})
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || mediaItems.length >= MAX_CAROUSEL_SLIDES}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d3a548]/40 bg-[#1f1b14] px-3 py-1.5 text-xs font-semibold text-[#f7d46d] hover:bg-[#2a2419] disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              Carregar imagens
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={format === "carousel"}
              onChange={handleFilesSelected}
              className="hidden"
            />
          </div>

          {mediaItems.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {mediaItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-white/[0.1] bg-[#050606]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.dataUrl} alt={item.alt || "Slide"} className="h-full w-full object-cover" />
                  <span className="absolute top-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-[#f7d46d]">
                    {idx === 0 ? "Capa" : `${idx + 1}`}
                  </span>
                  <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveSlide(idx, -1)}
                        disabled={idx === 0}
                        className="rounded bg-black/75 p-1 text-white disabled:opacity-30 cursor-pointer"
                        aria-label="Mover slide para trás"
                      >
                        <ArrowUp className="h-3 w-3 -rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(idx, 1)}
                        disabled={idx === mediaItems.length - 1}
                        className="rounded bg-black/75 p-1 text-white disabled:opacity-30 cursor-pointer"
                        aria-label="Mover slide para a frente"
                      >
                        <ArrowDown className="h-3 w-3 -rotate-90" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded bg-red-950/90 p-1 text-red-200 hover:bg-red-800 cursor-pointer"
                      aria-label="Remover imagem"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Core Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#a9adae] mb-1">Título interno / Pauta *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Reel: Porque não damos preço por fotografia"
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a9adae] mb-1">Formato</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as SocialFormat)}
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
            >
              {(Object.keys(SOCIAL_FORMAT_LABELS) as SocialFormat[]).map((key) => (
                <option key={key} value={key}>
                  {SOCIAL_FORMAT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a9adae] mb-1">Pilar</label>
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value as SocialPillar)}
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
            >
              {(Object.keys(SOCIAL_PILLAR_LABELS) as SocialPillar[]).map((key) => (
                <option key={key} value={key}>
                  {SOCIAL_PILLAR_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a9adae] mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SocialPostStatus)}
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
            >
              {(Object.keys(SOCIAL_STATUS_LABELS) as SocialPostStatus[]).map((key) => (
                <option key={key} value={key}>
                  {SOCIAL_STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a9adae] mb-1">Viatura da oficina (opcional)</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
            >
              <option value="">Sem viatura associada</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a9adae] mb-1">Data prevista</label>
            <input
              type="date"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a9adae] mb-1">Hora prevista</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              disabled={!scheduledFor}
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>

        {/* AI + Copy */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#a9adae]">
              Texto e Roteiro (pt-PT, sem emojis)
            </span>
            {aiEnabled && (
              <button
                type="button"
                onClick={handleAiDraft}
                disabled={isAiLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d3a548]/40 bg-[#1f1b14] px-3 py-1.5 text-xs font-semibold text-[#f7d46d] hover:bg-[#2a2419] disabled:opacity-50 cursor-pointer"
              >
                {isAiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Sugerir com X-Flow AI
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a9adae] mb-1">
              Gancho (texto da capa ou primeiros 3 segundos)
            </label>
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Ex.: A diferença entre um trabalho comum e um acabamento limpo decide-se a três centímetros."
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#a9adae]">Legenda Instagram</label>
              <span className="text-[11px] text-[#8a9092]">
                {caption.length}/{INSTAGRAM_CAPTION_MAX_CHARS}
              </span>
            </div>
            <textarea
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva a legenda em português europeu..."
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a9adae] mb-1">Chamada para ação (CTA único)</label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Ex.: Envia marca e modelo por DM"
                className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a9adae] mb-1">Link publicado (se aplicável)</label>
              <input
                type="url"
                value={publishedPermalink}
                onChange={(e) => setPublishedPermalink(e.target.value)}
                placeholder="https://www.instagram.com/..."
                className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a9adae] mb-1">
              Roteiro / Notas de gravação ou slides
            </label>
            <textarea
              rows={3}
              value={scriptNotes}
              onChange={(e) => setScriptNotes(e.target.value)}
              placeholder="Planos a gravar, som ambiente, sequência de slides..."
              className="w-full rounded-lg border border-white/[0.1] bg-[#080a0b] px-3 py-2 text-sm text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
            />
          </div>
        </div>

        {/* Governance toggles */}
        <div className="flex flex-wrap items-center gap-5 pt-1">
          <label className="inline-flex items-center gap-2 text-xs text-[#d9d5cc] cursor-pointer">
            <input
              type="checkbox"
              checked={ownerConsent}
              onChange={(e) => setOwnerConsent(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#080a0b] accent-[#d3a548]"
            />
            Autorização do proprietário confirmada (sem matrícula/PII sensível)
          </label>

          {format !== "story" && (
            <label className="inline-flex items-center gap-2 text-xs text-[#d9d5cc] cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-[#080a0b] accent-[#d3a548]"
              />
              <Pin className="h-3.5 w-3.5 text-[#d3a548]" />
              Simular como fixado no topo da grelha
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
          {editingPost ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-950/60 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-xs font-medium text-[#a9adae] hover:text-[#f1ede5] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d3a548] px-4 py-2 text-xs font-semibold text-[#050606] hover:bg-[#e1b75f] disabled:opacity-50 cursor-pointer"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingPost ? "Guardar alterações" : "Criar publicação"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
