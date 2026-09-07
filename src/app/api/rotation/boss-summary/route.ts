import { NextRequest, NextResponse } from 'next/server';
import { esologsClient, ESOLogsClient } from '@/lib/esologs/client';
import { resolveSpecForActor } from '@/lib/rotation/specs';
import { analyzeRotation } from '@/lib/rotation/analyzer';
import { generateFullDiscordReport, BossFightContext } from '@/lib/rotation/boss-feedback';
import { RotationAnalysisResult } from '@/types/rotation';

export interface BossSummaryRequestOptions {
  url?: string;
  reportId?: string;
  player?: string | number;
  actorId?: string | number;
  specId?: string;
  killsOnly?: boolean;
  includeSummary?: boolean;
  includeKeySkills?: boolean;
  format?: 'text' | 'json';
}

export async function handleBossSummary(
  req: NextRequest,
  options: BossSummaryRequestOptions
): Promise<Response> {
  try {
    let rawReportId = options.reportId || options.url;
    let playerParam = options.player ?? options.actorId;
    const { specId, format = 'json' } = options;
    const killsOnly = options.killsOnly ?? true;
    const includeSummary = options.includeSummary ?? true;
    const includeKeySkills = options.includeKeySkills ?? true;

    if (!rawReportId) {
      return NextResponse.json(
        {
          error:
            'A valid ESO Logs report ID or URL is required. Provide param: "reportId" (e.g. ?reportId=zHCFNYL8Whcqfypn&player=Valomgar).'
        },
        { status: 400 }
      );
    }

    // Support full URLs e.g. https://www.esologs.com/reports/zHCFNYL8Whcqfypn#source=11
    let cleanReportId = String(rawReportId).trim();
    if (cleanReportId.includes('/') || cleanReportId.includes('esologs.com')) {
      const parsed = ESOLogsClient.parseReportUrl(cleanReportId);
      if (parsed.reportId) cleanReportId = parsed.reportId;
      if (parsed.sourceId !== undefined && (playerParam === undefined || playerParam === null)) {
        playerParam = parsed.sourceId;
      }
    }

    const reportId = cleanReportId;
    const reportData = await esologsClient.getReportFights(cleanReportId);
    if (!reportData || !reportData.fights || reportData.fights.length === 0) {
      return NextResponse.json(
        { error: `No fights found for report ID ${cleanReportId}.` },
        { status: 404 }
      );
    }

    // Filter friendlies to player characters
    const friendlyPlayers =
      reportData.friendlies?.filter(
        f => f.type !== 'NPC' && f.type !== 'Pet' && f.type !== 'Boss'
      ) || [];

    let actor: any = undefined;

    if (playerParam !== undefined && playerParam !== null && String(playerParam).trim().length > 0) {
      const playerStr = String(playerParam).trim();
      const playerNum = Number(playerStr);

      // Match by numeric ID
      if (!isNaN(playerNum)) {
        actor = friendlyPlayers.find(f => f.id === playerNum);
      }

      // Match by exact name (case-insensitive)
      if (!actor) {
        const cleanName = playerStr.replace(/^@/, '').toLowerCase();
        actor = friendlyPlayers.find(f => f.name.toLowerCase() === cleanName);
      }

      // Match by exact displayName (case-insensitive)
      if (!actor) {
        const cleanName = playerStr.replace(/^@/, '').toLowerCase();
        actor = friendlyPlayers.find(
          f => f.displayName?.replace(/^@/, '').toLowerCase() === cleanName
        );
      }

      // Match by name or displayName substring / partial match
      if (!actor) {
        const cleanName = playerStr.replace(/^@/, '').toLowerCase();
        actor = friendlyPlayers.find(
          f =>
            f.name.toLowerCase().includes(cleanName) ||
            (f.displayName && f.displayName.toLowerCase().includes(cleanName))
        );
      }

      if (!actor) {
        const available = friendlyPlayers.map(f => `${f.name} (${f.type})`).join(', ');
        return NextResponse.json(
          {
            error: `Player "${playerParam}" was not found in report ${cleanReportId}. Available players: ${available || 'none'}`
          },
          { status: 404 }
        );
      }
    } else {
      // Fallback: pick first DPS/class or first friendly player
      actor =
        friendlyPlayers.find(f =>
          ['sorcerer', 'arcanist', 'necromancer', 'dragonknight'].includes(f.type.toLowerCase())
        ) ||
        friendlyPlayers[0] ||
        reportData.friendlies?.[0];

      if (!actor) {
        return NextResponse.json(
          { error: 'No player character found for this report.' },
          { status: 404 }
        );
      }
    }

    const resolvedActorId = actor.id;
    const actorName = actor.name || `Actor #${resolvedActorId}`;
    const actorClass = actor.type || 'Sorcerer';

    // Filter strictly to boss fights (boss > 0)
    let candidateBossFights = reportData.fights.filter(f => f.boss > 0);

    if (candidateBossFights.length === 0) {
      return NextResponse.json(
        { error: 'No boss fights found in this report (only trash encounters recorded).' },
        { status: 404 }
      );
    }

    // Check if player participated in the fights
    candidateBossFights = candidateBossFights.filter(f => {
      return (
        !actor.fights ||
        actor.fights.length === 0 ||
        actor.fights.some((fr: any) => fr.id === f.id)
      );
    });

    if (candidateBossFights.length === 0) {
      return NextResponse.json(
        { error: `Player ${actorName} did not participate in any recorded boss fights.` },
        { status: 404 }
      );
    }

    // If killsOnly requested, filter to kill === true
    let targetFights = killsOnly
      ? candidateBossFights.filter(f => f.kill === true)
      : candidateBossFights;

    // If killsOnly requested but no kills exist, fallback to all boss pulls
    let killsOnlyApplied = killsOnly;
    if (targetFights.length === 0) {
      targetFights = candidateBossFights;
      killsOnlyApplied = false;
    }

    // Inspect gear and role for DK auto-spec detection (e.g. Zenkosh DK vs Tank DK vs Parse DK)
    let actorContext: import('@/lib/rotation/specs').ActorSpecContext | undefined = undefined;
    if (actorClass.toLowerCase().includes('dragonknight') || actorClass.toLowerCase() === 'dk') {
      const sampleFight = targetFights[0] || candidateBossFights[0];
      if (sampleFight) {
        try {
          const summary = await esologsClient.getFightSummary(
            cleanReportId,
            sampleFight.start_time,
            sampleFight.end_time
          );
          const allCombatants = [
            ...(summary?.playerDetails?.dps || []),
            ...(summary?.playerDetails?.tanks || []),
            ...(summary?.playerDetails?.healers || [])
          ];
          const foundPlayer = allCombatants.find(p => p.id === resolvedActorId);
          if (foundPlayer) {
            actorContext = {
              gear: foundPlayer.combatantInfo?.gear,
              specs: foundPlayer.specs
            };
          }
        } catch (e) {
          // ignore error
        }
      }
    }

    const { spec } = resolveSpecForActor(actorClass, specId, actorContext);

    const isArcanist = spec.class.toLowerCase() === 'arcanist';
    const isSorcerer = spec.class.toLowerCase() === 'sorcerer';
    const isDragonknight =
      spec.class.toLowerCase() === 'dragonknight' ||
      spec.class.toLowerCase() === 'dk';

    // Analyze all target boss encounters
    const items: Array<{ fight: BossFightContext; result: RotationAnalysisResult }> = [];

    // Run parallel analysis for each boss fight
    const fightAnalyses = await Promise.all(
      targetFights.map(async fight => {
        try {
          const events = await esologsClient.getCastEvents(
            reportId,
            fight.start_time,
            fight.end_time,
            resolvedActorId
          );

          if (!events || events.length === 0) return null;

          let debuffTable: any = undefined;

          const fetchPromises: Promise<any>[] = [
            esologsClient.getDamageEvents(
              reportId,
              fight.start_time,
              fight.end_time,
              resolvedActorId
            ),
            esologsClient.getBuffTable(
              reportId,
              fight.start_time,
              fight.end_time,
              resolvedActorId
            )
          ];

          if (isArcanist) {
            fetchPromises.push(
              esologsClient.getBuffEvents(
                reportId,
                fight.start_time,
                fight.end_time,
                resolvedActorId,
                184220
              )
            );
          } else if (isSorcerer) {
            fetchPromises.push(
              esologsClient.getBuffEvents(
                reportId,
                fight.start_time,
                fight.end_time,
                resolvedActorId
              )
            );
            fetchPromises.push(
              esologsClient.getUltimateResourceSeries(
                reportId,
                fight.start_time,
                fight.end_time,
                resolvedActorId
              )
            );
          } else if (isDragonknight) {
            fetchPromises.push(
              esologsClient.getBuffEvents(
                reportId,
                fight.start_time,
                fight.end_time,
                resolvedActorId
              )
            );
            fetchPromises.push(
              esologsClient.getUltimateResourceSeries(
                reportId,
                fight.start_time,
                fight.end_time,
                resolvedActorId
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

          const resolvedFetches = await Promise.all(fetchPromises);
          const damageEvents = resolvedFetches[0];
          const buffTable = resolvedFetches[1];
          const buffEvents = resolvedFetches[2];
          const ultimateSeries = (isSorcerer || isDragonknight) ? resolvedFetches[3] : undefined;
          if (isDragonknight) {
            debuffTable = resolvedFetches[4];
          }

          const durationSec = Number(((fight.end_time - fight.start_time) / 1000).toFixed(1));

          const result = analyzeRotation(
            events,
            {
              reportId,
              fightId: fight.id,
              fightName: fight.name,
              startTime: fight.start_time,
              endTime: fight.end_time,
              actorId: resolvedActorId,
              actorName,
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

          const fightContext: BossFightContext = {
            id: fight.id,
            name: fight.name,
            kill: fight.kill,
            durationSec
          };

          return { fight: fightContext, result };
        } catch (err) {
          console.error(`Failed analyzing fight #${fight.id} ${fight.name}:`, err);
          return null;
        }
      })
    );

    for (const item of fightAnalyses) {
      if (item) items.push(item);
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No skill casts found for this player in any of the boss encounters.' },
        { status: 404 }
      );
    }

    const discordText = generateFullDiscordReport(items, {
      includeSummary,
      includeKeySkills
    });
    const discordTextWithExplanations = generateFullDiscordReport(items, {
      includeSummary: true,
      includeKeySkills: true
    });
    const discordTextWithoutExplanations = generateFullDiscordReport(items, {
      includeSummary: true,
      includeKeySkills: false
    });

    const wantsPlainText =
      format === 'text' ||
      req.headers.get('accept')?.includes('text/plain');

    if (wantsPlainText) {
      return new Response(discordText, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Actor-Name': actorName,
          'X-Actor-Class': actorClass,
          'X-Spec-Name': spec.name,
          'X-Boss-Count': String(items.length)
        }
      });
    }

    return NextResponse.json({
      success: true,
      reportId: cleanReportId,
      reportTitle: reportData.title,
      player: {
        id: resolvedActorId,
        name: actorName,
        displayName: actor.displayName,
        class: actorClass,
        specId: spec.id,
        specName: spec.name
      },
      actorName,
      actorClass,
      specName: spec.name,
      bossCount: items.length,
      totalCandidateBossFights: candidateBossFights.length,
      killsOnly: killsOnlyApplied,
      reportText: discordText,
      discordTextWithExplanations,
      discordTextWithoutExplanations,
      bossFightsList: items.map(i => ({
        id: i.fight.id,
        name: i.fight.name,
        kill: i.fight.kill,
        durationSec: i.fight.durationSec
      }))
    });
  } catch (err: any) {
    console.error('Boss summary API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate boss feedback.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reportId =
    searchParams.get('reportId') ||
    searchParams.get('report') ||
    searchParams.get('url') ||
    undefined;
  const player =
    searchParams.get('player') ||
    searchParams.get('actor') ||
    searchParams.get('playerName') ||
    searchParams.get('user') ||
    searchParams.get('actorId') ||
    searchParams.get('source') ||
    undefined;
  const specId = searchParams.get('specId') || searchParams.get('spec') || undefined;

  const killsOnly = searchParams.has('killsOnly')
    ? searchParams.get('killsOnly') === 'true' || searchParams.get('killsOnly') === '1'
    : searchParams.has('onlyKills')
      ? searchParams.get('onlyKills') === 'true' || searchParams.get('onlyKills') === '1'
      : true;

  const includeSummary = searchParams.has('includeSummary')
    ? searchParams.get('includeSummary') === 'true' || searchParams.get('includeSummary') === '1'
    : true;

  const includeKeySkills = searchParams.has('includeKeySkills')
    ? searchParams.get('includeKeySkills') === 'true' || searchParams.get('includeKeySkills') === '1'
    : searchParams.has('includeExplanations')
      ? searchParams.get('includeExplanations') === 'true' || searchParams.get('includeExplanations') === '1'
      : true;

  const format = searchParams.get('format') === 'text' ? 'text' : 'json';

  return handleBossSummary(req, {
    reportId,
    player,
    specId,
    killsOnly,
    includeSummary,
    includeKeySkills,
    format
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    url,
    reportId,
    report,
    player,
    actor,
    actorId,
    playerName,
    sourceId,
    specId,
    spec,
    killsOnly = true,
    onlyKills,
    includeSummary = true,
    includeKeySkills = true,
    includeExplanations,
    format
  } = body;

  const resolvedReportId = reportId || report || url;
  const resolvedPlayer = player ?? actor ?? actorId ?? playerName ?? sourceId;
  const resolvedKillsOnly = onlyKills !== undefined ? onlyKills : killsOnly;
  const resolvedKeySkills =
    includeExplanations !== undefined ? includeExplanations : includeKeySkills;
  const resolvedSpecId = specId || spec;

  return handleBossSummary(req, {
    url,
    reportId: resolvedReportId,
    player: resolvedPlayer,
    specId: resolvedSpecId,
    killsOnly: resolvedKillsOnly,
    includeSummary,
    includeKeySkills: resolvedKeySkills,
    format: format === 'text' ? 'text' : 'json'
  });
}
