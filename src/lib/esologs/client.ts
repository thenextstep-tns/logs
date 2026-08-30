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
    if (!this.apiKey) {
      throw new Error('ESOlogs API Key is missing. Please check ESOLOGS_API_KEY / ESOLOGS_CLIENT_SECRET.');
    }

    const searchParams = new URLSearchParams({
      api_key: this.apiKey,
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
   * Fetches report fight metadata
   */
  async getReportFights(reportId: string): Promise<{ title: string; zone: number; fights: Array<{ id: number; start_time: number; end_time: number; boss: number; name: string }> }> {
    return this.fetchJson(`report/fights/${reportId}`);
  }

  /**
   * Fetches summary table for a fight
   */
  async getFightSummary(reportId: string, startTime: number, endTime: number): Promise<FightSummaryResponse> {
    return this.fetchJson<FightSummaryResponse>(`report/tables/summary/${reportId}`, {
      start: startTime,
      end: endTime
    });
  }
}

export const esologsClient = new ESOLogsClient();
