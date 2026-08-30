import { FightSummaryResponse } from '@/types/esologs';

// In-memory cache for fight summaries
const summaryCache = new Map<string, { data: FightSummaryResponse; timestamp: number }>();
const TTL = 1000 * 60 * 30; // 30 minutes TTL

export function getCachedSummary(key: string): FightSummaryResponse | null {
  const entry = summaryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    summaryCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedSummary(key: string, data: FightSummaryResponse): void {
  // Simple LRU-style prune if cache exceeds 1000 items
  if (summaryCache.size > 1000) {
    const oldestKey = summaryCache.keys().next().value;
    if (oldestKey) summaryCache.delete(oldestKey);
  }
  summaryCache.set(key, { data, timestamp: Date.now() });
}
