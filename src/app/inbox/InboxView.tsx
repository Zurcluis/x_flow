"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  ImageOff,
  Inbox,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  analyzeInboxThreadAction,
  convertInboxThreadToCustomerAction,
  getInboxThreadDetailAction,
  linkInboxCustomerAction,
  listCustomerShareableQuotesAction,
  syncInboxAction,
  updateInboxThreadAction,
} from "@/app/actions/inbox";
import { InboxReplyComposer } from "@/components/xflow/inbox/InboxReplyComposer";
import {
  CATEGORY_LABELS,
  CHANNEL_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  formatLisbonFull,
  formatLisbonShort,
} from "@/components/xflow/inbox/inbox-labels";
import type { Customer } from "@/domains/crm/types";
import { evaluateInstagramReplyWindow } from "@/domains/inbox/rules";
import type {
  InboxCategory,
  InboxChannelAccount,
  InboxMessageRecord,
  InboxShareableQuote,
  InboxThreadRecord,
  InboxThreadStatus,
} from "@/domains/inbox/types";
import type { InboxSummaryCounts } from "@/server/inbox/repository";

type InboxFilterTab =
  | "all"
  | "needs_reply"
  | "lead"
  | "instagram"
  | "gmail"
  | "supplier"
  | "archived";

interface InboxViewProps {
  initialAccounts: InboxChannelAccount[];
  initialThreads: InboxThreadRecord[];
  initialCounts: InboxSummaryCounts;
  initialCustomers: Customer[];
  initialDetail: { thread: InboxThreadRecord; messages: InboxMessageRecord[] } | null;
  initialShareableQuotes?: InboxShareableQuote[];
  appBaseUrl?: string;
  aiEnabled?: boolean;
  autoSyncNeeded?: boolean;
  newWebsiteLeadsCount: number;
  renderedAt: string;
}

