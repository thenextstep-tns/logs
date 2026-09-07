import { describe, it, expect } from 'vitest';
import { generateFullDiscordReport, BossFightContext } from '@/lib/rotation/boss-feedback';
import { RotationAnalysisResult } from '@/types/rotation';
import { sorcererDPS } from '@/lib/rotation/specs/sorcerer-dps';
import { arcanistDPS } from '@/lib/rotation/specs/arcanist-dps';

describe('Discord Boss Feedback Formatter', () => {
  const dummyBaseResult = {
    overallScore: 85,
    overallZone: 'green' as const,
    zoneDistribution: { greenPct: 80, yellowPct: 15, orangePct: 5, redPct: 0, darkRedPct: 0 },
    timeline: [],
    totalGCDCasts: 100,
    totalCycles: 20,
    nonStandardCyclesCount: 2,
    cadenceStats: {
      averageInterval: 3.1,
      targetInterval: 3,
      perfectTripletsCount: 15,
      perfectTripletsPct: 75,
      delayedCadenceCount: 3,
      prematureCadenceCount: 2
    },
    patternStats: [
      { id: 'bb-siphon-dot', name: 'BB - Siphon - DoT', observedCount: 12, observedPct: 60, description: '', isValidPattern: true }
    ],
    cycles: [],
    idleStats: {
      totalActiveSec: 120,
      totalIdleSec: 15,
      activeUptimePct: 88.9,
      weavedLAsCount: 80,
      standaloneLAsCount: 2,
      laWeaveEfficiencyPct: 80,
      connectedLAsCount: 75,
      emptyLAsCount: 5,
      laHitRatePct: 93.8,
      averageGapMs: 1100,
      topIdleGaps: [],
      totalBarSwaps: 24,
      smoothBarSwaps: 22,
      clunkyBarSwaps: 2,
      barSwapEfficiencyPct: 91.7
    },
    topFeedback: []
  };

  it('formats Sorcerer boss encounters with human-sounding phrases and no robotic SBI tags', () => {
    const fight1: BossFightContext = { id: 9, name: 'Count Ryelaz', kill: true, durationSec: 140 };
    const fight2: BossFightContext = { id: 15, name: 'Cavot Agnan', kill: true, durationSec: 110 };

    const sorcResult1: RotationAnalysisResult = {
      ...dummyBaseResult,
      fightMeta: {
        reportId: 'rep1',
        fightId: 9,
        fightName: 'Count Ryelaz',
        startTime: 100000,
        endTime: 240000,
        actorId: 6,
        actorName: 'SorcererOne',
        actorClass: 'Sorcerer',
        durationSec: 140
      },
      spec: sorcererDPS,
      sorcStats: {
        totalFragsCasts: 16,
        procFragsCasts: 10,
        hardcastFragsCasts: 6,
        fragProcEfficiencyPct: 62.5,
        totalFragProcsGained: 20,
        immediateFragProcsCount: 9,
        delayedFragProcsCount: 4,
        interveningSkillsDuringProcCount: 8,
        expiredFragProcsCount: 7,
        fragProcImmediateCastPct: 45.0,
        missedProcWindowsCount: 11,
        totalArmamentsCasts: 12,
        optimalArmamentsCasts: 4,
        suboptimalArmamentsCasts: 8,
        avgStacksAtCast: 2.5,
        totalKnifeCasts: 11,
        avgKnifeIntervalSec: 11.1,
        optimalKnifeRefreshes: 2,
        droppedKnifeCount: 4,
        prematureKnifeCount: 4,
        totalCurseCasts: 8,
        avgCurseIntervalSec: 18.0,
        recastBeforeSecondExplosionCount: 0,
        optimalCurseRefreshes: 7,
        hasShatteredPathsSignet: true,
        minUltimateValue: 85,
        ultimateBelow133Count: 14,
        timeBelow133Sec: 14,
        details: []
      }
    };

    const sorcResult2: RotationAnalysisResult = {
      ...dummyBaseResult,
      fightMeta: {
        reportId: 'rep1',
        fightId: 15,
        fightName: 'Cavot Agnan',
        startTime: 300000,
        endTime: 410000,
        actorId: 6,
        actorName: 'SorcererOne',
        actorClass: 'Sorcerer',
        durationSec: 110
      },
      spec: sorcererDPS,
      sorcStats: {
        totalFragsCasts: 11,
        procFragsCasts: 11,
        hardcastFragsCasts: 0,
        fragProcEfficiencyPct: 100,
        totalFragProcsGained: 17,
        immediateFragProcsCount: 9,
        delayedFragProcsCount: 5,
        interveningSkillsDuringProcCount: 11,
        expiredFragProcsCount: 3,
        fragProcImmediateCastPct: 52.9,
        missedProcWindowsCount: 8,
        totalArmamentsCasts: 4,
        optimalArmamentsCasts: 0,
        suboptimalArmamentsCasts: 4,
        avgStacksAtCast: 1.3,
        totalKnifeCasts: 16,
        avgKnifeIntervalSec: 6.0,
        optimalKnifeRefreshes: 0,
        droppedKnifeCount: 2,
        prematureKnifeCount: 13,
        totalCurseCasts: 5,
        avgCurseIntervalSec: 20.2,
        recastBeforeSecondExplosionCount: 1,
        optimalCurseRefreshes: 3,
        hasShatteredPathsSignet: true,
        minUltimateValue: 54,
        ultimateBelow133Count: 48,
        timeBelow133Sec: 48,
        details: []
      }
    };

    const report = generateFullDiscordReport([
      { fight: fight1, result: sorcResult1 },
      { fight: fight2, result: sorcResult2 }
    ]);

    // Check scope banner (kills only)
    expect(report).toContain('*Scope: Only looking at kill pulls (2 bosses)*');

    // Check Overall Summary (Human Coaching phrases)
    expect(report).toContain('### Overall Summary');
    expect(report).toContain('**What went well:**');
    expect(report).toContain('**Key leaks to tighten up:**');

    // Check Key Skill Mechanics (Clean human explanation, NO SITUATION / BEHAVIOR / IMPACT)
    expect(report).toContain('### Key Skill Mechanics');
    expect(report).toContain("- **Haunting Curse**: Curse explodes twice at ~4 seconds and ~8 seconds. If you recast it too early, it doesn't deal full damage, just restarting the timer from 0, so it's an empty cast.");
    expect(report).toContain('- **Crystal Frag Procs**: When Crystal Fragments procs, it turns instant, costs half magicka, and deals huge bonus damage.');
    expect(report).toContain('- **Bound Armaments**: Bound Armaments builds up to 8 daggers from light attacks.');
    expect(report).toContain('- **Status Knife**: Status Knife applies a 10-second status effect debuff.');
    expect(report).toContain('- **Shattered Paths Signet (Mythic)**: Shattered Paths boosts status effect damage based on current Ultimate (up to 133%).');
    expect(report).toContain('- **Light Attacks**: Connecting a light attack deals direct damage and triggers Ultimate regeneration.');

    // Ensure NO robotic SBI tags exist
    expect(report).not.toContain('*Situation*:');
    expect(report).not.toContain('*Behavior*:');
    expect(report).not.toContain('*Impact*:');
    expect(report).not.toContain('SBI Model');

    // Check Boss Breakdown headers
    expect(report).toContain('### Boss Breakdown');
    expect(report).toContain('## Count Ryelaz');
    expect(report).toContain('## Cavot Agnan');
    expect(report).not.toContain('## Count Ryelaz (Kill)');
    expect(report).not.toContain('## Cavot Agnan (Kill)');

    // Check pull-by-pull stats in Count Ryelaz
    expect(report).toContain('- **Shattered Paths**: Dropped below 133 (Min: 85, 14 sub-133 samples)');
    expect(report).toContain('- **Frag Procs (Prio #1)**: 45% Immediate (9/20 immediate, 4 delayed by 8 GCDs, 7 expired) | 6 hardcasts');
    expect(report).toContain('- **Bound Armaments**: 33% Optimal (4/12 at 4+, avg 2.5 stacks)');
    expect(report).toContain('- **Status Knife**: 2/11 on-time (4 dropped, 4 early, avg 11.1s)');
    expect(report).toContain('- **Haunting Curse**: 7/8 intact (0 clipped, avg 18s)');
    expect(report).toContain('- **Light Attacks**: 93.8% hit rate (75 connected / 5 empty)');
  });

  it('formats Arcanist boss encounters correctly with human coaching and key mechanics', () => {
    const fight: BossFightContext = { id: 21, name: 'Orphic Shattered Shard', kill: true, durationSec: 241.4 };

    const arcanistResult: RotationAnalysisResult = {
      ...dummyBaseResult,
      fightMeta: {
        reportId: 'rep2',
        fightId: 21,
        fightName: 'Orphic Shattered Shard',
        startTime: 100000,
        endTime: 341400,
        actorId: 4,
        actorName: 'ArcanistOne',
        actorClass: 'Arcanist',
        durationSec: 241.4
      },
      spec: arcanistDPS,
      cruxStats: {
        totalBeams: 30,
        optimalBeams: 15,
        optimalPct: 50,
        threeCruxBeams: 28,
        underCruxBeams: 2,
        threeCruxPct: 93.3,
        interruptedBeams: 15,
        interruptedPct: 50,
        totalBeamChannelSec: 116.9,
        beamUptimePct: 48.4,
        totalEstimatedDamageLost: 3000000,
        avgDamageLostPerInterruptedBeam: 200000,
        avgTicksLostPerInterruptedBeam: 4,
        beams: [],
        underCruxList: [],
        interruptedList: []
      }
    };

    const report = generateFullDiscordReport([{ fight, result: arcanistResult }]);

    expect(report).toContain('*Scope: Only looking at kill pulls (1 boss)*');
    expect(report).toContain('### Overall Summary');
    expect(report).toContain('**What went well:**');
    expect(report).toContain('**Key leaks to tighten up:**');

    // Key mechanics
    expect(report).toContain('### Key Skill Mechanics');
    expect(report).toContain('- **Fatecarver (Beam Execution)**: Fatecarver is your primary damage source and channels for 4.5 seconds.');
    expect(report).toContain('- **Crux Usage & Building**: Always build all 3 Crux before beaming.');
    expect(report).toContain('- **Beam Channel Uptime**: Arcanist DPS is driven by beam uptime.');

    // Ensure NO robotic SBI tags
    expect(report).not.toContain('*Situation*:');
    expect(report).not.toContain('*Behavior*:');
    expect(report).not.toContain('*Impact*:');

    expect(report).toContain('## Orphic Shattered Shard');
    expect(report).toContain('- **Fatecarver Execution**: 50% Optimal — 15 / 30 3-Crux full channels (15 interrupted)');
    expect(report).toContain('- **Crux Usage**: 93.3% at 3 Crux (2 cast at < 3 Crux — recommend Crux Counter addon)');
    expect(report).toContain('- **Beam Channel Uptime**: 48.4% (116.9s of 241.4s fight)');
    expect(report).toContain('Crux Counter addon');
  });

  it('formats Necromancer encounters with missing regular patterns and broken pattern occasions', () => {
    const fight: BossFightContext = { id: 28, name: 'Defense Prism', kill: true, durationSec: 180 };
    const necroResult: RotationAnalysisResult = {
      ...dummyBaseResult,
      fightMeta: {
        reportId: 'rep3',
        fightId: 28,
        fightName: 'Defense Prism',
        startTime: 100000,
        endTime: 280000,
        actorId: 10,
        actorName: 'NecroOne',
        actorClass: 'Necromancer',
        durationSec: 180
      },
      spec: {
        id: 'shooting-star-corpseburster-necro',
        name: 'Shooting Star Corpseburster Necromancer',
        class: 'Necromancer',
        isRecognized: true
      },
      nonStandardCyclesCount: 5,
      totalCycles: 20,
      cadenceStats: {
        averageInterval: 3.2,
        targetInterval: 3,
        perfectTripletsCount: 14,
        perfectTripletsPct: 70,
        delayedCadenceCount: 6,
        prematureCadenceCount: 0
      },
      patternStats: [
        { id: 'bb-siphon-dot', name: 'BB - Siphon - Dot', observedCount: 9, observedPct: 45, description: '', isValidPattern: true },
        { id: 'bb-dot-dot', name: 'BB - Dot - Dot', observedCount: 4, observedPct: 20, description: '', isValidPattern: true },
        { id: 'bb-siphon-siphon', name: 'BB - Siphon - Siphon', observedCount: 0, observedPct: 0, description: '', isValidPattern: true },
        { id: 'bb-siphon-skull', name: 'BB - Siphon - Skulls', observedCount: 2, observedPct: 10, description: '', isValidPattern: true }
      ]
    };

    const report = generateFullDiscordReport([{ fight, result: necroResult }]);
    expect(report).toContain('BB - Siphon - Siphon');
    expect(report).toContain('- **Missing Regular Patterns**: BB - Siphon - Siphon (0 casts)');
    expect(report).toContain('- **Broken Patterns**: 5 occasion(s) where standard 3-cast sequence broke (25% of cycles)');
  });

  it('can suppress key skill mechanics when includeKeySkills is false', () => {
    const fight: BossFightContext = { id: 23, name: 'Xoryn', kill: true, durationSec: 152 };
    const arcanistResult: RotationAnalysisResult = {
      ...dummyBaseResult,
      fightMeta: {
        reportId: 'rep2',
        fightId: 23,
        fightName: 'Xoryn',
        startTime: 500000,
        endTime: 652000,
        actorId: 4,
        actorName: 'ArcanistOne',
        actorClass: 'Arcanist',
        durationSec: 152
      },
      spec: arcanistDPS,
      cruxStats: {
        totalBeams: 20,
        optimalBeams: 16,
        optimalPct: 80,
        threeCruxBeams: 20,
        underCruxBeams: 0,
        threeCruxPct: 100,
        interruptedBeams: 4,
        interruptedPct: 20,
        totalBeamChannelSec: 80,
        beamUptimePct: 52.6,
        totalEstimatedDamageLost: 800000,
        avgDamageLostPerInterruptedBeam: 200000,
        avgTicksLostPerInterruptedBeam: 4,
        beams: [],
        underCruxList: [],
        interruptedList: []
      }
    };

    const report = generateFullDiscordReport(
      [{ fight, result: arcanistResult }],
      { includeKeySkills: false }
    );

    expect(report).toContain('## Xoryn');
    expect(report).not.toContain('### Key Skill Mechanics');
  });

  it('differentiates multiple pulls of the same boss in all-pulls mode', () => {
    const fightWipe: BossFightContext = { id: 10, name: 'Count Ryelaz', kill: false, durationSec: 80 };
    const fightKill: BossFightContext = { id: 11, name: 'Count Ryelaz', kill: true, durationSec: 140 };

    const sorcResultWipe: RotationAnalysisResult = {
      ...dummyBaseResult,
      fightMeta: {
        reportId: 'rep1',
        fightId: 10,
        fightName: 'Count Ryelaz',
        startTime: 10000,
        endTime: 90000,
        actorId: 6,
        actorName: 'SorcererOne',
        actorClass: 'Sorcerer',
        durationSec: 80
      },
      spec: sorcererDPS
    };

    const sorcResultKill: RotationAnalysisResult = {
      ...dummyBaseResult,
      fightMeta: {
        reportId: 'rep1',
        fightId: 11,
        fightName: 'Count Ryelaz',
        startTime: 100000,
        endTime: 240000,
        actorId: 6,
        actorName: 'SorcererOne',
        actorClass: 'Sorcerer',
        durationSec: 140
      },
      spec: sorcererDPS
    };

    const report = generateFullDiscordReport([
      { fight: fightWipe, result: sorcResultWipe },
      { fight: fightKill, result: sorcResultKill }
    ]);

    expect(report).toContain('*Scope: Across all pulls (2 boss fights)*');
    expect(report).toContain('## Count Ryelaz (Pull 1 - Wipe)');
    expect(report).toContain('## Count Ryelaz (Pull 2 - Kill)');
  });
});
