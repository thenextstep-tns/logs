import { describe, it, expect } from 'vitest';
import { extractSorcStats, normalizeCasts, analyzeRotation } from '@/lib/rotation/analyzer';
import { sorcererDPS } from '@/lib/rotation/specs/sorcerer-dps';
import { resolveSpecForActor } from '@/lib/rotation/specs';
import { RawBuffEvent, RawDamageEvent, RawCastEvent } from '@/types/rotation';

describe('Sorcerer DPS Analyzer & Cross-Class Light Attack Validation', () => {
  const fightStart = 100000;
  const fightEnd = 160000; // 60s fight
  const actorId = 10;

  it('resolves Sorcerer DPS spec correctly', () => {
    const { spec, isRecognized } = resolveSpecForActor('Sorcerer');
    expect(isRecognized).toBe(true);
    expect(spec.id).toBe('sorcerer-dps');
    expect(spec.class).toBe('Sorcerer');
    expect(spec.keySkills.anchorSkill.token).toBe('Frags');
  });

  it('detects Crystal Fragments instant procs vs suboptimal hardcasts', () => {
    const casts: RawCastEvent[] = [
      // Cast 1: Procced frags (buff 46327 active)
      { timestamp: 102000, type: 'cast', sourceID: actorId, ability: { name: 'Crystal Fragments', guid: 114716 } },
      // Cast 2: Hardcast frags (no proc buff)
      { timestamp: 105000, type: 'cast', sourceID: actorId, ability: { name: 'Crystal Fragments', guid: 114716 } },
      // Cast 3: Procced frags
      { timestamp: 110000, type: 'cast', sourceID: actorId, ability: { name: 'Crystal Fragments', guid: 114716 } }
    ];

    const buffEvents: RawBuffEvent[] = [
      // Proc for Cast 1
      { timestamp: 101000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } },
      { timestamp: 102000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } },
      // Proc for Cast 3
      { timestamp: 109500, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } },
      { timestamp: 110000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } }
    ];

    const stats = extractSorcStats(casts, fightStart, fightEnd, actorId, { buffEvents });

    expect(stats.totalFragsCasts).toBe(3);
    expect(stats.procFragsCasts).toBe(2);
    expect(stats.hardcastFragsCasts).toBe(1);
    expect(stats.fragProcEfficiencyPct).toBe(66.7);
    expect(stats.details.some(d => d.description.includes('Suboptimal hardcast'))).toBe(true);
  });

  it('validates Bound Armaments stack requirements (optimal at 4+ or 8, suboptimal at < 4)', () => {
    const casts: RawCastEvent[] = [
      // Cast 1: Cast with 4 stacks (optimal)
      { timestamp: 105000, type: 'cast', sourceID: actorId, ability: { name: 'Bound Armaments', guid: 24165 } },
      // Cast 2: Cast with only 2 stacks (suboptimal)
      { timestamp: 115000, type: 'cast', sourceID: actorId, ability: { name: 'Bound Armaments', guid: 24165 } }
    ];

    const buffEvents: RawBuffEvent[] = [
      // Stacks building for Cast 1: 1 -> 2 -> 3 -> 4
      { timestamp: 101000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Bound Armaments', guid: 203447 } },
      { timestamp: 102000, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Bound Armaments', guid: 203447 } },
      { timestamp: 103000, type: 'applybuffstack', stack: 3, sourceID: actorId, targetID: actorId, ability: { name: 'Bound Armaments', guid: 203447 } },
      { timestamp: 104000, type: 'applybuffstack', stack: 4, sourceID: actorId, targetID: actorId, ability: { name: 'Bound Armaments', guid: 203447 } },
      { timestamp: 105050, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Bound Armaments', guid: 203447 } },

      // Stacks building for Cast 2: only 2 stacks
      { timestamp: 111000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Bound Armaments', guid: 203447 } },
      { timestamp: 113000, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Bound Armaments', guid: 203447 } },
      { timestamp: 115050, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Bound Armaments', guid: 203447 } }
    ];

    const stats = extractSorcStats(casts, fightStart, fightEnd, actorId, { buffEvents });

    expect(stats.totalArmamentsCasts).toBe(2);
    expect(stats.optimalArmamentsCasts).toBe(1);
    expect(stats.suboptimalArmamentsCasts).toBe(1);
    expect(stats.details.some(d => d.description.includes('with only 2 stack(s)'))).toBe(true);
  });

  it('tracks Status Knife 1s-before-CD refresh rule (10s CD: optimal 8.5s - 9.8s)', () => {
    const casts: RawCastEvent[] = [
      { timestamp: 100000, type: 'cast', sourceID: actorId, ability: { name: 'Sundering Knife', guid: 217872 } },
      // Refreshed at 9.0s (optimal: ~1s before 10s CD)
      { timestamp: 109000, type: 'cast', sourceID: actorId, ability: { name: 'Sundering Knife', guid: 217872 } },
      // Refreshed at 4.0s later (premature)
      { timestamp: 113000, type: 'cast', sourceID: actorId, ability: { name: 'Sundering Knife', guid: 217872 } },
      // Refreshed at 14.0s later (dropped knife window)
      { timestamp: 127000, type: 'cast', sourceID: actorId, ability: { name: 'Sundering Knife', guid: 217872 } }
    ];

    const stats = extractSorcStats(casts, fightStart, fightEnd, actorId);

    expect(stats.totalKnifeCasts).toBe(4);
    expect(stats.optimalKnifeRefreshes).toBe(1);
    expect(stats.prematureKnifeCount).toBe(1);
    expect(stats.droppedKnifeCount).toBe(1);
  });

  it('flags Haunting Curse recasts that clip the 2nd explosion (< 8.5s)', () => {
    const casts: RawCastEvent[] = [
      { timestamp: 100000, type: 'cast', sourceID: actorId, ability: { name: 'Haunting Curse', guid: 24330 } },
      // Recast at 10.0s later (after 2nd explosion at 8.5s -> optimal)
      { timestamp: 110000, type: 'cast', sourceID: actorId, ability: { name: 'Haunting Curse', guid: 24330 } },
      // Recast at 5.0s later (before 2nd explosion -> clipped error!)
      { timestamp: 115000, type: 'cast', sourceID: actorId, ability: { name: 'Haunting Curse', guid: 24330 } }
    ];

    const stats = extractSorcStats(casts, fightStart, fightEnd, actorId);

    expect(stats.totalCurseCasts).toBe(3);
    expect(stats.optimalCurseRefreshes).toBe(1);
    expect(stats.recastBeforeSecondExplosionCount).toBe(1);
    expect(stats.details.some(d => d.severity === 'error' && d.description.includes('clipping the 2nd explosion'))).toBe(true);
  });

  it('monitors Shattered Paths Signet mythic (ensuring Ultimate never drops below 133)', () => {
    const casts: RawCastEvent[] = [
      { timestamp: 101000, type: 'cast', sourceID: actorId, ability: { name: 'Crystal Fragments', guid: 114716 } }
    ];

    const buffTable = [
      { name: 'Shattered Paths Signet', guid: 261285, totalUptime: 60000 }
    ];

    const ultimateSeries: Array<[number, number]> = [
      [100000, 200],
      [105000, 150],
      [110000, 90], // DROPPED BELOW 133!
      [115000, 140]
    ];

    const stats = extractSorcStats(casts, fightStart, fightEnd, actorId, {
      buffTable,
      ultimateSeries
    });

    expect(stats.hasShatteredPathsSignet).toBe(true);
    expect(stats.minUltimateValue).toBe(90);
    expect(stats.ultimateBelow133Count).toBe(1);
    expect(stats.details.some(d => d.severity === 'error' && d.description.includes('< 133 required minimum'))).toBe(true);
  });

  it('allows Ultimate to drop below 133 during final 5s execute without violation', () => {
    const casts: RawCastEvent[] = [
      { timestamp: 101000, type: 'cast', sourceID: actorId, ability: { name: 'Crystal Fragments', guid: 114716 } }
    ];

    const buffTable = [
      { name: 'Shattered Paths Signet', guid: 261285, totalUptime: 60000 }
    ];

    // Fight is 100000 to 160000. Execute threshold is 155000.
    // Ultimate drops below 133 only at 157000 and 159000 (final 3 seconds).
    const ultimateSeries: Array<[number, number]> = [
      [100000, 200],
      [120000, 180],
      [150000, 150],
      [157000, 50], // in final 5s
      [159000, 20]  // in final 5s
    ];

    const stats = extractSorcStats(casts, fightStart, fightEnd, actorId, {
      buffTable,
      ultimateSeries
    });

    expect(stats.hasShatteredPathsSignet).toBe(true);
    // Should NOT flag as violation because it occurred in final 5s execute
    expect(stats.ultimateBelow133Count).toBe(0);
    expect(stats.minUltimateValue).toBe(150);
    expect(stats.details.some(d => d.description.includes('< 133 required minimum'))).toBe(false);
  });

  it('validates cross-class Light Attack damage events (empty LAs do not count as connected)', () => {
    // 3 GCD casts, each preceded by a Light Attack
    const rawEvents: RawCastEvent[] = [
      // Skill 1: LA at 100000 -> Skill at 100100
      { timestamp: 100000, type: 'cast', sourceID: actorId, ability: { name: 'Light Attack', guid: 1 } },
      { timestamp: 100100, type: 'cast', sourceID: actorId, ability: { name: 'Barbed Trap', guid: 40382 } },

      // Skill 2: LA at 101200 -> Skill at 101300 (Empty LA! No damage event in damageEvents)
      { timestamp: 101200, type: 'cast', sourceID: actorId, ability: { name: 'Light Attack', guid: 1 } },
      { timestamp: 101300, type: 'cast', sourceID: actorId, ability: { name: 'Hurricane', guid: 23231 } },

      // Skill 3: LA at 102400 -> Skill at 102500
      { timestamp: 102400, type: 'cast', sourceID: actorId, ability: { name: 'Light Attack', guid: 1 } },
      { timestamp: 102500, type: 'cast', sourceID: actorId, ability: { name: 'Sundering Knife', guid: 217872 } }
    ];

    // Damage events only connect for LA 1 and LA 3
    const damageEvents: RawDamageEvent[] = [
      { timestamp: 100250, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Light Attack', guid: 1 } },
      { timestamp: 102650, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Light Attack', guid: 1 } }
    ];

    const { normalized } = normalizeCasts(rawEvents, fightStart, sorcererDPS, damageEvents);

    expect(normalized.length).toBe(3);
    // Skill 1 had connected LA
    expect(normalized[0].hasPrecedingLA).toBe(true);
    expect(normalized[0].laHit).toBe(true);

    // Skill 2 had EMPTY LA (cast LA, but dealt 0 damage)
    expect(normalized[1].hasPrecedingLA).toBe(true);
    expect(normalized[1].laHit).toBe(false);

    // Skill 3 had connected LA
    expect(normalized[2].hasPrecedingLA).toBe(true);
    expect(normalized[2].laHit).toBe(true);

    // Full analysis check:
    const result = analyzeRotation(
      rawEvents,
      {
        reportId: 'test-report',
        fightId: 1,
        fightName: 'Test Boss',
        startTime: fightStart,
        endTime: fightStart + 5000,
        actorId,
        actorName: 'TestSorcerer',
        actorClass: 'Sorcerer'
      },
      sorcererDPS,
      {
        damageEvents
      }
    );

    // Only the 2 connected LAs count as successful weaved LAs
    expect(result.idleStats.connectedLAsCount).toBe(2);
    expect(result.idleStats.emptyLAsCount).toBe(1);
    expect(result.idleStats.laHitRatePct).toBe(66.7);
    expect(result.idleStats.weavedLAsCount).toBe(2);
  });

  it('enforces Crystal Fragments Proc Absolute Priority (immediate vs delayed vs expired)', () => {
    // Window 1: Immediate cast (proc at 101000 -> cast Frags at 101500)
    // Window 2: Delayed cast (proc at 105000 -> cast Stampede at 105500 -> cast Hurricane at 106500 -> cast Frags at 107500)
    // Window 3: Expired / Wasted proc (proc at 110000 -> ends at 118000 with only Barbed Trap cast at 111000 and no Frags)
    const casts: RawCastEvent[] = [
      // Window 1: immediate
      { timestamp: 101500, type: 'cast', sourceID: actorId, ability: { name: 'Crystal Fragments', guid: 114716 } },

      // Window 2: delayed by 2 skills
      { timestamp: 105500, type: 'cast', sourceID: actorId, ability: { name: 'Stampede', guid: 126474 } },
      { timestamp: 106500, type: 'cast', sourceID: actorId, ability: { name: 'Hurricane', guid: 23231 } },
      { timestamp: 107500, type: 'cast', sourceID: actorId, ability: { name: 'Crystal Fragments', guid: 114716 } },

      // Window 3: wasted
      { timestamp: 111000, type: 'cast', sourceID: actorId, ability: { name: 'Barbed Trap', guid: 40382 } }
    ];

    const buffEvents: RawBuffEvent[] = [
      // Window 1: 101000 to 101500
      { timestamp: 101000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } },
      { timestamp: 101500, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } },

      // Window 2: 105000 to 107500
      { timestamp: 105000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } },
      { timestamp: 107500, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } },

      // Window 3: 110000 to 118000 (expired without Frags)
      { timestamp: 110000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } },
      { timestamp: 118000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crystal Fragments Proc', guid: 46327 } }
    ];

    const stats = extractSorcStats(casts, fightStart, fightEnd, actorId, { buffEvents });

    expect(stats.totalFragProcsGained).toBe(3);
    expect(stats.immediateFragProcsCount).toBe(1);
    expect(stats.delayedFragProcsCount).toBe(1);
    expect(stats.interveningSkillsDuringProcCount).toBe(3);
    expect(stats.expiredFragProcsCount).toBe(1);
    // 1 immediate out of 3 total = 33.3%
    expect(stats.fragProcImmediateCastPct).toBe(33.3);

    // Verify warning for delayed proc
    const delayedDetail = stats.details.find(d => d.description.includes('delayed for'));
    expect(delayedDetail).toBeDefined();
    expect(delayedDetail?.severity).toBe('warning');
    expect(delayedDetail?.description).toContain('Stampede');
    expect(delayedDetail?.description).toContain('Hurricane');

    // Verify error for expired proc
    const expiredDetail = stats.details.find(d => d.description.includes('Wasted Proc'));
    expect(expiredDetail).toBeDefined();
    expect(expiredDetail?.severity).toBe('error');
    expect(expiredDetail?.description).toContain('expired');
  });
});

