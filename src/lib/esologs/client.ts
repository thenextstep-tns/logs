import {
  ESOZone,
  ESORankingsResponse,
  FightSummaryResponse,
  DifficultyOption
} from '@/types/esologs';

const BASE_URL = 'https://www.esologs.com/v1';

// In-memory caches
const bossDifficultyCache = new Map<number, number>();
const bossAvailableDifficultiesCache = new Map<number, DifficultyOption[]>();

export class ESOLogsClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      process.env.ESOLOGS_API_KEY ||
      process.env.ESOLOGS_CLIENT_SECRET ||
      '';
  }

  private async fetchJson<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const key = this.apiKey || process.env.ESOLOGS_API_KEY || process.env.ESOLOGS_CLIENT_SECRET || '';
    if (!key) {
      throw new Error('ESOlogs API Key is missing. Please check ESOLOGS_API_KEY / ESOLOGS_CLIENT_SECRET.');
    }

    const searchParams = new URLSearchParams({
      api_key: key,
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      )
    });

    const url = `${BASE_URL}/${path}?${searchParams.toString()}`;
    const res = await fetch(url, {
      next: { revalidate: 300 } // Next.js cache 5 min
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new Error(`ESOlogs API error (${res.status}): ${errorText}`);
    }

    return res.json() as Promise<T>;
  }

  /**
   * Fetches all zones and their encounters from ESOlogs API
   */
  async getZones(): Promise<ESOZone[]> {
    return this.fetchJson<ESOZone[]>('zones');
  }

  /**
   * Identifies 12-player trial zones from ESOlogs zones dynamically
   */
  async getHardModeTrials(): Promise<ESOZone[]> {
    const zones = await this.getZones();
    const nonTrialKeywords = ['dungeons', 'arenas (group)', 'maelstrom arena', 'iron atronach'];
    return zones.filter(z => {
      const lower = z.name.toLowerCase();
      const isExcluded = nonTrialKeywords.some(kw => lower.includes(kw));
      return !isExcluded && z.encounters && z.encounters.length > 0;
    });
  }

  /**
   * Discovers all available difficulties for an encounter (e.g. HM vs Non-HM)
   */
  async getAvailableDifficulties(bossId: number): Promise<DifficultyOption[]> {
    if (bossAvailableDifficultiesCache.has(bossId)) {
      return bossAvailableDifficultiesCache.get(bossId)!;
    }

    // Special cases for Cloudrest and Asylum Sanctorium
    if (bossId === 27) { // Z'Maja (Cloudrest)
      const options: DifficultyOption[] = [
        { id: 125, name: 'Veteran +3 (Hard Mode)', isHardMode: true },
        { id: 121, name: 'Veteran (+0 Non-HM)', isHardMode: false }
      ];
      bossAvailableDifficultiesCache.set(bossId, options);
      return options;
    }

    if (bossId === 23) { // Saint Olms (Asylum)
      const options: DifficultyOption[] = [
        { id: 124, name: 'Veteran +2 (Hard Mode)', isHardMode: true },
        { id: 121, name: 'Veteran (+0 Non-HM)', isHardMode: false }
      ];
      bossAvailableDifficultiesCache.set(bossId, options);
      return options;
    }

    // Check if 122 (Standard Veteran Hard Mode) exists for this boss
    let has122 = false;
    try {
      const res122 = await this.fetchJson<ESORankingsResponse>(`rankings/encounter/${bossId}`, {
        difficulty: 122,
        metric: 'speed',
        page: 1
      });
      has122 = res122 && Array.isArray(res122.rankings) && res122.rankings.length > 0;
    } catch (e) {
      has122 = false;
    }

    const options: DifficultyOption[] = [];
    if (has122) {
      options.push({ id: 122, name: 'Veteran Hard Mode', isHardMode: true });
      options.push({ id: 121, name: 'Veteran (Non-HM)', isHardMode: false });
    } else {
      options.push({ id: 121, name: 'Veteran', isHardMode: false });
    }

    bossAvailableDifficultiesCache.set(bossId, options);
    return options;
  }

  /**
   * Dynamically resolves the highest available Veteran / Hard Mode difficulty for an encounter
   */
  async resolveBestDifficulty(bossId: number): Promise<number> {
    if (bossDifficultyCache.has(bossId)) {
      return bossDifficultyCache.get(bossId)!;
    }

    const available = await this.getAvailableDifficulties(bossId);
    const best = available[0]?.id || 122;
    bossDifficultyCache.set(bossId, best);
    return best;
  }

  /**
   * Fetches speed rankings for an encounter at a specific or auto-resolved difficulty
   */
  async getBossRankingsPage(bossId: number, difficulty?: number, page: number = 1): Promise<ESORankingsResponse> {
    const diff = difficulty !== undefined ? difficulty : await this.resolveBestDifficulty(bossId);
    return this.fetchJson<ESORankingsResponse>(`rankings/encounter/${bossId}`, {
      difficulty: diff,
      metric: 'speed',
      page
    });
  }

  /**
   * Fetches ALL available speed reports across all pages for a boss at the best/selected difficulty
   */
  async getAllBossRankings(bossId: number, difficulty?: number): Promise<{
    rankings: ESORankingsResponse['rankings'];
    difficulty: number;
    difficultyLabel: string;
    availableDifficulties: DifficultyOption[];
  }> {
    const availableDifficulties = await this.getAvailableDifficulties(bossId);
    const diff = difficulty !== undefined ? difficulty : (availableDifficulties[0]?.id || 122);
    
    const allRankings: ESORankingsResponse['rankings'] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const res = await this.getBossRankingsPage(bossId, diff, page);
      if (res && Array.isArray(res.rankings) && res.rankings.length > 0) {
        allRankings.push(...res.rankings);
        hasMore = res.hasMorePages === true;
        page++;
      } else {
        hasMore = false;
      }
    }

    const matchedOption = availableDifficulties.find(d => d.id === diff);
    const difficultyLabel = matchedOption ? matchedOption.name : (diff === 122 ? 'Veteran Hard Mode' : 'Veteran');

    return {
      rankings: allRankings,
      difficulty: diff,
      difficultyLabel,
      availableDifficulties
    };
  }

  /**
   * Fetches report fight metadata and friendlies
   */
  async getReportFights(reportId: string): Promise<{
    title: string;
    zone: number;
    fights: Array<{ id: number; start_time: number; end_time: number; boss: number; name: string; kill?: boolean; bossPercentage?: number }>;
    friendlies?: Array<{ id: number; name: string; type: string; icon: string; displayName?: string; fights: Array<{ id: number }> }>;
    enemies?: Array<{ id: number; name: string; type: string; icon?: string; fights?: Array<{ id: number; groups?: number; instances?: number }> }>;
  }> {
    return this.fetchJson(`report/fights/${reportId}`);
  }

  /**
   * Fetches all cast events for a specific player during a fight, handling pagination.
   */
  async getCastEvents(
    reportId: string,
    startTime: number,
    endTime: number,
    sourceId: number
  ): Promise<import('@/types/rotation').RawCastEvent[]> {
    const allEvents: import('@/types/rotation').RawCastEvent[] = [];
    let currentStart = startTime;
    let pageCount = 0;
    const maxPages = 20; // safety ceiling

    while (currentStart < endTime && pageCount < maxPages) {
      pageCount++;
      const res = await this.fetchJson<{
        events?: import('@/types/rotation').RawCastEvent[];
        nextPageTimestamp?: number;
      }>(`report/events/casts/${reportId}`, {
        start: currentStart,
        end: endTime,
        sourceid: sourceId
      });

      if (res && Array.isArray(res.events) && res.events.length > 0) {
        allEvents.push(...res.events);
      }

      if (res && res.nextPageTimestamp && res.nextPageTimestamp > currentStart && res.nextPageTimestamp < endTime) {
        currentStart = res.nextPageTimestamp;
      } else {
        break;
      }
    }

    return allEvents;
  }

  /**
   * Fetches buff / aura events for a specific player during a fight (e.g. Crux tracking).
   */
  async getBuffEvents(
    reportId: string,
    startTime: number,
    endTime: number,
    sourceId: number,
    abilityId?: number
  ): Promise<import('@/types/rotation').RawBuffEvent[]> {
    const allEvents: import('@/types/rotation').RawBuffEvent[] = [];
    let currentStart = startTime;
    let pageCount = 0;
    const maxPages = 20;

    const params: Record<string, string | number> = {
      start: currentStart,
      end: endTime,
      sourceid: sourceId
    };
    if (abilityId) {
      params.abilityid = abilityId;
    }

    while (currentStart < endTime && pageCount < maxPages) {
      pageCount++;
      params.start = currentStart;

      const res = await this.fetchJson<{
        events?: import('@/types/rotation').RawBuffEvent[];
        nextPageTimestamp?: number;
      }>(`report/events/buffs/${reportId}`, params);

      if (res && Array.isArray(res.events) && res.events.length > 0) {
        allEvents.push(...res.events);
      }

      if (res && res.nextPageTimestamp && res.nextPageTimestamp > currentStart && res.nextPageTimestamp < endTime) {
        currentStart = res.nextPageTimestamp;
      } else {
        break;
      }
    }

    return allEvents;
  }

  /**
   * Fetches damage-done events for a specific player during a fight (e.g. Fatecarver channeled damage ticks).
   */
  async getDamageEvents(
    reportId: string,
    startTime: number,
    endTime: number,
    sourceId: number,
    abilityId?: number
  ): Promise<import('@/types/rotation').RawDamageEvent[]> {
    const allEvents: import('@/types/rotation').RawDamageEvent[] = [];
    let currentStart = startTime;
    let pageCount = 0;
    const maxPages = 20;

    const params: Record<string, string | number> = {
      start: currentStart,
      end: endTime,
      sourceid: sourceId
    };
    if (abilityId) {
      params.abilityid = abilityId;
    }

    while (currentStart < endTime && pageCount < maxPages) {
      pageCount++;
      params.start = currentStart;

      const res = await this.fetchJson<{
        events?: import('@/types/rotation').RawDamageEvent[];
        nextPageTimestamp?: number;
      }>(`report/events/damage-done/${reportId}`, params);

      if (res && Array.isArray(res.events) && res.events.length > 0) {
        allEvents.push(...res.events);
      }

      if (res && res.nextPageTimestamp && res.nextPageTimestamp > currentStart && res.nextPageTimestamp < endTime) {
        currentStart = res.nextPageTimestamp;
      } else {
        break;
      }
    }

    return allEvents;
  }

  /**
   * Parses an ESO Logs URL into its constituents (reportId, fightId, sourceId)
   */
  static parseReportUrl(rawUrl: string): {
    reportId: string | null;
    fightId?: number;
    sourceId?: number;
    type?: string;
    view?: string;
  } {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { reportId: null };
    }

    const trimmed = rawUrl.trim();

    // Direct report ID (alphanumeric string of 16 characters e.g. 7LKMqfRc3ZdCzGJx)
    if (/^[a-zA-Z0-9]{16}$/.test(trimmed)) {
      return { reportId: trimmed };
    }

    try {
      // Handle URLs like https://www.esologs.com/reports/7LKMqfRc3ZdCzGJx?fight=25&type=casts&source=10&view=events
      // or with hash #fight=25
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      
      // Extract report ID from pathname e.g. /reports/7LKMqfRc3ZdCzGJx
      const match = urlObj.pathname.match(/\/reports\/([a-zA-Z0-9]+)/);
      const reportId = match ? match[1] : null;

      // Extract search params from either search or hash
      const searchParams = new URLSearchParams(urlObj.search);
      if (urlObj.hash && urlObj.hash.includes('=')) {
        const hashContent = urlObj.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hashContent);
        hashParams.forEach((v, k) => {
          if (!searchParams.has(k)) searchParams.set(k, v);
        });
      }

      const fightParam = searchParams.get('fight');
      const sourceParam = searchParams.get('source') || searchParams.get('sourceid');
      const type = searchParams.get('type') || undefined;
      const view = searchParams.get('view') || undefined;

      const fightId = fightParam && fightParam !== 'last' ? parseInt(fightParam, 10) : undefined;
      const sourceId = sourceParam ? parseInt(sourceParam, 10) : undefined;

      return {
        reportId,
        fightId: isNaN(fightId as number) ? undefined : fightId,
        sourceId: isNaN(sourceId as number) ? undefined : sourceId,
        type,
        view
      };
    } catch (e) {
      // Fallback regex extraction
      const match = trimmed.match(/reports\/([a-zA-Z0-9]{16})/);
      const reportId = match ? match[1] : null;
      const fightMatch = trimmed.match(/[?&#]fight=([0-9]+)/);
      const sourceMatch = trimmed.match(/[?&#]source(?:id)?=([0-9]+)/);

      return {
        reportId,
        fightId: fightMatch ? parseInt(fightMatch[1], 10) : undefined,
        sourceId: sourceMatch ? parseInt(sourceMatch[1], 10) : undefined
      };
    }
  }

  /**
   * Fetches summary table for a fight
   */
  async getFightSummary(reportId: string, startTime: number, endTime: number): Promise<FightSummaryResponse> {
    return this.fetchJson<FightSummaryResponse>(`report/tables/summary/${reportId}`, {
      start: startTime,
      end: endTime,
    });
  }

  /**
   * Fetches the summary buffs table for a player during a fight (contains aura uptimes).
   */
  async getBuffTable(
    reportId: string,
    startTime: number,
    endTime: number,
    sourceId: number
  ): Promise<Array<{ name: string; guid: number; totalUptime: number; type?: number }>> {
    const res = await this.fetchJson<{
      auras?: Array<{ name: string; guid: number; totalUptime: number; type?: number }>;
    }>(`report/tables/buffs/${reportId}`, {
      start: startTime,
      end: endTime,
      sourceid: sourceId
    });
    return res?.auras || [];
  }

  /**
   * Fetches the debuffs applied to targets (enemies/bosses) during a fight.
   * Parameter by='target' returns enemy target debuffs including Heat Shock, Off-Balance, Taunt, Crusher, etc.
   */
  async getTargetDebuffTable(
    reportId: string,
    startTime: number,
    endTime: number,
    targetId?: number
  ): Promise<Array<{
    name: string;
    guid: number;
    totalUptime: number;
    totalUses: number;
    type?: number;
    bands?: Array<{ startTime: number; endTime: number }>;
  }>> {
    const params: Record<string, string | number> = {
      start: startTime,
      end: endTime,
      by: 'target'
    };
    if (targetId) {
      params.targetid = targetId;
    }
    const res = await this.fetchJson<{
      auras?: Array<{
        name: string;
        guid: number;
        totalUptime: number;
        totalUses: number;
        type?: number;
        bands?: Array<{ startTime: number; endTime: number }>;
      }>;
    }>(`report/tables/debuffs/${reportId}`, params);
    return res?.auras || [];
  }


  /**
   * Fetches the Ultimate resource timeline series for a player during a fight (abilityid 1000 = Ultimate).
   * Returns an array of [timestamp, ultimateValue] pairs.
   */
  async getUltimateResourceSeries(
    reportId: string,
    startTime: number,
    endTime: number,
    sourceId: number
  ): Promise<Array<[number, number]>> {
    const res = await this.fetchJson<{
      series?: Array<{
        name?: string;
        data?: Array<[number, number]>;
      }>;
    }>(`report/tables/resources/${reportId}`, {
      start: startTime,
      end: endTime,
      sourceid: sourceId,
      abilityid: 1000
    });

    if (res?.series && res.series.length > 0 && Array.isArray(res.series[0].data)) {
      return res.series[0].data;
    }
    return [];
  }

  /**
   * Fetches damage events on the primary boss target to detect static HP (invulnerability/immune phases).
   */
  async getBossInvulnerabilityWindows(
    reportId: string,
    startTime: number,
    endTime: number,
    bossEnemyId?: number
  ): Promise<import('@/types/rotation').InvulnerabilityWindow[]> {
    if (!bossEnemyId) return [];

    try {
      const res = await this.fetchJson<{
        events?: Array<{
          timestamp: number;
          targetResources?: { hitPoints?: number; maxHitPoints?: number };
        }>;
      }>(`report/events/damage-done/${reportId}`, {
        start: startTime,
        end: endTime,
        targetid: bossEnemyId
      });

      const events = (res?.events || []).filter(
        e => e.targetResources?.hitPoints !== undefined && e.targetResources?.maxHitPoints
      );

      if (events.length === 0) return [];

      const rawWindows: import('@/types/rotation').InvulnerabilityWindow[] = [];
      const maxHp = events[0].targetResources!.maxHitPoints!;
      let staticStartTs: number | null = null;
      let lastHp = events[0].targetResources!.hitPoints!;
      let lastTs = events[0].timestamp;

      for (let i = 1; i < events.length; i++) {
        const e = events[i];
        const curHp = e.targetResources!.hitPoints!;
        if (curHp === lastHp) {
          if (staticStartTs === null) {
            staticStartTs = events[i - 1].timestamp;
          }
        } else {
          if (staticStartTs !== null) {
            const duration = (lastTs - staticStartTs) / 1000;
            if (duration >= 4.0) {
              rawWindows.push({
                startTs: staticStartTs,
                endTs: lastTs,
                startSec: Number(((staticStartTs - startTime) / 1000).toFixed(1)),
                endSec: Number(((lastTs - startTime) / 1000).toFixed(1)),
                durationSec: Number(duration.toFixed(1)),
                hp: lastHp,
                hpPct: Math.round((lastHp / maxHp) * 100)
              });
            }
            staticStartTs = null;
          }
          lastHp = curHp;
        }
        lastTs = e.timestamp;
      }

      if (staticStartTs !== null) {
        const duration = (lastTs - staticStartTs) / 1000;
        if (duration >= 4.0) {
          rawWindows.push({
            startTs: staticStartTs,
            endTs: lastTs,
            startSec: Number(((staticStartTs - startTime) / 1000).toFixed(1)),
            endSec: Number(((lastTs - startTime) / 1000).toFixed(1)),
            durationSec: Number(duration.toFixed(1)),
            hp: lastHp,
            hpPct: Math.round((lastHp / maxHp) * 100)
          });
        }
      }

      if (rawWindows.length <= 1) return rawWindows;

      // Merge adjacent static windows if separated by <= 2.5s
      const merged: import('@/types/rotation').InvulnerabilityWindow[] = [rawWindows[0]];
      for (let i = 1; i < rawWindows.length; i++) {
        const prev = merged[merged.length - 1];
        const curr = rawWindows[i];
        if (curr.startSec - prev.endSec <= 2.5) {
          prev.endTs = curr.endTs;
          prev.endSec = curr.endSec;
          prev.durationSec = Number((prev.endSec - prev.startSec).toFixed(1));
        } else {
          merged.push(curr);
        }
      }

      return merged;
    } catch (err) {
      console.warn('Failed to detect boss invulnerability windows:', err);
      return [];
    }
  }
}

export const esologsClient = new ESOLogsClient();
