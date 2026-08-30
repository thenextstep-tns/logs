import { NextRequest, NextResponse } from 'next/server';
import { esologsClient } from '@/lib/esologs/client';
import { aggregateRosterData } from '@/lib/esologs/aggregator';
import { getCachedSummary, setCachedSummary } from '@/lib/esologs/cache';
import { FightSummaryResponse } from '@/types/esologs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bossIdParam = searchParams.get('bossId');
    const minTimeParam = searchParams.get('minTime');
    const maxTimeParam = searchParams.get('maxTime');

    if (!bossIdParam) {
      return NextResponse.json(
        { success: false, error: 'bossId is required' },
        { status: 400 }
      );
    }

    const bossId = parseInt(bossIdParam, 10);
    const minTime = minTimeParam ? parseInt(minTimeParam, 10) : 0;
    const maxTime = maxTimeParam ? parseInt(maxTimeParam, 10) : Infinity;

    // 1. Fetch all rankings for boss
    const rankings = await esologsClient.getAllBossRankings(bossId);

    // 2. Filter rankings within the user-selected kill duration window
    const filteredReports = rankings.filter(
      r => r.duration >= minTime && r.duration <= maxTime
    );

    if (filteredReports.length === 0) {
      return NextResponse.json({
        success: true,
        data: aggregateRosterData(bossId, [], minTime, maxTime),
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
          // Fetch fight start and end times from report
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
    const aggregated = aggregateRosterData(bossId, summaries, minTime, maxTime);

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
