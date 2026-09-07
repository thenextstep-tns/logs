import { describe, it, expect } from 'vitest';
import { extractCruxAndBeams, normalizeCasts, analyzeRotation } from '@/lib/rotation/analyzer';
import { arcanistDPS } from '@/lib/rotation/specs/arcanist-dps';
import { RawBuffEvent, RawDamageEvent, RawCastEvent } from '@/types/rotation';

describe('Arcanist Analyzer - Crux Coordination & Fatecarver Channeling', () => {
  const fightStart = 100000;
  const fightEnd = 160000; // 60s fight
  const actorId = 4;

  it('correctly coordinates 3-Crux and under-Crux Fatecarver beams', () => {
    // Simulate Crux buff events
    const buffEvents: RawBuffEvent[] = [
      // Beam 1: built to 3 Crux, then consumed
      { timestamp: 102000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 103000, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 104000, type: 'applybuffstack', stack: 3, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 105000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },

      // Beam 2: only built to 1 Crux, then consumed prematurely (<3 Crux!)
      { timestamp: 112000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 114000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },

      // Beam 3: built to 2 Crux (<3 Crux!)
      { timestamp: 120000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 121000, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 123000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },

      // Beam 4: built to 3 Crux
      { timestamp: 130000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 131000, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 132000, type: 'applybuffstack', stack: 3, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 133000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } }
    ];

    // Simulate Fatecarver damage ticks
    const damageEvents: RawDamageEvent[] = [
      // Ticks for Beam 1 (4.2s channel)
      { timestamp: 105300, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } },
      { timestamp: 106000, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } },
      { timestamp: 108900, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } },

      // Ticks for Beam 2 (2.5s channel)
      { timestamp: 114300, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } },
      { timestamp: 116200, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } },

      // Ticks for Beam 3 (3.0s channel)
      { timestamp: 123300, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } },
      { timestamp: 125700, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } },

      // Ticks for Beam 4 (4.5s channel)
      { timestamp: 133300, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } },
      { timestamp: 137200, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } }
    ];

    const { cruxStats, synthesizedBeams } = extractCruxAndBeams(
      buffEvents,
      damageEvents,
      fightStart,
      fightEnd,
      actorId
    );

    expect(cruxStats.totalBeams).toBe(4);
    expect(cruxStats.threeCruxBeams).toBe(2);
    expect(cruxStats.underCruxBeams).toBe(2);
    expect(cruxStats.threeCruxPct).toBe(50);

    // Check individual beams
    expect(cruxStats.beams[0].cruxBefore).toBe(3);
    expect(cruxStats.beams[0].isOptimal).toBe(true);

    expect(cruxStats.beams[1].cruxBefore).toBe(1);
    expect(cruxStats.beams[1].isOptimal).toBe(false);

    expect(cruxStats.beams[2].cruxBefore).toBe(2);
    expect(cruxStats.beams[2].isOptimal).toBe(false);

    expect(cruxStats.beams[3].cruxBefore).toBe(3);
    expect(cruxStats.beams[3].isOptimal).toBe(true);

    // Verify underCruxList
    expect(cruxStats.underCruxList.length).toBe(2);
    expect(cruxStats.underCruxList[0].beamIndex).toBe(2);
    expect(cruxStats.underCruxList[0].cruxCount).toBe(1);
    expect(cruxStats.underCruxList[1].beamIndex).toBe(3);
    expect(cruxStats.underCruxList[1].cruxCount).toBe(2);

    // Verify synthesized beams
    expect(synthesizedBeams.length).toBe(4);
    expect(synthesizedBeams[0].ability.name).toBe('Pragmatic Fatecarver');
    expect((synthesizedBeams[0] as any).channelDurationMs).toBeGreaterThan(3000);
  });

  it('treats Fatecarver beam channel as active casting uptime with 0 idle penalty', () => {
    const rawCasts: RawCastEvent[] = [
      {
        timestamp: 100000,
        type: 'cast',
        sourceID: actorId,
        ability: { name: "Cephaliarch's Flail", guid: 183006 }
      },
      // Channeled Fatecarver (4.5s channel)
      {
        timestamp: 101000,
        type: 'cast',
        sourceID: actorId,
        ability: { name: 'Pragmatic Fatecarver', guid: 186370 },
        channelDurationMs: 4500
      } as any,
      // Next skill starts right at 105600ms (100ms after channel finishes)
      {
        timestamp: 105600,
        type: 'cast',
        sourceID: actorId,
        ability: { name: 'Fulminating Rune', guid: 182988 }
      }
    ];

    const { normalized } = normalizeCasts(rawCasts, 100000, arcanistDPS);

    expect(normalized.length).toBe(3);
    // Flail gap is 1000ms, idle is 0ms
    expect(normalized[0].idleTimeMs).toBe(0);

    // Fatecarver gap to next skill is 4600ms (105600 - 101000)
    expect(normalized[1].gapToNextSkillMs).toBe(4600);
    // Because channelDurationMs is 4500ms, idle time is only 4600 - 4500 = 100ms!
    expect(normalized[1].idleTimeMs).toBe(100);
  });

  it('runs full rotation analysis for Arcanist DPS spec', () => {
    const buffEvents: RawBuffEvent[] = [
      { timestamp: 100500, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 101500, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 102500, type: 'applybuffstack', stack: 3, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 103500, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } }
    ];

    const damageEvents: RawDamageEvent[] = [
      { timestamp: 103800, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } },
      { timestamp: 107500, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 } }
    ];

    const casts: RawCastEvent[] = [
      { timestamp: 100450, type: 'cast', sourceID: actorId, ability: { name: 'Light Attack (Dual Wield)', guid: 16565 } },
      { timestamp: 100500, type: 'cast', sourceID: actorId, ability: { name: "Cephaliarch's Flail", guid: 183006 } },
      { timestamp: 101450, type: 'cast', sourceID: actorId, ability: { name: 'Light Attack (Dual Wield)', guid: 16565 } },
      { timestamp: 101500, type: 'cast', sourceID: actorId, ability: { name: "Cephaliarch's Flail", guid: 183006 } },
      { timestamp: 102450, type: 'cast', sourceID: actorId, ability: { name: 'Light Attack (Dual Wield)', guid: 16565 } },
      { timestamp: 102500, type: 'cast', sourceID: actorId, ability: { name: 'Fulminating Rune', guid: 182988 } }
    ];

    const result = analyzeRotation(
      casts,
      {
        reportId: 'test-report',
        fightId: 1,
        fightName: 'Test Boss',
        startTime: 100000,
        endTime: 115000,
        actorId,
        actorName: 'Arcanist Player',
        actorClass: 'Arcanist'
      },
      arcanistDPS,
      {
        buffEvents,
        damageEvents
      }
    );

    expect(result.cruxStats).toBeDefined();
    expect(result.cruxStats?.totalBeams).toBe(1);
    expect(result.cruxStats?.threeCruxBeams).toBe(1);
    expect(result.cruxStats?.threeCruxPct).toBe(100);
    expect(result.spec.class).toBe('Arcanist');
    expect(result.patternStats.length).toBe(0);
    expect(result.cycles.length).toBe(0);
  });

  it('dynamically extracts DoT uptimes without hardcoding', async () => {
    const { extractDynamicDoTUptimes } = await import('@/lib/rotation/analyzer');

    const damageEvents: RawDamageEvent[] = [
      // Stampede ticks at 1s intervals
      { timestamp: 10000, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Stampede', guid: 126474 } },
      { timestamp: 11000, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Stampede', guid: 126474 } },
      { timestamp: 12000, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Stampede', guid: 126474 } },
      { timestamp: 13000, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Stampede', guid: 126474 } },
      // Fulminating Rune ticks
      { timestamp: 15000, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Fulminating Rune', guid: 182989 } },
      { timestamp: 17000, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Fulminating Rune', guid: 182989 } }
    ];

    const buffTable = [
      { name: 'Quick Cloak', guid: 38901, totalUptime: 8000 }
    ];

    const casts: RawCastEvent[] = [
      { timestamp: 9500, type: 'cast', sourceID: actorId, ability: { name: 'Stampede', guid: 38788 } },
      { timestamp: 14500, type: 'cast', sourceID: actorId, ability: { name: 'Fulminating Rune', guid: 182988 } },
      { timestamp: 18000, type: 'cast', sourceID: actorId, ability: { name: 'Quick Cloak', guid: 38901 } }
    ];

    const fightDurationSec = 20;
    const dots = extractDynamicDoTUptimes(damageEvents, buffTable, casts, fightDurationSec);

    expect(dots.length).toBeGreaterThanOrEqual(3);
    const stampede = dots.find(d => d.name === 'Stampede');
    expect(stampede).toBeDefined();
    expect(stampede?.ticks).toBe(4);
    expect(stampede?.uptimePct).toBeGreaterThan(15);

    const quickCloak = dots.find(d => d.name === 'Quick Cloak');
    expect(quickCloak).toBeDefined();
    expect(quickCloak?.uptimeSec).toBe(8.0);
    expect(quickCloak?.uptimePct).toBe(40.0);
  });

  it('identifies interrupted beams as suboptimal even when cast with 3 Crux and computes unticked damage loss', () => {
    // 3 Crux built
    const buffEvents: RawBuffEvent[] = [
      { timestamp: 100000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 101000, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 102000, type: 'applybuffstack', stack: 3, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 103000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } }
    ];

    // Beam 1 starts at 103000, but player rolls out at 104200 (1.2s into channel!)
    const castEvents: RawCastEvent[] = [
      { timestamp: 104200, type: 'cast', sourceID: actorId, ability: { name: 'Roll Dodge', guid: 28549 } }
    ];

    // Only 3 ticks landed before roll dodge
    const damageEvents: RawDamageEvent[] = [
      { timestamp: 103500, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 }, amount: 30000 },
      { timestamp: 103830, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 }, amount: 30000 },
      { timestamp: 104160, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 }, amount: 30000 }
    ];

    const { cruxStats } = extractCruxAndBeams(
      buffEvents,
      damageEvents,
      100000,
      120000,
      actorId,
      castEvents
    );

    expect(cruxStats.totalBeams).toBe(1);
    expect(cruxStats.threeCruxBeams).toBe(1); // Cast with 3 Crux
    expect(cruxStats.interruptedBeams).toBe(1); // Interrupted early!
    expect(cruxStats.optimalBeams).toBe(0); // Suboptimal because interrupted!
    expect(cruxStats.optimalPct).toBe(0);

    const beam = cruxStats.beams[0];
    expect(beam.isOptimal).toBe(false);
    expect(beam.suboptimalType).toBe('interrupted');
    expect(beam.isInterrupted).toBe(true);
    expect(beam.channelDurationSec).toBeLessThan(2.0);
    expect(beam.interruptReason).toContain('Roll Dodge');
    expect(beam.lostTicks).toBeGreaterThan(5);
    expect(beam.estimatedDamageLost).toBeGreaterThan(100000); // Significant damage lost!

    // Verify interruptedList
    expect(cruxStats.interruptedList.length).toBe(1);
    expect(cruxStats.interruptedList[0].reason).toContain('Roll Dodge');
    expect(cruxStats.totalEstimatedDamageLost).toBe(beam.estimatedDamageLost);
    expect(cruxStats.avgDamageLostPerInterruptedBeam).toBe(beam.estimatedDamageLost);
  });

  it('handles Exhausting Fatecarver morph duration scaling with Crux (0.5s windup + Crux scaling: 4.8s at 1 Crux, 5.2s at 2 Crux, 5.5s at 3 Crux)', () => {
    // 3 Crux built -> 5.5s expected, 15 ticks
    const buffEvents: RawBuffEvent[] = [
      { timestamp: 100000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 101000, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 102000, type: 'applybuffstack', stack: 3, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 103000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } }
    ];

    // Exhausting Fatecarver ticks for 5.1s (full duration with 3 Crux: 0.5s windup + 5.0s ticks)
    const damageEvents: RawDamageEvent[] = [
      { timestamp: 103500, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Exhausting Fatecarver', guid: 186366 }, amount: 25000 },
      { timestamp: 108100, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Exhausting Fatecarver', guid: 186366 }, amount: 25000 }
    ];

    const { cruxStats } = extractCruxAndBeams(
      buffEvents,
      damageEvents,
      100000,
      120000,
      actorId
    );

    const beam = cruxStats.beams[0];
    expect(beam.morphName).toBe('Exhausting Fatecarver');
    expect(beam.expectedDurationSec).toBe(5.5); // 0.5s windup + 5.0s ticks
    expect(beam.expectedTicks).toBe(15); // 15 pulses
    expect(beam.isInterrupted).toBe(false);
    expect(beam.isOptimal).toBe(true);
    expect(beam.suboptimalType).toBe('none');
  });

  it('queues regular skills (e.g. Cephaliarch\'s Flail) pressed during a beam without falsely marking the beam as interrupted', () => {
    // 3 Crux built
    const buffEvents: RawBuffEvent[] = [
      { timestamp: 100000, type: 'applybuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 101000, type: 'applybuffstack', stack: 2, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 102000, type: 'applybuffstack', stack: 3, sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } },
      { timestamp: 103000, type: 'removebuff', sourceID: actorId, targetID: actorId, ability: { name: 'Crux', guid: 184220 } }
    ];

    // Player spams Flail at +3.2s into beam to queue it in the buffer
    const castEvents: RawCastEvent[] = [
      { timestamp: 106200, type: 'cast', sourceID: actorId, ability: { name: "Cephaliarch's Flail", guid: 183006 } }
    ];

    // Full 4.5s Pragmatic Fatecarver ticks (first tick at 103500, last tick at 107200)
    const damageEvents: RawDamageEvent[] = [
      { timestamp: 103500, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 }, amount: 30000 },
      { timestamp: 107200, type: 'damage', sourceID: actorId, targetID: 99, ability: { name: 'Pragmatic Fatecarver', guid: 186370 }, amount: 30000 }
    ];

    const { cruxStats } = extractCruxAndBeams(
      buffEvents,
      damageEvents,
      100000,
      120000,
      actorId,
      castEvents
    );

    const beam = cruxStats.beams[0];
    // Flail does NOT interrupt Fatecarver; it was buffered
    expect(beam.isInterrupted).toBe(false);
    expect(beam.isOptimal).toBe(true);
    expect(beam.channelDurationSec).toBe(4.5);
    expect(beam.suboptimalType).toBe('none');
  });
});

