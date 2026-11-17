import { ComposioInboxProvider, parseMcpSsePayload } from "@/server/inbox/providers/composio";
import type { SocialInstagramChildMedia } from "@/domains/marketing/types";

const COMPOSIO_MCP_URL = "https://connect.composio.dev/mcp";
const REQUEST_TIMEOUT_MS = 25_000;

export interface FetchedInstagramProfileSnapshot {
  externalAccountId: string;
  username: string;
  displayName: string;
  biography: string;
  websiteUrl: string;
  profilePictureUrl: string | null;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
}

export interface FetchedInstagramMediaItem {
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
  publishedAt: string;
}

function cleanInstagramUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.endsWith("...")) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

async function callComposioMcp(
  apiKey: string,
  toolName: string,
  argumentsPayload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(COMPOSIO_MCP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "x-consumer-api-key": apiKey,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: argumentsPayload,
      },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Falha HTTP ${res.status} ao contactar Composio.`);
  }

  const text = await res.text();
  return parseMcpSsePayload(text);
}

function unwrapSingleToolData(payload: Record<string, unknown>): {
  successful: boolean;
  offloaded: boolean;
  data: Record<string, unknown>;
  error?: string;
} {
  const root = (payload.data ?? {}) as Record<string, unknown>;
  const results = Array.isArray(root.results)
    ? (root.results as Array<Record<string, unknown>>)
    : [];
  const first = results[0];
  if (!first) {
    return {
      successful: false,
      offloaded: false,
      data: {},
      error: typeof payload.error === "string" ? payload.error : "Sem resposta do Instagram.",
    };
  }
  const response = (first.response ?? {}) as Record<string, unknown>;
  const err =
    (typeof response.error === "string" && response.error) ||
    (typeof first.error === "string" && first.error) ||
    undefined;
  const offloaded = Boolean(!response.data && response.data_preview);
  return {
    successful: response.successful === true && first.error == null,
    offloaded,
    data: (response.data ?? response.data_preview ?? {}) as Record<string, unknown>,
    error: err,
  };
}

function mapRawMediaItem(item: Record<string, unknown>): FetchedInstagramMediaItem {
  const rawType = String(item.media_type ?? "IMAGE").toUpperCase();
  const mediaType: FetchedInstagramMediaItem["mediaType"] =
    rawType === "VIDEO" || rawType === "CAROUSEL_ALBUM" ? rawType : "IMAGE";
  const rawProduct = String(item.media_product_type ?? "FEED").toUpperCase();
  const mediaProductType: FetchedInstagramMediaItem["mediaProductType"] =
    rawProduct === "REELS" ? "REELS" : "FEED";

  const childrenBlock = item.children as { data?: Array<Record<string, unknown>> } | undefined;
  const children: SocialInstagramChildMedia[] = Array.isArray(childrenBlock?.data)
    ? childrenBlock.data.map((ch) => ({
        mediaUrl: cleanInstagramUrl(ch.media_url),
        mediaType: typeof ch.media_type === "string" ? ch.media_type : null,
        thumbnailUrl: cleanInstagramUrl(ch.thumbnail_url),
      }))
    : [];

  const ts = typeof item.timestamp === "string" ? new Date(item.timestamp) : new Date();
  const publishedAt = Number.isNaN(ts.getTime()) ? new Date().toISOString() : ts.toISOString();

  return {
    externalMediaId: String(item.id),
    mediaType,
    mediaProductType,
    caption: typeof item.caption === "string" ? item.caption : "",
    mediaUrl: cleanInstagramUrl(item.media_url),
    thumbnailUrl: cleanInstagramUrl(item.thumbnail_url),
    children,
    permalink: cleanInstagramUrl(item.permalink),
    likeCount: Number(item.like_count ?? 0) || 0,
    commentsCount: Number(item.comments_count ?? 0) || 0,
    publishedAt,
  };
}

async function fetchMediaDetailById(
  apiKey: string,
  accountId: string,
  mediaId: string
): Promise<FetchedInstagramMediaItem | null> {
  const payload = await callComposioMcp(apiKey, "COMPOSIO_MULTI_EXECUTE_TOOL", {
    sync_response_to_workbench: false,
    tools: [
      {
        tool_slug: "INSTAGRAM_GET_IG_MEDIA",
        account: accountId,
        arguments: {
          ig_media_id: mediaId,
          fields:
            "id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,children{media_url,media_type,thumbnail_url}",
        },
      },
    ],
  });
  const res = unwrapSingleToolData(payload);
  if (!res.successful || !res.data.id) return null;
  return mapRawMediaItem(res.data);
}

export async function fetchLiveInstagramSnapshot(): Promise<{
  profile: FetchedInstagramProfileSnapshot;
  media: FetchedInstagramMediaItem[];
}> {
  const apiKey = process.env.COMPOSIO_API_KEY?.trim();
  if (!apiKey || process.env.INBOX_SYNC_ENABLED === "false") {
    throw new Error("Ligação Composio/Instagram não configurada neste ambiente.");
  }

  const provider = new ComposioInboxProvider(apiKey);
  const account = await provider.discoverActiveAccount("instagram");
  if (!account) {
    throw new Error("Nenhuma conta Instagram Business ativa encontrada no Composio.");
  }

  const [userInfoPayload, proxyBioPayload] = await Promise.all([
    callComposioMcp(apiKey, "COMPOSIO_MULTI_EXECUTE_TOOL", {
      sync_response_to_workbench: false,
      tools: [
        {
          tool_slug: "INSTAGRAM_GET_USER_INFO",
          account: account.externalAccountId,
          arguments: {
            ig_user_id: "me",
            fields:
              "id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count",
          },
        },
      ],
    }),
    callComposioMcp(apiKey, "COMPOSIO_PROXY_EXECUTE", {
      toolkit_slug: "instagram",
      method: "GET",
      endpoint: "/me",
      parameters: [
        {
          name: "fields",
          type: "query",
          value: "id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count",
        },
      ],
    }).catch(() => null),
  ]);

  const userRes = unwrapSingleToolData(userInfoPayload);
  const proxyData = proxyBioPayload
    ? (((proxyBioPayload.data ?? {}) as Record<string, unknown>).data as Record<string, unknown> | undefined) ??
      ((proxyBioPayload.data ?? {}) as Record<string, unknown>)
    : {};

  const u = { ...userRes.data, ...proxyData };
  const profile: FetchedInstagramProfileSnapshot = {
    externalAccountId: account.externalAccountId,
    username: String(u.username || account.displayHandle || "x_motion.wrap").replace(/^@/, ""),
    displayName: String(u.name || "X-MOTION"),
    biography: typeof u.biography === "string" ? u.biography : "",
    websiteUrl: typeof u.website === "string" ? u.website : "",
    profilePictureUrl:
      cleanInstagramUrl(proxyData.profile_picture_url) ??
      cleanInstagramUrl(userRes.data.profile_picture_url),
    followersCount: Number(u.followers_count ?? 0) || 0,
    followsCount: Number(u.follows_count ?? 0) || 0,
    mediaCount: Number(u.media_count ?? 0) || 0,
  };

  // 1) Obter lista leve de IDs (sem children{...}) para nunca sofrer offload/truncagem
  const listPayload = await callComposioMcp(apiKey, "COMPOSIO_MULTI_EXECUTE_TOOL", {
    sync_response_to_workbench: false,
    tools: [
      {
        tool_slug: "INSTAGRAM_GET_IG_USER_MEDIA",
        account: account.externalAccountId,
        arguments: {
          ig_user_id: "me",
          limit: 24,
          fields: "id,timestamp",
        },
      },
    ],
  });

  const listRes = unwrapSingleToolData(listPayload);
  if (!listRes.successful && !userRes.successful) {
    throw new Error(listRes.error || userRes.error || "Falha ao ler publicações do Instagram.");
  }

  const rawIds = Array.isArray(listRes.data.data)
    ? (listRes.data.data as Array<Record<string, unknown>>)
        .map((r) => (typeof r.id === "string" ? r.id : ""))
        .filter(Boolean)
    : [];

  // 2) Buscar detalhes completos em lotes paralelos de 6 (URLs de CDN intactas e 100% dos posts)
  const collected: FetchedInstagramMediaItem[] = [];
  for (let i = 0; i < rawIds.length; i += 6) {
    const batch = rawIds.slice(i, i + 6);
    const details = await Promise.all(
      batch.map((id) => fetchMediaDetailById(apiKey, account.externalAccountId, id).catch(() => null))
    );
    for (const d of details) {
      if (d) collected.push(d);
    }
  }

  return { profile, media: collected };
}
