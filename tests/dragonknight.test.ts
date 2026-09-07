import { describe, it, expect } from 'vitest';
import { analyzeRotation } from '@/lib/rotation/analyzer';
import { dkTank } from '@/lib/rotation/specs/dk-tank';
import { dkZenkosh } from '@/lib/rotation/specs/dk-zenkosh';
import { dkParse } from '@/lib/rotation/specs/dk-parse';
import { resolveSpecForActor } from '@/lib/rotation/specs';
import {
  getDragonknightCoachingFeedback,
  KEY_SKILL_EXPLANATIONS
} from '@/lib/rotation/feedback-phrases';
import { generateFullDiscordReport, BossFightContext } from '@/lib/rotation/boss-feedback';
import { RawCastEvent, RawBuffEvent } from '@/types/rotation';

describe('Dragonknight Specs & Auto-detection', () => {
  it('registers all 3 DK specs with correct roles', () => {
    expect(dkTank.id).toBe('dragonknight-tank');
    expect(dkTank.role).toBe('tank');
    expect(dkTank.class).toBe('Dragonknight');

    expect(dkZenkosh.id).toBe('dragonknight-zenkosh');
    expect(dkZenkosh.role).toBe('support_dps');
    expect(dkZenkosh.class).toBe('Dragonknight');

    expect(dkParse.id).toBe('dragonknight-parse');
    expect(dkParse.role).toBe('pure_dps');
    expect(dkParse.class).toBe('Dragonknight');
  });

  it('auto-resolves DK specs based on class string and specId', () => {
    const res1 = resolveSpecForActor('DragonKnight');
    expect(res1.spec.class).toBe('Dragonknight');
    expect(res1.spec.id).toBe('dragonknight-parse');

    const res2 = resolveSpecForActor('dk', 'dragonknight-tank');
    expect(res2.spec.id).toBe('dragonknight-tank');
    expect(res2.spec.role).toBe('tank');

    const res3 = resolveSpecForActor('Dragonknight', 'dragonknight-zenkosh');
    expect(res3.spec.id).toBe('dragonknight-zenkosh');
  });

  it("auto-detects Zenkosh DK when wearing Z'en + Alkosh", () => {
    const context = {
      gear: [
        { setName: "Z'en's Redress", setID: 455 },
        { setName: 'Roar of Alkosh', setID: 232 },
        { setName: 'Zaan', setID: 350 }
      ]
    };
    const res = resolveSpecForActor('DragonKnight', undefined, context);
    expect(res.spec.id).toBe('dragonknight-zenkosh');
    expect(res.spec.name).toBe('Zenkosh Dragonknight (Support DPS)');
  });

  it('auto-detects Tank DK when specs contains Tank or taunt cast', () => {
    const context1 = { specs: ['Tank'] };
    const res1 = resolveSpecForActor('DragonKnight', undefined, context1);
    expect(res1.spec.id).toBe('dragonknight-tank');

    const context2 = {
      casts: [{ ability: { name: 'Pierce Armor', guid: 38254 } }]
    };
    const res2 = resolveSpecForActor('DragonKnight', undefined, context2);
    expect(res2.spec.id).toBe('dragonknight-tank');
  });
});

