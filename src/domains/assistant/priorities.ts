import type { AssistantItem } from "./types";

export interface PriorityInput {
  blocked: AssistantItem[];
  quality: AssistantItem[];
  delayed: AssistantItem[];
  deliveries: AssistantItem[];
  agenda: AssistantItem[];
  quotes: AssistantItem[];
  stock: AssistantItem[];
  limit?: number;
}

interface ScoredItem {
  item: AssistantItem;
  score: number;
}

const BASE_SCORE = {
  blocked: 100,
  quality: 85,
  delayed: 80,
  deliveries: 70,
  agenda: 60,
  quotes: 40,
  stock: 30,
} as const;

function addScore(target: ScoredItem[], items: AssistantItem[], score: number): void {
  for (const item of items) {
    target.push({ item, score });
  }
}

function timeValue(value: string | null): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function buildPriorities(input: PriorityInput): AssistantItem[] {
  const limit = Math.min(5, Math.max(1, input.limit ?? 3));
  const scored: ScoredItem[] = [];

  addScore(scored, input.blocked, BASE_SCORE.blocked);
  addScore(scored, input.quality, BASE_SCORE.quality);
  addScore(scored, input.delayed, BASE_SCORE.delayed);
  addScore(scored, input.deliveries, BASE_SCORE.deliveries);
  addScore(scored, input.agenda, BASE_SCORE.agenda);
  addScore(scored, input.quotes, BASE_SCORE.quotes);
  addScore(scored, input.stock, BASE_SCORE.stock);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const byTime = timeValue(a.item.time) - timeValue(b.item.time);
    if (byTime !== 0) return byTime;
    return a.item.title.localeCompare(b.item.title, "pt-PT");
  });

  const seen = new Set<string>();
  const result: AssistantItem[] = [];
  for (const entry of scored) {
    const key = `${entry.item.kind}:${entry.item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry.item);
    if (result.length === limit) break;
  }
  return result;
}