function InstagramGlyph({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function AttachmentImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex items-center gap-2 rounded-sm border border-white/[0.08] bg-[#080a0b] px-3 py-2 text-xs text-[#8a9092]">
        <ImageOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Imagem expirada ou indisponível no servidor externo.</span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-[260px] overflow-hidden rounded-md border border-white/[0.08] bg-[#080a0b]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Anexo enviado na conversa"
        className="max-h-56 w-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

export function InboxView({
  initialAccounts,
  initialThreads,
  initialCounts,
  initialCustomers,
  initialDetail,
  initialShareableQuotes = [],
  appBaseUrl = "",
  aiEnabled = false,
  autoSyncNeeded = false,
  newWebsiteLeadsCount,
  renderedAt,
}: InboxViewProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [threads, setThreads] = useState(initialThreads);
  const [counts, setCounts] = useState(initialCounts);
  const [customers, setCustomers] = useState(initialCustomers);

  const [activeTab, setActiveTab] = useState<InboxFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialDetail?.thread.id ?? initialThreads[0]?.id ?? null
  );
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const [messagesByThread, setMessagesByThread] = useState<Record<string, InboxMessageRecord[]>>(
    () => (initialDetail ? { [initialDetail.thread.id]: initialDetail.messages } : {})
  );
  const [quotesByCustomer, setQuotesByCustomer] = useState<Record<string, InboxShareableQuote[]>>(
    () =>
      initialDetail?.thread.linkedCustomerId
        ? { [initialDetail.thread.linkedCustomerId]: initialShareableQuotes }
        : {}
  );
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null
  );

  // Estado do formulário inline "Converter em Lead / Cliente"
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertName, setConvertName] = useState("");
  const [convertEmail, setConvertEmail] = useState("");
  const [convertPhone, setConvertPhone] = useState("");
  const [convertInstagram, setConvertInstagram] = useState("");
  const [convertNotes, setConvertNotes] = useState("");
  const [converting, setConverting] = useState(false);
  const [linkingCustomerId, setLinkingCustomerId] = useState("");
  const [updatingMeta, setUpdatingMeta] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const autoSyncedRef = useRef(false);

  useEffect(() => {
    if (!autoSyncNeeded || autoSyncedRef.current) return;
    autoSyncedRef.current = true;
    let cancelled = false;

    async function runBackgroundSync() {
      const res = await syncInboxAction().catch(() => null);
      if (cancelled || !res || !res.ok) return;
      setAccounts(res.accounts);
      setThreads(res.threads);
      setCounts(res.counts);
      const newCount = res.report.channels.reduce((sum, ch) => sum + ch.messagesUpserted, 0);
      if (newCount > 0) {
        setFeedback({
          tone: "success",
          message: `Atualização automática: ${newCount} nova(s) mensagem(ns) recebida(s).`,
        });
      }
    }

    void runBackgroundSync();
    return () => {
      cancelled = true;
    };
  }, [autoSyncNeeded]);

  const customersById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers]
  );

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return threads.filter((thread) => {
      if (activeTab === "archived") {
        if (thread.status !== "archived") return false;
      } else {
        if (thread.status === "archived") return false;
        if (activeTab === "needs_reply" && thread.status !== "needs_reply" && thread.status !== "unread") {
          return false;
        }
        if (activeTab === "lead" && thread.category !== "lead") return false;
        if (activeTab === "instagram" && thread.channel !== "instagram") return false;
        if (activeTab === "gmail" && thread.channel !== "gmail") return false;
        if (activeTab === "supplier" && thread.category !== "supplier") return false;
      }

      if (!q) return true;
      return (
        (thread.participantName ?? "").toLowerCase().includes(q) ||
        (thread.participantHandle ?? "").toLowerCase().includes(q) ||
        (thread.subject ?? "").toLowerCase().includes(q) ||
        (thread.snippet ?? "").toLowerCase().includes(q)
      );
    });
  }, [threads, activeTab, searchQuery]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  const activeMessages = activeThread ? messagesByThread[activeThread.id] ?? [] : [];
  const linkedCustomer = activeThread?.linkedCustomerId
    ? customersById.get(activeThread.linkedCustomerId) ?? null
    : null;

  const needsReauthAccounts = accounts.filter((acc) => acc.status === "needs_reauth");

  async function selectThread(thread: InboxThreadRecord) {
    setSelectedThreadId(thread.id);
    setMobileShowDetail(true);
    setShowConvertForm(false);
    setLinkingCustomerId("");

    if (!messagesByThread[thread.id]) {
      setLoadingDetail(true);
      try {
        const res = await getInboxThreadDetailAction(thread.id);
        if (res.ok) {
          setMessagesByThread((prev) => ({ ...prev, [thread.id]: res.messages }));
          if (res.thread.linkedCustomerId) {
            setQuotesByCustomer((prev) => ({
              ...prev,
              [res.thread.linkedCustomerId as string]: res.shareableQuotes,
            }));
          }
        } else {
          setFeedback({ tone: "error", message: res.error });
        }
      } finally {
        setLoadingDetail(false);
      }
    } else if (thread.linkedCustomerId && !quotesByCustomer[thread.linkedCustomerId]) {
      const quotes = await listCustomerShareableQuotesAction(thread.linkedCustomerId);
      setQuotesByCustomer((prev) => ({
        ...prev,
        [thread.linkedCustomerId as string]: quotes,
      }));
    }
  }

  async function handleSyncNow() {
    if (syncing) return;
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await syncInboxAction();
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        return;
      }
      setAccounts(res.accounts);
      setThreads(res.threads);
      setCounts(res.counts);

      if (selectedThreadId) {
        const detail = await getInboxThreadDetailAction(selectedThreadId);
        if (detail.ok) {
          setMessagesByThread((prev) => ({ ...prev, [selectedThreadId]: detail.messages }));
        }
      } else if (res.threads[0]) {
        const firstId = res.threads[0].id;
        setSelectedThreadId(firstId);
        const detail = await getInboxThreadDetailAction(firstId);
        if (detail.ok) {
          setMessagesByThread((prev) => ({ ...prev, [firstId]: detail.messages }));
        }
      }

      const newMessages = res.report.channels.reduce((sum, ch) => sum + ch.messagesUpserted, 0);
      const errors = res.report.channels.filter((ch) => ch.status === "error" || ch.status === "needs_reauth");

      if (errors.length > 0 && newMessages === 0) {
        setFeedback({
          tone: "error",
          message: `Sincronização parcial: ${errors.map((e) => `${CHANNEL_LABELS[e.channel]} (${e.status === "needs_reauth" ? "reautenticação necessária" : e.error ?? "erro"})`).join("; ")}.`,
        });
      } else {
        setFeedback({
          tone: "success",
          message:
            newMessages > 0
              ? `Sincronização concluída: ${newMessages} mensagem(ns) nova(s) importada(s).`
              : "Caixa atualizada — sem novas mensagens desde a última sincronização.",
        });
      }
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  function openConvertPanel(thread: InboxThreadRecord) {
    setConvertName(thread.participantName ?? thread.participantHandle ?? "");
    setConvertEmail(thread.channel === "gmail" ? thread.participantHandle ?? "" : "");
    setConvertInstagram(thread.channel === "instagram" ? thread.participantHandle ?? "" : "");
    setConvertPhone("");
    const aiParts = [
      thread.aiExtractedVehicle ? `Viatura: ${thread.aiExtractedVehicle}` : null,
      thread.aiExtractedService ? `Serviço: ${thread.aiExtractedService}` : null,
      thread.aiSummary || thread.snippet,
    ].filter(Boolean);
    setConvertNotes(aiParts.join(" · "));
    setShowConvertForm(true);
  }

  async function handleAnalyzeAi(threadId: string) {
    if (analyzingAi) return;
    setAnalyzingAi(true);
    setFeedback(null);
    try {
      const res = await analyzeInboxThreadAction(threadId);
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        return;
      }
      setThreads((prev) => prev.map((t) => (t.id === threadId ? res.thread : t)));
      router.refresh();
    } finally {
      setAnalyzingAi(false);
    }
  }

  async function handleUpdateThread(
    threadId: string,
    patch: { category?: InboxCategory; status?: InboxThreadStatus }
  ) {
    if (updatingMeta) return;
    setUpdatingMeta(true);
    setFeedback(null);
    try {
      const res = await updateInboxThreadAction(threadId, patch);
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        return;
      }
      setThreads((prev) => prev.map((t) => (t.id === threadId ? res.thread : t)));
      router.refresh();
    } finally {
      setUpdatingMeta(false);
    }
  }

  async function handleLinkCustomer() {
    if (!activeThread || !linkingCustomerId || updatingMeta) return;
    setUpdatingMeta(true);
    setFeedback(null);
    try {
      const res = await linkInboxCustomerAction(activeThread.id, linkingCustomerId);
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        return;
      }
      setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? res.thread : t)));
      setLinkingCustomerId("");
      if (res.customer) {
        const quotes = await listCustomerShareableQuotesAction(res.customer.id);
        setQuotesByCustomer((prev) => ({ ...prev, [res.customer!.id]: quotes }));
      }
      setFeedback({
        tone: "success",
        message: res.customer
          ? `Conversa associada a ${res.customer.name}.`
          : "Cliente desassociado.",
      });
      router.refresh();
    } finally {
      setUpdatingMeta(false);
    }
  }

  async function handleConvertSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeThread || converting) return;
    setConverting(true);
    setFeedback(null);
    try {
      const res = await convertInboxThreadToCustomerAction(activeThread.id, {
        name: convertName,
        email: convertEmail,
        phone: convertPhone,
        instagramHandle: convertInstagram,
        notes: convertNotes,
      });
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        return;
      }
      setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? res.thread : t)));
      setCustomers((prev) =>
        prev.some((c) => c.id === res.customer.id) ? prev : [res.customer, ...prev]
      );
      const quotes = await listCustomerShareableQuotesAction(res.customer.id);
      setQuotesByCustomer((prev) => ({ ...prev, [res.customer.id]: quotes }));
      setShowConvertForm(false);
      setFeedback({
        tone: "success",
        message: res.reusedExisting
          ? `Conversa ligada ao cliente existente ${res.customer.name}.`
          : `Lead ${res.customer.name} criada no CRM e ligada à conversa.`,
      });
      router.refresh();
    } finally {
      setConverting(false);
    }
  }

  const instagramWindow =
    activeThread?.channel === "instagram"
      ? evaluateInstagramReplyWindow(activeThread.lastInboundAt, new Date(renderedAt))
      : null;

  const filterTabs: Array<{ id: InboxFilterTab; label: string; count: number }> = [
    { id: "all", label: "Todas", count: counts.total },
    { id: "needs_reply", label: "Por responder", count: counts.needsReply },
    { id: "lead", label: "Leads", count: counts.leads },
    { id: "instagram", label: "Instagram", count: counts.instagram },
    { id: "gmail", label: "Gmail", count: counts.gmail },
    { id: "supplier", label: "Fornecedores", count: threads.filter((t) => t.category === "supplier" && t.status !== "archived").length },
    { id: "archived", label: "Arquivo", count: counts.archived },
  ];

  return (
    <div className="flex flex-col gap-5 pb-20 lg:pb-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#a9adae]">
            Comunicações Omnicanal · Negócio
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#f1ede5]">
              Mensagens (Gmail + Instagram)
            </h1>
            {newWebsiteLeadsCount > 0 && (
              <Link
                href="/customers"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d3a548]/40 bg-[#1f1b14] px-3 py-1 text-xs font-medium text-[#f7d46d] hover:border-[#d3a548] transition-colors"
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="tabular-nums">{newWebsiteLeadsCount} pedido(s) do site</span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="hidden xl:flex items-center gap-2 rounded-md border border-white/[0.08] bg-[#101314] px-3 py-1.5 text-xs text-[#a9adae]"
            >
              {acc.channel === "gmail" ? (
                <Mail className="h-3.5 w-3.5 text-[#d3a548]" aria-hidden="true" />
              ) : (
                <InstagramGlyph className="h-3.5 w-3.5 text-[#d3a548]" aria-hidden="true" />
              )}
              <span className="text-[#f1ede5]">{acc.displayHandle}</span>
              <span className="text-[#8a9092] tabular-nums">
                {acc.lastSyncedAt ? `· ${formatLisbonShort(acc.lastSyncedAt)}` : "· Nunca sync"}
              </span>
            </div>
          ))}

          <Button
            variant="primary"
            onClick={handleSyncNow}
            disabled={syncing}
            className="min-h-[44px]"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{syncing ? "A sincronizar…" : "Sincronizar agora"}</span>
          </Button>
        </div>
      </div>

      {/* Alertas de reautenticação ou feedback */}
      {needsReauthAccounts.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-[#f05a50]/30 bg-[#f05a50]/10 px-4 py-3 text-xs text-[#f8a19b]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong>Atenção: reautenticação necessária</strong> —{" "}
            {needsReauthAccounts.map((a) => `${CHANNEL_LABELS[a.channel]} (${a.displayHandle})`).join(", ")}.
          </div>
        </div>
      )}

      {feedback && (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-xs ${
            feedback.tone === "error"
              ? "border-[#f05a50]/30 bg-[#f05a50]/10 text-[#f8a19b]"
              : "border-[#68a46b]/30 bg-[#68a46b]/10 text-[#9ed3a0]"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="cursor-pointer font-bold uppercase tracking-wide opacity-70 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Barra de filtros & pesquisa */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9092]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Pesquisar conversas por contacto, assunto ou mensagem"
            placeholder="Pesquisar contacto, @username, assunto ou viatura..."
            className="w-full h-11 pl-10 pr-4 rounded-md bg-[#101314] border border-white/[0.08] focus:border-[#d3a548] focus:outline-none text-sm text-[#f1ede5] placeholder-[#8a9092] transition-colors"
          />
        </div>

        <div
          className="flex items-center gap-1.5 p-1 rounded-md bg-[#101314] border border-white/[0.06] overflow-x-auto select-none"
          role="tablist"
          aria-label="Filtrar conversas"
        >
          {filterTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 min-h-[36px] rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? "bg-[#1f1b14] text-[#f7d46d] border border-[#d3a548]/40 shadow-sm"
                    : "text-[#a9adae] hover:text-[#f1ede5]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="tabular-nums opacity-75">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout Split-View */}
      <div className="grid grid-cols-1 lg:grid-cols-[370px_minmax(0,1fr)] gap-4 items-start">
        {/* Lista de conversas */}
        <Card
          className={`p-2 bg-[#101314] border-white/[0.08] ${
            mobileShowDetail ? "hidden lg:block" : "block"
          }`}
        >
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d3a548]/30 bg-[#1f1b14] text-[#d3a548]">
                <Inbox className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#f1ede5]">
                  Ainda não existem conversas sincronizadas
                </p>
                <p className="text-xs text-[#8a9092]">
                  Clica em «Sincronizar agora» para importar os emails da X-Motion e as DMs do Instagram.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={handleSyncNow} disabled={syncing}>
                Sincronizar agora
              </Button>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-[#8a9092]">
              Nenhuma conversa corresponde a este filtro ou pesquisa.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[68vh] overflow-y-auto pr-1">
              {filteredThreads.map((thread) => {
                const isSelected = activeThread?.id === thread.id;
                const needsAttention =
                  thread.status === "unread" || thread.status === "needs_reply";

                return (
                  <button
                    key={thread.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectThread(thread)}
                    className={`block w-full shrink-0 text-left rounded-md p-3 transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#1f1b14] border-[#d3a548]/45"
                        : "bg-[#15191a]/60 border-transparent hover:border-white/[0.08] hover:bg-[#15191a]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {thread.channel === "gmail" ? (
                          <Mail
                            className="h-3.5 w-3.5 shrink-0 text-[#d3a548]"
                            aria-label="Gmail"
                          />
                        ) : (
                          <InstagramGlyph
                            className="h-3.5 w-3.5 shrink-0 text-[#d3a548]"
                            aria-label="Instagram"
                          />
                        )}
                        <span
                          className={`truncate text-sm ${
                            needsAttention
                              ? "font-semibold text-[#f1ede5]"
                              : "font-medium text-[#d8d5ce]"
                          }`}
                        >
                          {thread.participantName || thread.participantHandle || "Contacto"}
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] text-[#8a9092] tabular-nums">
                        {formatLisbonShort(thread.lastMessageAt)}
                      </span>
                    </div>

                    {thread.subject && (
                      <div className="mt-1 truncate text-xs font-medium text-[#c5aa79]">
                        {thread.subject}
                      </div>
                    )}

                    <p className="mt-1 line-clamp-2 text-xs text-[#8a9092]">
                      {thread.snippet || "Sem pré-visualização"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant={STATUS_BADGE_VARIANT[thread.status]} className="text-[10px] py-0">
                        {STATUS_LABELS[thread.status]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] py-0 border-white/10 text-[#a9adae]">
                        {CATEGORY_LABELS[thread.category]}
                      </Badge>
                      {thread.linkedCustomerId && (
                        <Badge variant="gold" className="text-[10px] py-0">
                          CRM ligado
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Detalhe da conversa */}
        <Card
          className={`p-4 sm:p-5 bg-[#101314] border-white/[0.08] ${
            mobileShowDetail ? "block" : "hidden lg:block"
          }`}
        >
          {!activeThread ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <MessageSquare className="h-7 w-7 text-[#8a9092]" aria-hidden="true" />
              <p className="text-sm text-[#a9adae]">
                Seleciona uma conversa na lista para ver as mensagens e converter em orçamento.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Botão Voltar mobile */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileShowDetail(false)}
                  className="min-h-[44px] -ml-2"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Voltar às conversas</span>
                </Button>
              </div>

              {/* Cabeçalho do detalhe */}
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="gold">
                      {CHANNEL_LABELS[activeThread.channel]}
                    </Badge>
                    <Badge variant={STATUS_BADGE_VARIANT[activeThread.status]}>
                      {STATUS_LABELS[activeThread.status]}
                    </Badge>
                    {instagramWindow && (
                      <Badge
                        variant={
                          instagramWindow.state === "open"
                            ? "success"
                            : instagramWindow.state === "expiring_soon"
                              ? "in_progress"
                              : "danger"
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                        {instagramWindow.state === "open" &&
                          `Janela IG 24h ativa (${Math.floor(instagramWindow.remainingMinutes / 60)}h restantes)`}
                        {instagramWindow.state === "expiring_soon" &&
                          `Janela IG expira em ${instagramWindow.remainingMinutes} min`}
                        {instagramWindow.state === "expired" && "Janela IG 24h expirada"}
                        {instagramWindow.state === "none" && "Sem receção recente"}
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold text-[#f1ede5] break-words">
                    {activeThread.participantName || activeThread.participantHandle || "Contacto"}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#a9adae]">
                    {activeThread.participantHandle && (
                      <span>{activeThread.participantHandle}</span>
                    )}
                    {activeThread.subject && (
                      <span className="text-[#d8d5ce]">Assunto: {activeThread.subject}</span>
                    )}
                  </div>
                </div>

                {/* Controlos de categoria e estado */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <label className="sr-only" htmlFor="thread-category-select">
                    Categoria da conversa
                  </label>
                  <select
                    id="thread-category-select"
                    value={activeThread.category}
                    disabled={updatingMeta}
                    onChange={(e) =>
                      handleUpdateThread(activeThread.id, {
                        category: e.target.value as InboxCategory,
                      })
                    }
                    className="h-9 rounded-sm bg-[#080a0b] border border-white/[0.1] px-2.5 text-xs text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>

                  {activeThread.status !== "replied" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={updatingMeta}
                      onClick={() => handleUpdateThread(activeThread.id, { status: "replied" })}
                      className="min-h-[36px]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Marcar respondido</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={updatingMeta}
                    onClick={() =>
                      handleUpdateThread(activeThread.id, {
                        status: activeThread.status === "archived" ? "needs_reply" : "archived",
                      })
                    }
                    className="min-h-[36px]"
                  >
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{activeThread.status === "archived" ? "Desarquivar" : "Arquivar"}</span>
                  </Button>

                  {aiEnabled && !activeThread.aiSummary && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={analyzingAi}
                      onClick={() => handleAnalyzeAi(activeThread.id)}
                      className="min-h-[36px]"
                    >
                      {analyzingAi ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d3a548]" aria-hidden="true" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-[#d3a548]" aria-hidden="true" />
                      )}
                      <span>Analisar IA</span>
                    </Button>
                  )}
                </div>
              </div>

              {(activeThread.aiSummary ||
                activeThread.aiExtractedVehicle ||
                activeThread.aiExtractedService) && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#d3a548]/30 bg-[#1f1b14]/50 px-3.5 py-2.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-[#d3a548] shrink-0" aria-hidden="true" />
                  {activeThread.aiSummary && (
                    <span className="text-[#f1ede5]">{activeThread.aiSummary}</span>
                  )}
                  {activeThread.aiExtractedVehicle && (
                    <Badge variant="gold">{activeThread.aiExtractedVehicle}</Badge>
                  )}
                  {activeThread.aiExtractedService && (
                    <Badge variant="outline" className="border-[#d3a548]/40 text-[#f7d46d]">
                      {activeThread.aiExtractedService}
                    </Badge>
                  )}
                </div>
              )}

              {/* Fluxo de mensagens */}
              <div className="flex flex-col gap-3 max-h-[42vh] overflow-y-auto pr-1">
                {loadingDetail ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#8a9092]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>A carregar mensagens…</span>
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="rounded-md border border-white/[0.06] bg-[#15191a] p-4 text-xs text-[#8a9092]">
                    Sem corpo de mensagem carregado para esta conversa. Sincronize para obter o histórico.
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isOutbound = msg.direction === "outbound";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1.5 rounded-md border p-3.5 text-sm ${
                          isOutbound
                            ? "ml-4 sm:ml-10 border-[#d3a548]/30 bg-[#1f1b14]/70"
                            : "mr-4 sm:mr-10 border-white/[0.08] bg-[#15191a]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#f1ede5]">
                            {isOutbound
                              ? "X-Motion"
                              : msg.senderName || msg.senderHandle || "Cliente"}
                          </span>
                          <span className="text-[#8a9092] tabular-nums">
                            {formatLisbonFull(msg.sentAt)}
                          </span>
                        </div>

                        {msg.bodyText ? (
                          <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed text-[#e6e2d8]">
                            {msg.bodyText}
                          </p>
                        ) : null}

                        {msg.attachments.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {msg.attachments.map((att, index) =>
                              att.type === "image" && att.url ? (
                                <AttachmentImage key={`${msg.id}-att-${index}`} url={att.url} />
                              ) : (
                                <div
                                  key={`${msg.id}-att-${index}`}
                                  className="inline-flex items-center gap-1.5 rounded-sm border border-white/[0.08] bg-[#080a0b] px-2.5 py-1.5 text-xs text-[#a9adae]"
                                >
                                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>{att.name || `Anexo (${att.type})`}</span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Compositor de Resposta Bidirecional (Fase 3) */}
              <InboxReplyComposer
                key={activeThread.id}
                thread={activeThread}
                instagramWindow={instagramWindow}
                shareableQuotes={
                  activeThread.linkedCustomerId
                    ? quotesByCustomer[activeThread.linkedCustomerId] ?? []
                    : []
                }
                appBaseUrl={appBaseUrl}
                aiEnabled={aiEnabled}
                onSent={({ thread: updatedThread, message, counts: updatedCounts }) => {
                  setThreads((prev) =>
                    prev.map((t) => (t.id === updatedThread.id ? updatedThread : t))
                  );
                  setMessagesByThread((prev) => ({
                    ...prev,
                    [updatedThread.id]: [...(prev[updatedThread.id] ?? []), message],
                  }));
                  setCounts(updatedCounts);
                  setFeedback({
                    tone: "success",
                    message: `Resposta enviada por ${CHANNEL_LABELS[updatedThread.channel]} com sucesso.`,
                  });
                  router.refresh();
                }}
                onError={(msg) => setFeedback({ tone: "error", message: msg })}
              />

              {/* Painel de Conversão CRM & Orçamento */}
              <div className="rounded-md border border-white/[0.08] bg-[#15191a] p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#d3a548]" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-[#f1ede5]">
                      Ligação ao CRM & Orçamento
                    </h3>
                  </div>

                  {linkedCustomer && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/customers/${linkedCustomer.id}`}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-white/[0.12] bg-[#101314] px-3 py-2 text-xs font-medium text-[#f1ede5] hover:border-[#d3a548] min-h-[38px]"
                      >
                        <span>Ver ficha do cliente</span>
                      </Link>
                      <Link
                        href={`/quotes/new?customer=${linkedCustomer.id}`}
                        className="inline-flex items-center gap-1.5 rounded-sm bg-[#d3a548] px-3.5 py-2 text-xs font-semibold text-[#050606] hover:bg-[#e1b860] min-h-[38px]"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Criar Orçamento</span>
                      </Link>
                    </div>
                  )}
                </div>

                {linkedCustomer ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs rounded-sm border border-white/[0.06] bg-[#101314] p-3">
                    <div>
                      <span className="text-[#8a9092] block">Cliente ligado</span>
                      <strong className="text-[#f1ede5]">{linkedCustomer.name}</strong>
                    </div>
                    <div>
                      <span className="text-[#8a9092] block">Contactos</span>
                      <span className="text-[#d8d5ce]">
                        {[
                          linkedCustomer.email,
                          linkedCustomer.phone,
                          linkedCustomer.instagramHandle,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8a9092] block">Estado CRM</span>
                      <span className="text-[#f7d46d] uppercase tracking-wide">
                        {linkedCustomer.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Button
                        variant="primary"
                        onClick={() => openConvertPanel(activeThread)}
                        className="min-h-[42px]"
                      >
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        <span>Converter em Lead / Cliente</span>
                      </Button>

                      <div className="flex flex-1 items-center gap-2">
                        <label htmlFor="link-existing-customer" className="sr-only">
                          Associar a cliente existente
                        </label>
                        <select
                          id="link-existing-customer"
                          value={linkingCustomerId}
                          onChange={(e) => setLinkingCustomerId(e.target.value)}
                          className="h-10 flex-1 min-w-0 rounded-sm bg-[#080a0b] border border-white/[0.1] px-3 text-xs text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
                        >
                          <option value="">Ou associar a cliente existente…</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                              {c.email ? ` (${c.email})` : c.instagramHandle ? ` (${c.instagramHandle})` : ""}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="secondary"
                          disabled={!linkingCustomerId || updatingMeta}
                          onClick={handleLinkCustomer}
                          className="min-h-[40px]"
                        >
                          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Associar</span>
                        </Button>
                      </div>
                    </div>

                    {showConvertForm && (
                      <form
                        onSubmit={handleConvertSubmit}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-sm border border-[#d3a548]/30 bg-[#101314] p-4"
                      >
                        <div className="space-y-1">
                          <label
                            htmlFor="convert-name"
                            className="text-[11px] font-medium uppercase tracking-wide text-[#a9adae]"
                          >
                            Nome do cliente *
                          </label>
                          <input
                            id="convert-name"
                            type="text"
                            required
                            value={convertName}
                            onChange={(e) => setConvertName(e.target.value)}
                            className="h-10 w-full rounded-sm bg-[#080a0b] border border-white/[0.1] px-3 text-xs text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor="convert-phone"
                            className="text-[11px] font-medium uppercase tracking-wide text-[#a9adae]"
                          >
                            Telemóvel (opcional)
                          </label>
                          <input
                            id="convert-phone"
                            type="tel"
                            value={convertPhone}
                            onChange={(e) => setConvertPhone(e.target.value)}
                            placeholder="Ex.: 912 345 678"
                            className="h-10 w-full rounded-sm bg-[#080a0b] border border-white/[0.1] px-3 text-xs text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor="convert-email"
                            className="text-[11px] font-medium uppercase tracking-wide text-[#a9adae]"
                          >
                            E-mail
                          </label>
                          <input
                            id="convert-email"
                            type="email"
                            value={convertEmail}
                            onChange={(e) => setConvertEmail(e.target.value)}
                            placeholder="nome@exemplo.pt"
                            className="h-10 w-full rounded-sm bg-[#080a0b] border border-white/[0.1] px-3 text-xs text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor="convert-ig"
                            className="text-[11px] font-medium uppercase tracking-wide text-[#a9adae]"
                          >
                            Instagram
                          </label>
                          <input
                            id="convert-ig"
                            type="text"
                            value={convertInstagram}
                            onChange={(e) => setConvertInstagram(e.target.value)}
                            placeholder="@utilizador"
                            className="h-10 w-full rounded-sm bg-[#080a0b] border border-white/[0.1] px-3 text-xs text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label
                            htmlFor="convert-notes"
                            className="text-[11px] font-medium uppercase tracking-wide text-[#a9adae]"
                          >
                            Notas / Pedido identificado
                          </label>
                          <textarea
                            id="convert-notes"
                            rows={2}
                            value={convertNotes}
                            onChange={(e) => setConvertNotes(e.target.value)}
                            className="w-full rounded-sm bg-[#080a0b] border border-white/[0.1] p-3 text-xs text-[#f1ede5] focus:border-[#d3a548] focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2 flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowConvertForm(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" variant="primary" size="sm" disabled={converting}>
                            {converting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : null}
                            <span>Guardar Lead & Ligar</span>
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