describe('Dragonknight Cadence Engine', () => {
  const actorId = 10;
  const startTime = 100000;
  const endTime = 160000; // 60s fight

  it('analyzes Magma Fist 3-stack Heat Shock cadence and refresh timing', () => {
    // 3 casts within 6s each -> builds to 3 stacks and optimal refreshes
    const events: RawCastEvent[] = [
      { timestamp: 101000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Magma Fist', guid: 134340 } },
      { timestamp: 107000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Magma Fist', guid: 134340 } }, // 6.0s -> optimal (2nd stack)
      { timestamp: 113000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Magma Fist', guid: 134340 } }, // 6.0s -> optimal (3rd stack)
      { timestamp: 119200, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Magma Fist', guid: 134340 } }, // 6.2s -> optimal (retains 3 stacks)
      { timestamp: 123000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Magma Fist', guid: 134340 } }, // 3.8s -> premature (< 5.0s)
      { timestamp: 132000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Magma Fist', guid: 134340 } }, // 9.0s -> dropped (> 7.2s)
    ];

    const result = analyzeRotation(
      events,
      {
        reportId: 'testReport',
        fightId: 1,
        fightName: 'Test Boss',
        startTime,
        endTime,
        actorId,
        actorName: 'TestDK',
        actorClass: 'Dragonknight'
      },
      dkParse
    );

    expect(result.dkStats).toBeDefined();
    const mf = result.dkStats!.magmaFist!;
    expect(mf).toBeDefined();
    expect(mf.totalCasts).toBe(6);
    expect(mf.optimalRefreshes).toBe(3);
    expect(mf.earlyRefreshes).toBe(1);
    expect(mf.droppedRefreshes).toBe(1);
    expect(mf.heatShockThreeStackUptimePct).toBeGreaterThan(0);

    // Verify warning generated for dropped refresh
    const droppedWarning = result.dkStats!.details.find(d => d.description.includes('Heat Shock dropped'));
    expect(droppedWarning).toBeDefined();
    expect(droppedWarning?.severity).toBe('warning');
  });

  it('analyzes Igneous Weapons 60s group buff uptime and recast cadence', () => {
    const events: RawCastEvent[] = [
      { timestamp: 101000, type: 'cast', sourceID: actorId, targetID: actorId, ability: { name: 'Igneous Weapons', guid: 31874 } },
      { timestamp: 130000, type: 'cast', sourceID: actorId, targetID: actorId, ability: { name: 'Igneous Weapons', guid: 31874 } }, // 29s -> premature (< 45s)
    ];

    const result = analyzeRotation(
      events,
      {
        reportId: 'testReport',
        fightId: 1,
        fightName: 'Test Boss',
        startTime,
        endTime,
        actorId,
        actorName: 'TestDK',
        actorClass: 'Dragonknight'
      },
      dkZenkosh
    );

    const iw = result.dkStats!.igneousWeapons!;
    expect(iw).toBeDefined();
    expect(iw.totalCasts).toBe(2);
    expect(iw.prematureRecasts).toBe(1);
    expect(iw.uptimePct).toBeGreaterThan(80);
  });

  it('analyzes Flame Lash Off-Balance mini-game and tracks dropped DoTs and priority violations', () => {
    const events: RawCastEvent[] = [
      // Magma Fist cast at 101s
      { timestamp: 101000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Magma Fist', guid: 134340 } },
      // Venomous Claw cast at 102s (lasts 20s -> expires at 122s)
      { timestamp: 102000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Venomous Claw', guid: 20925 } },
      // Flames of Oblivion cast at 103s (lasts 15s -> expires at 118s)
      { timestamp: 103000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Flames of Oblivion', guid: 20816 } },
      // Off-Balance window begins at 120s on boss
      // Flame Lash cast inside OB at 120.8s (800ms reaction delay)
      { timestamp: 120800, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Flame Lash', guid: 20779 } },
      // Flame Lash cast at 122.2s -> Flames of Oblivion expired at 118s while casting Lash!
      // Also, Magma Fist was cast at 101s (21.2s ago > 6.5s) -> priority violation!
      { timestamp: 122200, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Flame Lash', guid: 20779 } },
      { timestamp: 123500, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Flame Lash', guid: 20779 } },
    ];

    const debuffTable = [
      {
        name: 'Off Balance',
        guid: 62988,
        totalUptime: 7000,
        totalUses: 1,
        bands: [{ startTime: 120000, endTime: 127000 }]
      }
    ];

    const result = analyzeRotation(
      events,
      {
        reportId: 'testReport',
        fightId: 1,
        fightName: 'Test Boss',
        startTime,
        endTime,
        actorId,
        actorName: 'Valomgar',
        actorClass: 'Dragonknight'
      },
      dkParse,
      { debuffTable }
    );

    const whip = result.dkStats!.whipMiniGame!;
    expect(whip).toBeDefined();
    expect(whip.morph).toBe('flame_lash');
    expect(whip.offBalanceWindowsCount).toBe(1);
    expect(whip.reactionDelayMs).toBe(800);
    expect(whip.castsInOffBalance).toBe(3);

    // Verify expired DoT was detected during Lash
    expect(whip.expiredDotsDuringLash!.length).toBeGreaterThan(0);
    expect(whip.expiredDotsDuringLash!.some(d => d.name === 'Flames of Oblivion')).toBe(true);

    // Verify priority violation was flagged
    expect(whip.priorityViolationsCount).toBeGreaterThan(0);
  });

  it('analyzes Molten Whip Seething Fury mini-game (3-stack vs under-stack ratio)', () => {
    const events: RawCastEvent[] = [
      // Cast 1: under-stack whip
      { timestamp: 102000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Molten Whip', guid: 20805 } },
      // Cast 2: 3-stack whip
      { timestamp: 110000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Molten Whip', guid: 20805 } }
    ];

    const buffEvents: RawBuffEvent[] = [
      // Seething Fury (guid 122658) events
      { timestamp: 101000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Seething Fury', guid: 122658 } }, // 1 stack
      { timestamp: 102000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Seething Fury', guid: 122658 } }, // consumed
      { timestamp: 104000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Seething Fury', guid: 122658 } }, // 1
      { timestamp: 106000, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Seething Fury', guid: 122658 } }, // 2
      { timestamp: 108000, type: 'applybuffstack', stack: 3, sourceID: actorId, targetID: actorId, ability: { name: 'Seething Fury', guid: 122658 } }, // 3
      { timestamp: 110000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Seething Fury', guid: 122658 } } // consumed at 3
    ];

    const result = analyzeRotation(
      events,
      {
        reportId: 'testReport',
        fightId: 1,
        fightName: 'Test Boss',
        startTime,
        endTime,
        actorId,
        actorName: 'Siradam',
        actorClass: 'Dragonknight'
      },
      dkParse,
      { buffEvents }
    );

    const whip = result.dkStats!.whipMiniGame!;
    expect(whip).toBeDefined();
    expect(whip.morph).toBe('molten_whip');
    expect(whip.castsAtThreeStacks).toBe(1);
    expect(whip.castsUnderThreeStacks).toBe(1);
    expect(whip.seethingFuryThreeStackPct).toBe(50);
  });

  it('calculates DK Tank debuff uptimes on the main boss', () => {
    const debuffTable = [
      { name: 'Taunt', guid: 38254, totalUptime: 59000, totalUses: 4 }, // 98%
      { name: 'Major Breach', guid: 61743, totalUptime: 58000, totalUses: 4 }, // 97%
      { name: 'Crusher', guid: 17906, totalUptime: 54000, totalUses: 6 }, // 90%
      { name: 'Minor Maim', guid: 61723, totalUptime: 50000, totalUses: 5 } // 83%
    ];

    const events: RawCastEvent[] = [
      { timestamp: 101000, type: 'cast', sourceID: actorId, targetID: 1, ability: { name: 'Pierce Armor', guid: 38254 } }
    ];

    const result = analyzeRotation(
      events,
      {
        reportId: 'testReport',
        fightId: 1,
        fightName: 'Test Boss',
        startTime,
        endTime,
        actorId,
        actorName: 'Panthera',
        actorClass: 'Dragonknight'
      },
      dkTank,
      { debuffTable }
    );

    expect(result.dkStats).toBeDefined();
    expect(result.dkStats!.specVariant).toBe('tank');
    const td = result.dkStats!.tankDebuffs!;
    expect(td).toBeDefined();
    expect(td.tauntUptimePct).toBeGreaterThanOrEqual(95);
    expect(td.majorBreachUptimePct).toBeGreaterThanOrEqual(90);
    expect(td.crusherUptimePct).toBeGreaterThanOrEqual(85);
  });
});

describe('Dragonknight Coaching Feedback & Discord Report', () => {
  it('generates natural human coaching feedback for DK without robotic SBI labels', () => {
    const feedback = getDragonknightCoachingFeedback({
      bossCount: 3,
      specVariant: 'parse',
      hasMagmaFist: true,
      heatShockThreeStackUptimePct: 88,
      optimalMagmaFistRefreshes: 15,
      earlyMagmaFistRefreshes: 1,
      droppedHeatShockCount: 0,
      avgMagmaFistInterval: 6.1,
      whipMorph: 'flame_lash',
      reactionDelayMs: 900,
      castsInOffBalance: 12,
      offBalanceWindowsCount: 3,
      expiredDotsCount: 0,
      priorityViolationsCount: 0,
      hasIgneousWeapons: false,
      igneousUptimePct: 0,
      earlyIgneousRecasts: 0,
      droppedIgneousWindows: 0,
      penalizedStandardSec: 0,
      isTank: false,
      connectedLAs: 150,
      emptyLAs: 5,
      activeUptimePct: 92,
      totalIdleSec: 4
    });

    expect(feedback.assessment).toBeDefined();
    expect(feedback.strengths.length).toBeGreaterThan(0);
    // Verify no robotic labels exist
    expect(feedback.assessment).not.toContain('SITUATION:');
    expect(feedback.assessment).not.toContain('BEHAVIOR:');
    expect(feedback.assessment).not.toContain('IMPACT:');
    // Verify Heat Shock strength phrase included
    expect(feedback.strengths.some(s => s.includes('Heat Shock'))).toBe(true);
  });

  it('generates a clean Discord report for a Dragonknight encounter', () => {
    const fight: BossFightContext = { id: 1, name: 'Count Ryelaz', kill: true, durationSec: 90 };
    const events: RawCastEvent[] = [
      { timestamp: 101000, type: 'cast', sourceID: 1, targetID: 1, ability: { name: 'Magma Fist', guid: 134340 } },
      { timestamp: 107000, type: 'cast', sourceID: 1, targetID: 1, ability: { name: 'Magma Fist', guid: 134340 } },
      { timestamp: 113000, type: 'cast', sourceID: 1, targetID: 1, ability: { name: 'Flame Lash', guid: 20779 } }
    ];

    const result = analyzeRotation(
      events,
      {
        reportId: 'testRep',
        fightId: 1,
        fightName: 'Count Ryelaz',
        startTime: 100000,
        endTime: 190000,
        actorId: 1,
        actorName: 'Valomgar',
        actorClass: 'Dragonknight'
      },
      dkParse
    );

    const report = generateFullDiscordReport([{ fight, result }]);

    expect(report).toContain('# Rotation Performance Summary — Valomgar (Parse Dragonknight (Pure DPS))');
    expect(report).toContain('### Key Skill Mechanics');
    expect(report).toContain('Magma Fist & Heat Shock');
    expect(report).toContain('Whip Mini-Game (Flame Lash vs Molten Whip)');
    expect(report).toContain('## Count Ryelaz');
    expect(report).toContain('Heat Shock (Magma Fist)');
  });
});
