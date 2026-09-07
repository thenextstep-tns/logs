import { NextRequest, NextResponse } from 'next/server';
import { esologsClient, ESOLogsClient } from '@/lib/esologs/client';
import { resolveSpecForActor } from '@/lib/rotation/specs';
import { analyzeRotation } from '@/lib/rotation/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { url, reportId, fightId, sourceId, actorId, player, actor: actorParam, specId } = body;
    if (sourceId === undefined && actorId !== undefined) sourceId = actorId;
    if (sourceId === undefined && player !== undefined) sourceId = player;
    if (sourceId === undefined && actorParam !== undefined) sourceId = actorParam;

    // Parse URL if provided
    if (url) {
      const parsed = ESOLogsClient.parseReportUrl(url);
      if (parsed.reportId) reportId = parsed.reportId;
      if (parsed.fightId !== undefined && fightId === undefined) fightId = parsed.fightId;
      if (parsed.sourceId !== undefined && sourceId === undefined) sourceId = parsed.sourceId;
    }

    if (!reportId) {
      return NextResponse.json(
        { error: 'A valid ESO Logs report URL or Report ID is required.' },
        { status: 400 }
      );
    }

    // Fetch report fights and friendlies
    const reportData = await esologsClient.getReportFights(reportId);
    if (!reportData || !reportData.fights || reportData.fights.length === 0) {
      return NextResponse.json(
        { error: `No fights found for report ID ${reportId}. Please verify the report code.` },
        { status: 404 }
      );
    }

    // Filter to real player characters (exclude NPCs, pets)
    const realPlayerClasses = new Set([
      'arcanist', 'necromancer', 'dragonknight', 'sorcerer', 'nightblade', 'templar', 'warden'
    ]);
    const isRealPlayer = (f: { type: string }) =>
      realPlayerClasses.has(f.type.toLowerCase().replace(/[\s_-]+/g, ''));

    const realPlayers = (reportData.friendlies || []).filter(isRealPlayer);

    // Resolve Fight (use specified fight, or default to latest boss kill / boss fight)
    let fight = fightId !== undefined ? reportData.fights.find(f => f.id === Number(fightId)) : undefined;
    if (!fight) {
      const bossKills = reportData.fights.filter(f => f.boss > 0 && f.kill);
      if (bossKills.length > 0) {
        fight = bossKills[bossKills.length - 1];
      } else {
        const bossFights = reportData.fights.filter(f => f.boss > 0);
        fight = bossFights.length > 0 ? bossFights[bossFights.length - 1] : reportData.fights[reportData.fights.length - 1];
      }
    }

    // Players active in this fight
    const playersInFight = realPlayers.filter(p => p.fights?.some(fr => fr.id === fight!.id));

    // Resolve Player (Actor)
    let actor: any = undefined;
    if (sourceId !== undefined && sourceId !== null) {
      const num = Number(sourceId);
      if (!isNaN(num)) {
        actor = reportData.friendlies?.find(f => f.id === num);
      }
      if (!actor) {
        const clean = String(sourceId).replace(/^@/, '').toLowerCase().trim();
        actor = reportData.friendlies?.find(
          f => f.name.toLowerCase() === clean || f.displayName?.replace(/^@/, '').toLowerCase() === clean
        );
      }
    }
    if (!actor || (playersInFight.length > 0 && !playersInFight.some(p => p.id === actor!.id))) {
      // Pick first player from this fight (prefer modeled DPS specs if present)
      actor =
        playersInFight.find(p => ['arcanist', 'necromancer', 'sorcerer'].includes(p.type.toLowerCase())) ||
        playersInFight[0] ||
        realPlayers[0] ||
        reportData.friendlies?.[0];
    }

    if (!actor) {
      return NextResponse.json(
        { error: 'No player characters found for this report.' },
        { status: 404 }
      );
    }

    const resolvedFightId = fight.id;
    const resolvedSourceId = actor.id;
    const actorName = actor.name || `Actor #${resolvedSourceId}`;
    const actorClass = actor.type || 'Necromancer';
    const actorDisplayName = actor.displayName;

    // Fetch all cast events for this player in this fight
    const events = await esologsClient.getCastEvents(
      reportId,
      fight.start_time,
      fight.end_time,
      resolvedSourceId
    );

    if (!events || events.length === 0) {
      return NextResponse.json(
        {
          error: `No cast events recorded for ${actorName} in Fight #${resolvedFightId}. The player might not have participated in this fight or the log contains no casts.`,
          reportId,
          reportTitle: reportData.title,
          selectedFightId: resolvedFightId,
          selectedSourceId: resolvedSourceId,
          fights: reportData.fights,
          friendlies: realPlayers.length > 0 ? realPlayers : (reportData.friendlies || [])
        },
        { status: 404 }
      );
    }

    // Resolve spec automatically from player's class with gear and role context
    let actorContext: import('@/lib/rotation/specs').ActorSpecContext | undefined = undefined;
    if (actorClass.toLowerCase().includes('dragonknight') || actorClass.toLowerCase() === 'dk') {
      try {
        const summary = await esologsClient.getFightSummary(reportId, fight.start_time, fight.end_time);
        const allCombatants = [
          ...(summary?.playerDetails?.dps || []),
          ...(summary?.playerDetails?.tanks || []),
          ...(summary?.playerDetails?.healers || [])
        ];
        const foundPlayer = allCombatants.find(p => p.id === resolvedSourceId);
        if (foundPlayer) {
          actorContext = {
            gear: foundPlayer.combatantInfo?.gear,
            specs: foundPlayer.specs,
            casts: events
          };
        } else {
          actorContext = { casts: events };
        }
      } catch (e) {
        actorContext = { casts: events };
      }
    }

    const { spec } = resolveSpecForActor(actorClass, specId, actorContext);

    // Fetch damageEvents & buffTable for all classes (enabling universal LA hit validation and DoT tracking)
    let buffEvents: import('@/types/rotation').RawBuffEvent[] | undefined = undefined;
    let damageEvents: import('@/types/rotation').RawDamageEvent[] | undefined = undefined;
    let buffTable: Array<{ name: string; guid: number; totalUptime: number; type?: number }> | undefined = undefined;
    let ultimateSeries: Array<[number, number]> | undefined = undefined;

    const isArcanist = spec.class.toLowerCase() === 'arcanist' || actorClass.toLowerCase() === 'arcanist';
    const isSorcerer = spec.class.toLowerCase() === 'sorcerer' || actorClass.toLowerCase() === 'sorcerer';
    const isDragonknight =
      spec.class.toLowerCase() === 'dragonknight' ||
      spec.class.toLowerCase() === 'dk' ||
      actorClass.toLowerCase() === 'dragonknight' ||
      actorClass.toLowerCase() === 'dk';

    let debuffTable: any = undefined;

    const fetchPromises: Promise<any>[] = [
      esologsClient.getDamageEvents(
        reportId,
        fight.start_time,
        fight.end_time,
        resolvedSourceId
      ),
      esologsClient.getBuffTable(
        reportId,
        fight.start_time,
        fight.end_time,
        resolvedSourceId
      )
    ];

    if (isArcanist) {
      fetchPromises.push(
        esologsClient.getBuffEvents(
          reportId,
          fight.start_time,
          fight.end_time,
          resolvedSourceId,
          184220 // Crux buff guid
        )
      );
    } else if (isSorcerer) {
      fetchPromises.push(
        esologsClient.getBuffEvents(
          reportId,
          fight.start_time,
          fight.end_time,
          resolvedSourceId
        )
      );
      fetchPromises.push(
        esologsClient.getUltimateResourceSeries(
          reportId,
          fight.start_time,
          fight.end_time,
          resolvedSourceId
        )
      );
    } else if (isDragonknight) {
      fetchPromises.push(
        esologsClient.getBuffEvents(
          reportId,
          fight.start_time,
          fight.end_time,
          resolvedSourceId
        )
      );
      fetchPromises.push(
        esologsClient.getUltimateResourceSeries(
          reportId,
          fight.start_time,
          fight.end_time,
          resolvedSourceId
        )
      );
      fetchPromises.push(
        esologsClient.getTargetDebuffTable(
          reportId,
          fight.start_time,
          fight.end_time
        )
      );
    }

    const resolvedResults = await Promise.all(fetchPromises);
    damageEvents = resolvedResults[0];
    buffTable = resolvedResults[1];
    if (isArcanist) {
      buffEvents = resolvedResults[2];
    } else if (isSorcerer) {
      buffEvents = resolvedResults[2];
      ultimateSeries = resolvedResults[3];
    } else if (isDragonknight) {
      buffEvents = resolvedResults[2];
      ultimateSeries = resolvedResults[3];
      debuffTable = resolvedResults[4];
    }

    // Run rotation analysis engine
    const analysis = analyzeRotation(
      events,
      {
        reportId,
        fightId: fight.id,
        fightName: fight.name,
        startTime: fight.start_time,
        endTime: fight.end_time,
        actorId: resolvedSourceId,
        actorName,
        actorDisplayName,
        actorClass
      },
      spec,
      {
        buffEvents,
        damageEvents,
        buffTable,
        debuffTable,
        ultimateSeries
      }
    );

    return NextResponse.json({
      success: true,
      reportId,
      reportTitle: reportData.title,
      selectedFightId: resolvedFightId,
      selectedSourceId: resolvedSourceId,
      fights: reportData.fights,
      friendlies: realPlayers.length > 0 ? realPlayers : (reportData.friendlies || []),
      analysis
    });
  } catch (error: any) {
    console.error('Rotation Analyzer API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze rotation.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url') || undefined;
  const reportId = searchParams.get('reportId') || undefined;
  const fightIdParam = searchParams.get('fightId');
  const sourceIdParam = searchParams.get('sourceId');
  const specId = searchParams.get('specId') || undefined;

  const fightId = fightIdParam ? parseInt(fightIdParam, 10) : undefined;
  const sourceId = sourceIdParam ? parseInt(sourceIdParam, 10) : undefined;

  const fakeReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ url, reportId, fightId, sourceId, specId }),
    headers: { 'Content-Type': 'application/json' }
  });

  return POST(fakeReq);
}
