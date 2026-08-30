import {
  ESOZone,
  ESORankingsResponse,
  FightSummaryResponse
} from '@/types/esologs';

const BASE_URL = 'https://www.esologs.com/v1';

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
    // Exclude single player arenas (Maelstrom, Infinite Archive, Dungeons, Dummy tests)
    // Filter zones that represent 12-player trials (e.g. Aetherian Archive, Hel Ra, Sanctum, Maw, HoF, AS, CR, Sunspire, KA, RG, DSR, SE, LC, etc.)
    const nonTrialKeywords = ['dungeons', 'arenas (group)', 'maelstrom arena', 'iron atronach'];
    return zones.filter(z => {
      const lower = z.name.toLowerCase();
      const isExcluded = nonTrialKeywords.some(kw => lower.includes(kw));
      return !isExcluded && z.encounters && z.encounters.length > 0;
    });
  }

  /**
   * Fetches speed rankings for an encounter (difficulty 122 = Veteran Hard Mode, kills only)
   */
  async getBossRankingsPage(bossId: number, page: number = 1): Promise<ESORankingsResponse> {
    return this.fetchJson<ESORankingsResponse>(`rankings/encounter/${bossId}`, {
      difficulty: 122, // Veteran Hard Mode
      metric: 'speed',
      page
    });
  }

  /**
   * Fetches ALL available speed reports across all pages for a boss
   */
  async getAllBossRankings(bossId: number): Promise<ESORankingsResponse['rankings']> {
    const allRankings: ESORankingsResponse['rankings'] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) { // Safety cap of 10 pages (1000 reports max)
      const res = await this.getBossRankingsPage(bossId, page);
      if (res && Array.isArray(res.rankings) && res.rankings.length > 0) {
        allRankings.push(...res.rankings);
        hasMore = res.hasMorePages === true;
        page++;
      } else {
        hasMore = false;
      }
    }

    return allRankings;
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
