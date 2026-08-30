import { NextRequest, NextResponse } from 'next/server';
import { esologsClient } from '@/lib/esologs/client';
import { calculateMinMaxKillTimes } from '@/lib/esologs/aggregator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bossIdParam = searchParams.get('bossId');

    if (!bossIdParam) {
      return NextResponse.json(
        { success: false, error: 'bossId parameter is required' },
        { status: 400 }
      );
    }

    const bossId = parseInt(bossIdParam, 10);
    if (isNaN(bossId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bossId parameter' },
        { status: 400 }
      );
    }

    // Fetches all available reports for boss with difficulty=122, kills=2 (via speed rankings)
    const rankings = await esologsClient.getAllBossRankings(bossId);
    const stats = calculateMinMaxKillTimes(rankings);

    return NextResponse.json({
      success: true,
      bossId,
      totalReports: rankings.length,
      totalUniqueKills: stats.totalUniqueKills,
      minDuration: stats.minDuration,
      maxDuration: stats.maxDuration,
      reports: rankings.map(r => ({
        reportID: r.reportID,
        fightID: r.fightID,
        duration: r.duration,
        startTime: r.startTime,
        guildName: r.guildName
      }))
    });
  } catch (error: any) {
    console.error('Error fetching boss reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
