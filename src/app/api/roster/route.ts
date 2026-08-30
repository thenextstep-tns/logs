import { NextRequest, NextResponse } from 'next/server';
import { esologsClient } from '@/lib/esologs/client';
import { aggregateRosterData } from '@/lib/esologs/aggregator';
import { getCachedSummary, setCachedSummary } from '@/lib/esologs/cache';
import { FightSummaryResponse, SupportFilter } from '@/types/esologs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bossIdParam = searchParams.get('bossId');
    const minTimeParam = searchParams.get('minTime');
    const maxTimeParam = searchParams.get('maxTime');
    const difficultyParam = searchParams.get('difficulty');

    // Support filter parameters
    const tank1 = searchParams.get('tank1');
    const tank2 = searchParams.get('tank2');
    const healer1 = searchParams.get('healer1');
    const healer2 = searchParams.get('healer2');

    const supportFilter: SupportFilter | undefined =
      tank1 && tank2 && healer1 && healer2
        ? { tank1, tank2, healer1, healer2 }
        : undefined;

    if (!bossIdParam) {
      return NextResponse.json(
        { success: false, error: 'bossId is required' },
        { status: 400 }
      );
    }

    const bossId = parseInt(bossIdParam, 10);
    const minTime = minTimeParam ? parseInt(minTimeParam, 10) : 0;
    const maxTime = maxTimeParam ? parseInt(maxTimeParam, 10) : Infinity;
    const difficulty = difficultyParam ? parseInt(difficultyParam, 10) : undefined;

    // 1. Fetch rankings for boss with auto-resolved or selected difficulty
    const { rankings, difficulty: resolvedDiff, difficultyLabel, availableDifficulties } =
      await esologsClient.getAllBossRankings(bossId, difficulty);

    // 2. Filter rankings within the user-selected kill duration window
    const filteredReports = rankings.filter(
      r => r.duration >= minTime && r.duration <= maxTime
    );

    if (filteredReports.length === 0) {
      const emptyAggregated = aggregateRosterData(bossId, [], minTime, maxTime, supportFilter);
      emptyAggregated.difficulty = resolvedDiff;
      emptyAggregated.difficultyLabel = difficultyLabel;
      emptyAggregated.availableDifficulties = availableDifficulties;

      return NextResponse.json({
        success: true,
        data: emptyAggregated,
        message: 'No reports found within the selected kill time range.'
      });
    }

    // Deduplicate report + fight combinations
    const uniqueKillsMap = new Map<string, { reportID: string; fightID: number; duration: number }>();
    for (const r of filteredReports) {
      const key = `${r.reportID}_${r.fightID}`;
      if (!uniqueKillsMap.has(key)) {
        uniqueKillsMap.set(key, {
          reportID: r.reportID,
          fightID: r.fightID,
          duration: r.duration
        });
      }
    }

    const uniqueKills = Array.from(uniqueKillsMap.values());

    // 3. Fetch summary for each unique kill concurrently in batches
    const summaries: FightSummaryResponse[] = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < uniqueKills.length; i += BATCH_SIZE) {
      const batch = uniqueKills.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (item) => {
        const cacheKey = `${item.reportID}_${item.fightID}`;
        const cached = getCachedSummary(cacheKey);
        if (cached) return cached;

        try {
          const fightsData = await esologsClient.getReportFights(item.reportID);
          const fight = fightsData.fights?.find(f => f.id === item.fightID);
          if (!fight) return null;

          const summary = await esologsClient.getFightSummary(
            item.reportID,
            fight.start_time,
            fight.end_time
          );

          if (summary) {
            setCachedSummary(cacheKey, summary);
          }
          return summary;
        } catch (err) {
          console.warn(`Failed to fetch summary for ${item.reportID} fight ${item.fightID}:`, err);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        if (res) summaries.push(res);
      }
    }

    // 4. Aggregate data
    const aggregated = aggregateRosterData(bossId, summaries, minTime, maxTime, supportFilter);
    aggregated.difficulty = resolvedDiff;
    aggregated.difficultyLabel = difficultyLabel;
    aggregated.availableDifficulties = availableDifficulties;

    return NextResponse.json({
      success: true,
      data: aggregated
    });
  } catch (error: any) {
    console.error('Error in roster API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to aggregate roster data' },
      { status: 500 }
    );
  }
}
