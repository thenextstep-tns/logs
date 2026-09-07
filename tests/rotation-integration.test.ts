import { describe, it, expect } from 'vitest';
import { analyzeRotation } from '@/lib/rotation/analyzer';
import { shootingStarCorpsebursterNecro } from '@/lib/rotation/specs/necromancer-corpseburster';
import { dkParse } from '@/lib/rotation/specs/dk-parse';
import { dkTank } from '@/lib/rotation/specs/dk-tank';
import { esologsClient } from '@/lib/esologs/client';

if (!process.env.ESOLOGS_API_KEY) {
  process.env.ESOLOGS_API_KEY = 'b0c33912ff54c6dad5c4eb12f2ddb981';
}

describe('Rotation Analyzer - Live API Integration Test', () => {
  it('fetches complete cast events and analyzes rotation for fight 25 source 10', async () => {
    const reportId = '7LKMqfRc3ZdCzGJx';
    const fightId = 25;
    const sourceId = 10;

    const reportData = await esologsClient.getReportFights(reportId);
    const fight = reportData.fights.find(f => f.id === fightId);
    const actor = reportData.friendlies?.find(f => f.id === sourceId);

    expect(fight).toBeDefined();
    expect(actor).toBeDefined();

    const casts = await esologsClient.getCastEvents(
      reportId,
      fight!.start_time,
      fight!.end_time,
      sourceId
    );

    expect(casts.length).toBeGreaterThan(300);

    const result = analyzeRotation(
      casts,
      {
        reportId,
        fightId,
        fightName: fight!.name,
        startTime: fight!.start_time,
        endTime: fight!.end_time,
        actorId: sourceId,
        actorName: actor!.name,
        actorDisplayName: actor!.displayName,
        actorClass: actor!.type
      },
      shootingStarCorpsebursterNecro
    );

    expect(result.overallScore).toBeGreaterThan(50);
    expect(result.totalCycles).toBeGreaterThan(20);
    expect(result.timeline.length).toBeGreaterThan(50);
    expect(result.patternStats.length).toBe(4);
    expect(result.idleStats).toBeDefined();
    expect(result.idleStats.totalIdleSec).toBeGreaterThan(0);
    expect(result.idleStats.activeUptimePct).toBeGreaterThan(0);

    // Check that core patterns occurred
    const bbSiphonDot = result.patternStats.find(p => p.id === 'bb-siphon-dot');
    const bbDotDot = result.patternStats.find(p => p.id === 'bb-dot-dot');
    const bbSiphonSiphon = result.patternStats.find(p => p.id === 'bb-siphon-siphon');
    const bbSiphonSkull = result.patternStats.find(p => p.id === 'bb-siphon-skull');

    expect(bbSiphonDot!.observedCount).toBeGreaterThan(0);
    expect(bbDotDot!.observedCount).toBeGreaterThan(0);
    expect(bbSiphonSiphon!.observedCount).toBeGreaterThanOrEqual(0);
    expect(bbSiphonSkull!.observedCount).toBeGreaterThan(0);

    console.log('Real Fight Result:');
    console.log('Overall Score:', result.overallScore, 'Zone:', result.overallZone);
    console.log('Zone Distribution:', result.zoneDistribution);
    console.log('Cadence Stats:', result.cadenceStats);
    console.log('Pattern Stats:', result.patternStats);
  }, 30000);

  it('fetches Crux buffs, Fatecarver damage ticks, and analyzes Arcanist for fight 25 source 4', async () => {
    const reportId = '7LKMqfRc3ZdCzGJx';
    const fightId = 25;
    const sourceId = 4; // Dolmyn Daleri (Arcanist)

    const reportData = await esologsClient.getReportFights(reportId);
    const fight = reportData.fights.find(f => f.id === fightId);
    const actor = reportData.friendlies?.find(f => f.id === sourceId);

    expect(fight).toBeDefined();
    expect(actor).toBeDefined();
    expect(actor!.type).toBe('Arcanist');

    const [casts, buffEvents, damageEvents] = await Promise.all([
      esologsClient.getCastEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getBuffEvents(reportId, fight!.start_time, fight!.end_time, sourceId, 184220),
      esologsClient.getDamageEvents(reportId, fight!.start_time, fight!.end_time, sourceId, 186370)
    ]);

    expect(casts.length).toBeGreaterThan(150);
    expect(buffEvents.length).toBeGreaterThan(80);
    expect(damageEvents.length).toBeGreaterThan(300);

    const { arcanistDPS } = await import('@/lib/rotation/specs/arcanist-dps');

    const result = analyzeRotation(
      casts,
      {
        reportId,
        fightId,
        fightName: fight!.name,
        startTime: fight!.start_time,
        endTime: fight!.end_time,
        actorId: sourceId,
        actorName: actor!.name,
        actorDisplayName: actor!.displayName,
        actorClass: actor!.type
      },
      arcanistDPS,
      {
        buffEvents,
        damageEvents
      }
    );

    expect(result.cruxStats).toBeDefined();
    expect(result.cruxStats!.totalBeams).toBe(30);
    expect(result.cruxStats!.threeCruxBeams).toBe(28);
    expect(result.cruxStats!.underCruxBeams).toBe(2);
    expect(result.cruxStats!.threeCruxPct).toBe(93);

    // Verify the two under-crux beams
    expect(result.cruxStats!.underCruxList.length).toBe(2);
    expect(result.cruxStats!.underCruxList[0].beamIndex).toBe(6);
    expect(result.cruxStats!.underCruxList[0].cruxCount).toBe(1);
    expect(result.cruxStats!.underCruxList[1].beamIndex).toBe(28);
    expect(result.cruxStats!.underCruxList[1].cruxCount).toBe(2);

    // Verify channel uptime
    expect(result.cruxStats!.totalBeamChannelSec).toBeGreaterThan(100);
    expect(result.cruxStats!.beamUptimePct).toBeGreaterThan(40);

    // Verify active uptime reflects channel durations (uptime > 70%)
    expect(result.idleStats.activeUptimePct).toBeGreaterThan(70);

    console.log('Arcanist Real Fight Result:');
    console.log('Total Beams:', result.cruxStats!.totalBeams);
    console.log('3-Crux Beams:', result.cruxStats!.threeCruxBeams, `(${result.cruxStats!.threeCruxPct}%)`);
    console.log('Under-Crux Beams:', result.cruxStats!.underCruxList);
    console.log('Beam Channel Time:', result.cruxStats!.totalBeamChannelSec, `s (${result.cruxStats!.beamUptimePct}%)`);
    console.log('Active Uptime:', result.idleStats.activeUptimePct, '%');
    console.log('Top Feedback:', result.topFeedback);
  }, 30000);

  it('fetches Sorcerer buffs, Ultimate series, and analyzes real Sorcerer rotation for fight 21 source 6', async () => {
    const reportId = 'zHCFNYL8Whcqfypn';
    const fightId = 21;
    const sourceId = 6; // Fëalion (Sorcerer)

    const reportData = await esologsClient.getReportFights(reportId);
    const fight = reportData.fights.find(f => f.id === fightId);
    const actor = reportData.friendlies?.find(f => f.id === sourceId);

    expect(fight).toBeDefined();
    expect(actor).toBeDefined();
    expect(actor!.type).toBe('Sorcerer');

    const [casts, buffEvents, damageEvents, buffTable, ultSeries] = await Promise.all([
      esologsClient.getCastEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getBuffEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getDamageEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getBuffTable(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getUltimateResourceSeries(reportId, fight!.start_time, fight!.end_time, sourceId)
    ]);

    expect(casts.length).toBeGreaterThan(200);
    expect(buffEvents.length).toBeGreaterThan(1000);
    expect(damageEvents.length).toBeGreaterThan(1000);
    expect(ultSeries.length).toBeGreaterThan(100);

    const { sorcererDPS } = await import('@/lib/rotation/specs/sorcerer-dps');

    const result = analyzeRotation(
      casts,
      {
        reportId,
        fightId,
        fightName: fight!.name,
        startTime: fight!.start_time,
        endTime: fight!.end_time,
        actorId: sourceId,
        actorName: actor!.name,
        actorDisplayName: actor!.displayName,
        actorClass: actor!.type
      },
      sorcererDPS,
      {
        buffEvents,
        damageEvents,
        buffTable,
        ultimateSeries: ultSeries
      }
    );

    expect(result.sorcStats).toBeDefined();
    expect(result.sorcStats!.totalFragsCasts).toBe(27);
    expect(result.sorcStats!.procFragsCasts).toBeGreaterThan(20);
    expect(result.sorcStats!.totalArmamentsCasts).toBe(18);
    expect(result.sorcStats!.totalKnifeCasts).toBe(25);
    expect(result.sorcStats!.totalCurseCasts).toBe(12);
    expect(result.sorcStats!.hasShatteredPathsSignet).toBe(true);
    expect(result.sorcStats!.minUltimateValue).toBe(40);
    expect(result.sorcStats!.ultimateBelow133Count).toBeGreaterThan(0);

    // Verify cross-class Light Attack damage hit validation
    expect(result.idleStats.connectedLAsCount).toBeDefined();
    expect(result.idleStats.connectedLAsCount!).toBeGreaterThan(50);
    expect(result.idleStats.emptyLAsCount!).toBeGreaterThan(0);
    expect(result.idleStats.laHitRatePct!).toBeGreaterThan(60);

    console.log('Sorcerer Real Fight Result:');
    console.log('Frags:', `${result.sorcStats!.procFragsCasts}/${result.sorcStats!.totalFragsCasts} procs (${result.sorcStats!.fragProcEfficiencyPct}%)`);
    console.log('Bound Armaments:', `${result.sorcStats!.optimalArmamentsCasts}/${result.sorcStats!.totalArmamentsCasts} optimal (avg ${result.sorcStats!.avgStacksAtCast} stacks)`);
    console.log('Status Knife:', `${result.sorcStats!.totalKnifeCasts} casts, avg interval ${result.sorcStats!.avgKnifeIntervalSec}s`);
    console.log('Curse:', `${result.sorcStats!.recastBeforeSecondExplosionCount} recasts clipped 2nd explosion`);
    console.log('Shattered Paths:', `min Ult = ${result.sorcStats!.minUltimateValue}, sub-133 count = ${result.sorcStats!.ultimateBelow133Count}`);
    console.log('Light Attack Hit Rate:', `${result.idleStats.laHitRatePct}% (${result.idleStats.connectedLAsCount} connected / ${result.idleStats.totalLightAttacks} casts; ${result.idleStats.emptyLAsCount} empty)`);
  }, 30000);

  it('fetches DK casts, debuffs, buffs, and analyzes Flame Lash DPS for fight 21 source 11', async () => {
    const reportId = 'zHCFNYL8Whcqfypn';
    const fightId = 21;
    const sourceId = 11; // Valomgar (Dragonknight)

    const reportData = await esologsClient.getReportFights(reportId);
    const fight = reportData.fights.find(f => f.id === fightId);
    const actor = reportData.friendlies?.find(f => f.id === sourceId);

    expect(fight).toBeDefined();
    expect(actor).toBeDefined();
    expect(actor!.type.toLowerCase()).toBe('dragonknight');

    const [casts, buffEvents, damageEvents, buffTable, debuffTable, ultSeries] = await Promise.all([
      esologsClient.getCastEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getBuffEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getDamageEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getBuffTable(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getTargetDebuffTable(reportId, fight!.start_time, fight!.end_time),
      esologsClient.getUltimateResourceSeries(reportId, fight!.start_time, fight!.end_time, sourceId)
    ]);

    expect(casts.length).toBeGreaterThan(100);

    const result = analyzeRotation(
      casts,
      {
        reportId,
        fightId,
        fightName: fight!.name,
        startTime: fight!.start_time,
        endTime: fight!.end_time,
        actorId: sourceId,
        actorName: actor!.name,
        actorDisplayName: actor!.displayName,
        actorClass: actor!.type
      },
      dkParse,
      {
        buffEvents,
        damageEvents,
        buffTable,
        debuffTable,
        ultimateSeries: ultSeries
      }
    );

    expect(result.dkStats).toBeDefined();
    expect(result.dkStats!.whipMiniGame).toBeDefined();
    expect(result.dkStats!.whipMiniGame!.morph).toBe('flame_lash');
    expect(result.dkStats!.whipMiniGame!.totalCasts).toBeGreaterThan(0);

    console.log('Valomgar DK Real Fight Result:');
    console.log('Whip Morph:', result.dkStats!.whipMiniGame!.morph);
    console.log('Flame Lash casts:', result.dkStats!.whipMiniGame!.totalCasts);
    console.log('Casts in Off-Balance:', result.dkStats!.whipMiniGame!.castsInOffBalance);
    console.log('Reaction Delay:', result.dkStats!.whipMiniGame!.reactionDelayMs, 'ms');
    console.log('Top Feedback:', result.topFeedback);
  }, 30000);

  it('fetches DK casts, buffs, and analyzes Molten Whip DPS for fight 21 source 9', async () => {
    const reportId = 'zHCFNYL8Whcqfypn';
    const fightId = 21;
    const sourceId = 9; // Siradam (Dragonknight)

    const reportData = await esologsClient.getReportFights(reportId);
    const fight = reportData.fights.find(f => f.id === fightId);
    const actor = reportData.friendlies?.find(f => f.id === sourceId);

    expect(fight).toBeDefined();
    expect(actor).toBeDefined();
    expect(actor!.type.toLowerCase()).toBe('dragonknight');

    const [casts, buffEvents, damageEvents, buffTable, debuffTable, ultSeries] = await Promise.all([
      esologsClient.getCastEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getBuffEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getDamageEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getBuffTable(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getTargetDebuffTable(reportId, fight!.start_time, fight!.end_time),
      esologsClient.getUltimateResourceSeries(reportId, fight!.start_time, fight!.end_time, sourceId)
    ]);

    expect(casts.length).toBeGreaterThan(100);

    const result = analyzeRotation(
      casts,
      {
        reportId,
        fightId,
        fightName: fight!.name,
        startTime: fight!.start_time,
        endTime: fight!.end_time,
        actorId: sourceId,
        actorName: actor!.name,
        actorDisplayName: actor!.displayName,
        actorClass: actor!.type
      },
      dkParse,
      {
        buffEvents,
        damageEvents,
        buffTable,
        debuffTable,
        ultimateSeries: ultSeries
      }
    );

    expect(result.dkStats).toBeDefined();
    expect(result.dkStats!.whipMiniGame).toBeDefined();
    expect(result.dkStats!.whipMiniGame!.morph).toBe('molten_whip');
    expect(result.dkStats!.whipMiniGame!.totalCasts).toBeGreaterThan(0);
    expect(result.dkStats!.whipMiniGame!.seethingFuryThreeStackPct).toBeGreaterThan(0);

    console.log('Siradam DK Real Fight Result:');
    console.log('Whip Morph:', result.dkStats!.whipMiniGame!.morph);
    console.log('Molten Whip casts:', result.dkStats!.whipMiniGame!.totalCasts);
    console.log('3-Stack Seething Fury %:', result.dkStats!.whipMiniGame!.seethingFuryThreeStackPct, '%');
    console.log('Top Feedback:', result.topFeedback);
  }, 30000);

  it('fetches DK casts, debuff table, and analyzes DK Tank for fight 21 source 7', async () => {
    const reportId = 'zHCFNYL8Whcqfypn';
    const fightId = 21;
    const sourceId = 7; // Panthera Loricatus (DK Tank)

    const reportData = await esologsClient.getReportFights(reportId);
    const fight = reportData.fights.find(f => f.id === fightId);
    const actor = reportData.friendlies?.find(f => f.id === sourceId);

    expect(fight).toBeDefined();
    expect(actor).toBeDefined();
    expect(actor!.type.toLowerCase()).toBe('dragonknight');

    const [casts, debuffTable] = await Promise.all([
      esologsClient.getCastEvents(reportId, fight!.start_time, fight!.end_time, sourceId),
      esologsClient.getTargetDebuffTable(reportId, fight!.start_time, fight!.end_time)
    ]);

    expect(casts.length).toBeGreaterThan(50);
    expect(debuffTable.length).toBeGreaterThan(0);

    const result = analyzeRotation(
      casts,
      {
        reportId,
        fightId,
        fightName: fight!.name,
        startTime: fight!.start_time,
        endTime: fight!.end_time,
        actorId: sourceId,
        actorName: actor!.name,
        actorDisplayName: actor!.displayName,
        actorClass: actor!.type
      },
      dkTank,
      {
        debuffTable
      }
    );

    expect(result.dkStats).toBeDefined();
    expect(result.dkStats!.specVariant).toBe('tank');
    expect(result.dkStats!.tankDebuffs).toBeDefined();
    expect(result.dkStats!.tankDebuffs!.tauntUptimePct).toBeGreaterThan(0);
    expect(result.dkStats!.tankDebuffs!.majorBreachUptimePct).toBeGreaterThan(0);

    console.log('Panthera Loricatus DK Tank Real Fight Result:');
    console.log('Taunt Uptime:', result.dkStats!.tankDebuffs!.tauntUptimePct, '%');
    console.log('Major Breach Uptime:', result.dkStats!.tankDebuffs!.majorBreachUptimePct, '%');
    console.log('Crusher Uptime:', result.dkStats!.tankDebuffs!.crusherUptimePct, '%');
    console.log('Maim Uptime:', result.dkStats!.tankDebuffs!.maimUptimePct, '%');
    console.log('Top Feedback:', result.topFeedback);
  }, 30000);
});

