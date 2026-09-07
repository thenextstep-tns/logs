import { describe, it, expect } from 'vitest';
import { ESOLogsClient } from '@/lib/esologs/client';
import {
  classifySkill,
  getPerformanceZone,
  normalizeCasts,
  segmentTripletCycles,
  analyzeRotation
} from '@/lib/rotation/analyzer';
import { shootingStarCorpsebursterNecro } from '@/lib/rotation/specs/necromancer-corpseburster';
import { getRotationSpec } from '@/lib/rotation/specs';
import { RawCastEvent } from '@/types/rotation';

describe('Rotation Analyzer - URL Parsing', () => {
  it('parses full ESO Logs URL with query parameters', () => {
    const url = 'https://www.esologs.com/reports/7LKMqfRc3ZdCzGJx?fight=25&type=casts&source=10&view=events';
    const parsed = ESOLogsClient.parseReportUrl(url);
    expect(parsed.reportId).toBe('7LKMqfRc3ZdCzGJx');
    expect(parsed.fightId).toBe(25);
    expect(parsed.sourceId).toBe(10);
    expect(parsed.type).toBe('casts');
    expect(parsed.view).toBe('events');
  });

  it('parses ESO Logs URL with hash fragment', () => {
    const url = 'https://www.esologs.com/reports/7LKMqfRc3ZdCzGJx#fight=25&source=10';
    const parsed = ESOLogsClient.parseReportUrl(url);
    expect(parsed.reportId).toBe('7LKMqfRc3ZdCzGJx');
    expect(parsed.fightId).toBe(25);
    expect(parsed.sourceId).toBe(10);
  });

  it('parses raw report ID string', () => {
    const parsed = ESOLogsClient.parseReportUrl('7LKMqfRc3ZdCzGJx');
    expect(parsed.reportId).toBe('7LKMqfRc3ZdCzGJx');
  });

  it('parses URL with only report and fight', () => {
    const url = 'https://www.esologs.com/reports/7LKMqfRc3ZdCzGJx?fight=12';
    const parsed = ESOLogsClient.parseReportUrl(url);
    expect(parsed.reportId).toBe('7LKMqfRc3ZdCzGJx');
    expect(parsed.fightId).toBe(12);
    expect(parsed.sourceId).toBeUndefined();
  });
});

describe('Rotation Analyzer - Skill Classification', () => {
  const spec = shootingStarCorpsebursterNecro;

  it('classifies Blastbones variants as BB', () => {
    expect(classifySkill('Blighted Blastbones', 117690, spec)).toBe('BB');
    expect(classifySkill('Stalking Blastbones', 114884, spec)).toBe('BB');
    expect(classifySkill('Blastbones', 114881, spec)).toBe('BB');
  });

  it('classifies Siphon variants as Siphon', () => {
    expect(classifySkill('Detonating Siphon', 118763, spec)).toBe('Siphon');
    expect(classifySkill('Mystic Siphon', 118764, spec)).toBe('Siphon');
  });

  it('classifies single-target spammables as Skull and excludes Whirlwind for boss fights', () => {
    expect(classifySkill('Venom Skull', 123704, spec)).toBe('Skull');
    expect(classifySkill('Ricochet Skull', 123699, spec)).toBe('Skull');
    // Whirlwind is excluded from spammables for boss fights
    expect(classifySkill('Whirling Blades', 38914, spec)).not.toBe('Skull');
  });

  it('classifies DoTs as Dot', () => {
    expect(classifySkill('Unnerving Boneyard', 117805, spec)).toBe('Dot');
    expect(classifySkill('Stampede', 38788, spec)).toBe('Dot');
    expect(classifySkill('Skeletal Archer', 118680, spec)).toBe('Dot');
    expect(classifySkill('Anti-Cavalry Caltrops', 40255, spec)).toBe('Dot');
    expect(classifySkill('Sundering Burst', 217465, spec)).toBe('Dot');
  });

  it('classifies Ultimates as Ult', () => {
    expect(classifySkill('Shooting Star', 40493, spec)).toBe('Ult');
    expect(classifySkill('Pestilent Colossus', 122174, spec)).toBe('Ult');
  });

  it('classifies mechanics as Mechanic', () => {
    expect(classifySkill('Mirror', 213069, spec)).toBe('Mechanic');
  });
});

describe('Rotation Analyzer - Performance Zones', () => {
  it('maps scores to correct zones according to spec guidelines', () => {
    expect(getPerformanceZone(100)).toBe('green');
    expect(getPerformanceZone(90)).toBe('green');
    expect(getPerformanceZone(89.9)).toBe('yellow');
    expect(getPerformanceZone(75)).toBe('yellow');
    expect(getPerformanceZone(74.9)).toBe('orange');
    expect(getPerformanceZone(50)).toBe('orange');
    expect(getPerformanceZone(49.9)).toBe('red');
    expect(getPerformanceZone(25)).toBe('red');
    expect(getPerformanceZone(24.9)).toBe('darkRed');
    expect(getPerformanceZone(0)).toBe('darkRed');
  });
});

describe('Rotation Analyzer - Pattern Evaluation & Cycles', () => {
  const spec = shootingStarCorpsebursterNecro;

  it('recognizes any of the 4 core Necromancer rotation patterns as optimal without SLA expectation', () => {
    const rawEvents: RawCastEvent[] = [
      // 1. BB - Siphon - Dot
      { timestamp: 1000, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 2000, type: 'cast', sourceID: 10, ability: { name: 'Detonating Siphon', guid: 118763 } },
      { timestamp: 3000, type: 'cast', sourceID: 10, ability: { name: 'Unnerving Boneyard', guid: 117805 } },

      // 2. BB - Dot - Dot
      { timestamp: 4000, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 5000, type: 'cast', sourceID: 10, ability: { name: 'Stampede', guid: 38788 } },
      { timestamp: 6000, type: 'cast', sourceID: 10, ability: { name: 'Skeletal Archer', guid: 118680 } },

      // 3. BB - Siphon - Siphon
      { timestamp: 7000, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 8000, type: 'cast', sourceID: 10, ability: { name: 'Detonating Siphon', guid: 118763 } },
      { timestamp: 9000, type: 'cast', sourceID: 10, ability: { name: 'Detonating Siphon', guid: 118763 } },

      // 4. BB - Siphon - Skull
      { timestamp: 10000, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 11000, type: 'cast', sourceID: 10, ability: { name: 'Detonating Siphon', guid: 118763 } },
      { timestamp: 12000, type: 'cast', sourceID: 10, ability: { name: 'Venom Skull', guid: 123704 } },

      // Anchor termination
      { timestamp: 13000, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 14000, type: 'cast', sourceID: 10, ability: { name: 'Detonating Siphon', guid: 118763 } },
      { timestamp: 15000, type: 'cast', sourceID: 10, ability: { name: 'Unnerving Boneyard', guid: 117805 } }
    ];

    const { normalized } = normalizeCasts(rawEvents, 1000, spec);
    const cycles = segmentTripletCycles(normalized, spec);

    expect(cycles.length).toBe(5);

    // Cycle 1: BB - Siphon - Dot
    expect(cycles[0].matchedPatternId).toBe('bb-siphon-dot');
    expect(cycles[0].cadenceCount).toBe(3);
    expect(cycles[0].cadenceScore).toBe(100);
    expect(cycles[0].cycleScore).toBe(100);
    expect(cycles[0].zone).toBe('green');

    // Cycle 2: BB - Dot - Dot
    expect(cycles[1].matchedPatternId).toBe('bb-dot-dot');
    expect(cycles[1].cadenceCount).toBe(3);
    expect(cycles[1].cycleScore).toBe(100);
    expect(cycles[1].zone).toBe('green');

    // Cycle 3: BB - Siphon - Siphon
    expect(cycles[2].matchedPatternId).toBe('bb-siphon-siphon');
    expect(cycles[2].cadenceCount).toBe(3);
    expect(cycles[2].cycleScore).toBe(100);
    expect(cycles[2].zone).toBe('green');

    // Cycle 4: BB - Siphon - Skull
    expect(cycles[3].matchedPatternId).toBe('bb-siphon-skull');
    expect(cycles[3].cadenceCount).toBe(3);
    expect(cycles[3].cycleScore).toBe(100);
    expect(cycles[3].zone).toBe('green');
  });

  it('penalizes delayed Blastbones cadence', () => {
    const rawEvents: RawCastEvent[] = [
      { timestamp: 1000, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 2000, type: 'cast', sourceID: 10, ability: { name: 'Detonating Siphon', guid: 118763 } },
      { timestamp: 3000, type: 'cast', sourceID: 10, ability: { name: 'Unnerving Boneyard', guid: 117805 } },
      { timestamp: 4000, type: 'cast', sourceID: 10, ability: { name: 'Venom Skull', guid: 123704 } }, // 4th skill, delaying BB
      { timestamp: 5000, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } }
    ];

    const { normalized } = normalizeCasts(rawEvents, 1000, spec);
    const cycles = segmentTripletCycles(normalized, spec);

    expect(cycles[0].cadenceCount).toBe(4);
    expect(cycles[0].cadenceScore).toBe(80);
    expect(cycles[0].diagnostics.some(d => d.includes('delayed'))).toBe(true);
  });

  it('correctly tracks light attack weaving and animation cancelling', () => {
    const rawEvents: RawCastEvent[] = [
      // LA weaved before Blastbones
      { timestamp: 1050, type: 'cast', sourceID: 10, ability: { name: 'Light Attack (Dual Wield)', guid: 16499 } },
      { timestamp: 1100, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      // Bar swap animation cancel
      { timestamp: 1500, type: 'cast', sourceID: 10, ability: { name: 'Swap Weapons', guid: 28541 } },
      // LA weaved before Siphon
      { timestamp: 2050, type: 'cast', sourceID: 10, ability: { name: 'Light Attack (Two Handed)', guid: 16037 } },
      { timestamp: 2100, type: 'cast', sourceID: 10, ability: { name: 'Detonating Siphon', guid: 118763 } },
      // Synergy off-GCD
      { timestamp: 2500, type: 'cast', sourceID: 10, ability: { name: 'Grave Robber', guid: 115548 } },
      // Skill without LA
      { timestamp: 3100, type: 'cast', sourceID: 10, ability: { name: 'Unnerving Boneyard', guid: 117805 } }
    ];

    const { normalized, totalLightAttacks, totalBarSwaps } = normalizeCasts(rawEvents, 1000, spec);
    expect(normalized.length).toBe(3);
    expect(totalLightAttacks).toBe(2);
    expect(totalBarSwaps).toBe(1);

    expect(normalized[0].hasPrecedingLA).toBe(true);
    expect(normalized[0].followedByBarSwap).toBe(true);
    expect(normalized[1].hasPrecedingLA).toBe(true);
    expect(normalized[2].hasPrecedingLA).toBe(false);
  });
});

describe('Rotation Analyzer - End-to-End Analysis', () => {
  it('runs complete analysis and produces timeline, zone breakdown, and idle stats', () => {
    const rawEvents: RawCastEvent[] = [
      { timestamp: 1000, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 2000, type: 'cast', sourceID: 10, ability: { name: 'Detonating Siphon', guid: 118763 } },
      { timestamp: 3000, type: 'cast', sourceID: 10, ability: { name: 'Unnerving Boneyard', guid: 117805 } },
      { timestamp: 4000, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 5000, type: 'cast', sourceID: 10, ability: { name: 'Stampede', guid: 38788 } },
      { timestamp: 6000, type: 'cast', sourceID: 10, ability: { name: 'Skeletal Archer', guid: 118680 } }
    ];

    const spec = getRotationSpec('shooting-star-corpseburster-necro');
    const result = analyzeRotation(
      rawEvents,
      {
        reportId: 'testReport',
        fightId: 1,
        fightName: 'Boss Test',
        startTime: 1000,
        endTime: 7000,
        actorId: 10,
        actorName: 'NecroPlayer',
        actorClass: 'Necromancer'
      },
      spec
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.overallZone).toBe('green');
    expect(result.totalCycles).toBe(2);
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.zoneDistribution.greenPct).toBeGreaterThan(0);
    expect(result.idleStats).toBeDefined();
    expect(result.idleStats.activeUptimePct).toBeGreaterThan(0);
  });

  it('handles unrecognized specs gracefully with generic tracker and warning', async () => {
    const { resolveSpecForActor } = await import('@/lib/rotation/specs');
    const { spec: templarSpec, isRecognized } = resolveSpecForActor('Templar');

    expect(isRecognized).toBe(false);
    expect(templarSpec.isRecognized).toBe(false);
    expect(templarSpec.name).toContain('Templar');

    const rawEvents: RawCastEvent[] = [
      { timestamp: 1000, type: 'cast', sourceID: 5, ability: { name: 'Puncturing Sweeps', guid: 22057 } },
      { timestamp: 2000, type: 'cast', sourceID: 5, ability: { name: 'Solar Barrage', guid: 22110 } },
      { timestamp: 3000, type: 'cast', sourceID: 5, ability: { name: 'Radiant Oppression', guid: 22002 } }
    ];

    const result = analyzeRotation(
      rawEvents,
      {
        reportId: 'testReport',
        fightId: 1,
        fightName: 'Boss Test',
        startTime: 1000,
        endTime: 4000,
        actorId: 5,
        actorName: 'TemplarPlayer',
        actorClass: 'Templar'
      },
      templarSpec
    );

    expect(result.spec.isRecognized).toBe(false);
    expect(result.unrecognizedWarning).toBeDefined();
    expect(result.unrecognizedWarning).toContain('Templar');
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.idleStats.activeUptimePct).toBeGreaterThan(0);
  });

  it('verifies exact 30-cast sequence from combat log screenshot with CMX weaving mechanics', () => {
    // 30 exact events matching media_1788727855380.png
    const screenshotEvents: RawCastEvent[] = [
      { timestamp: 200535, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 201532, type: 'cast', sourceID: 10, ability: { name: 'Light Attack (Dual Wield)', guid: 16499 } },
      { timestamp: 202494, type: 'cast', sourceID: 10, ability: { name: 'Heavy Attack (Dual Wield)', guid: 16503 } },
      { timestamp: 203264, type: 'cast', sourceID: 10, ability: { name: 'Quick Cloak', guid: 38901 } },
      { timestamp: 204263, type: 'cast', sourceID: 10, ability: { name: 'Swap Weapons', guid: 28541 } },
      { timestamp: 204850, type: 'cast', sourceID: 10, ability: { name: 'Stampede', guid: 38788 } },
      { timestamp: 205869, type: 'cast', sourceID: 10, ability: { name: 'Carve', guid: 38745 } },
      { timestamp: 206912, type: 'cast', sourceID: 10, ability: { name: 'Stampede', guid: 38788 } },
      { timestamp: 207949, type: 'cast', sourceID: 10, ability: { name: 'Skeletal Archer', guid: 118680 } },
      { timestamp: 208287, type: 'cast', sourceID: 10, ability: { name: 'Swap Weapons', guid: 28541 } },
      { timestamp: 208961, type: 'cast', sourceID: 10, ability: { name: 'Light Attack (Dual Wield)', guid: 16499 } },
      { timestamp: 209711, type: 'cast', sourceID: 10, ability: { name: 'Light Attack (Dual Wield)', guid: 16499 } },
      { timestamp: 209817, type: 'cast', sourceID: 10, ability: { name: 'Blighted Blastbones', guid: 117690 } },
      { timestamp: 211075, type: 'cast', sourceID: 10, ability: { name: 'Heavy Attack (Dual Wield)', guid: 16503 } },
      { timestamp: 211559, type: 'cast', sourceID: 10, ability: { name: 'Avid Boneyard', guid: 117805 } },
      { timestamp: 212101, type: 'cast', sourceID: 10, ability: { name: 'Swap Weapons', guid: 28541 } },
      { timestamp: 212556, type: 'cast', sourceID: 10, ability: { name: 'Skeletal Archer', guid: 118680 } },
      { timestamp: 213752, type: 'cast', sourceID: 10, ability: { name: 'Light Attack (Two Handed)', guid: 16037 } },
      { timestamp: 215993, type: 'cast', sourceID: 10, ability: { name: 'Roll Dodge', guid: 28549 } },
      { timestamp: 218513, type: 'cast', sourceID: 10, ability: { name: 'Mirror', guid: 213069 } },
      { timestamp: 221889, type: 'cast', sourceID: 10, ability: { name: 'Mirror', guid: 213069 } },
      { timestamp: 225016, type: 'cast', sourceID: 10, ability: { name: 'Mirror', guid: 213069 } },
      { timestamp: 241083, type: 'cast', sourceID: 10, ability: { name: 'Shocking Banner', guid: 217465 } },
      { timestamp: 242026, type: 'cast', sourceID: 10, ability: { name: 'Skeletal Archer', guid: 118680 } },
      { timestamp: 243063, type: 'cast', sourceID: 10, ability: { name: 'Light Attack (Two Handed)', guid: 16037 } },
      { timestamp: 243253, type: 'cast', sourceID: 10, ability: { name: 'Carve', guid: 38745 } },
      { timestamp: 244291, type: 'cast', sourceID: 10, ability: { name: 'Light Attack (Two Handed)', guid: 16037 } },
      { timestamp: 244459, type: 'cast', sourceID: 10, ability: { name: 'Stampede', guid: 38788 } },
      { timestamp: 245847, type: 'cast', sourceID: 10, ability: { name: 'Heavy Attack (Two Handed)', guid: 16041 } },
      { timestamp: 246737, type: 'cast', sourceID: 10, ability: { name: 'Light Attack (Two Handed)', guid: 16037 } }
    ];

    const spec = shootingStarCorpsebursterNecro;
    const { normalized, totalLightAttacks, totalBarSwaps } = normalizeCasts(screenshotEvents, 200535, spec);

    // Rule 1: Exactly 21 active GCD actions (matching 21 green marks)
    expect(normalized.length).toBe(21);
    expect(totalLightAttacks).toBe(7);
    expect(totalBarSwaps).toBe(3);

    // Rule 2: 3 weaved [LA + Skill] boxed combos
    const weavedSkills = normalized.filter(s => s.hasPrecedingLA);
    expect(weavedSkills.length).toBe(3);
    expect(weavedSkills[0].abilityName).toBe('Blighted Blastbones');
    expect(weavedSkills[0].weaveDelayMs).toBe(106);
    expect(weavedSkills[1].abilityName).toBe('Carve');
    expect(weavedSkills[1].weaveDelayMs).toBe(190);
    expect(weavedSkills[2].abilityName).toBe('Stampede');
    expect(weavedSkills[2].weaveDelayMs).toBe(168);

    // Rule 3: 3 adjacent Swap Weapons animation cancels attached to skills
    const swappedSkills = normalized.filter(s => s.followedByBarSwap);
    expect(swappedSkills.length).toBe(3);
    expect(swappedSkills[0].abilityName).toBe('Quick Cloak');
    expect(swappedSkills[1].abilityName).toBe('Skeletal Archer');
    expect(swappedSkills[2].abilityName).toBe('Avid Boneyard');

    // Synergies: 3 Mirror synergies filtered out as off-GCD
    const mirrorCasts = normalized.filter(s => s.abilityName === 'Mirror');
    expect(mirrorCasts.length).toBe(0);

    // Avoidance & Heavy Attacks: Roll Dodge and Heavy Attacks normalized as active actions
    const rollDodges = normalized.filter(s => s.abilityName.includes('Roll Dodge'));
    expect(rollDodges.length).toBe(1);
    expect(rollDodges[0].classification).toBe('Mechanic');

    const heavyAttacks = normalized.filter(s => s.abilityName.startsWith('Heavy Attack'));
    expect(heavyAttacks.length).toBe(3);
    expect(heavyAttacks.every(h => h.classification === 'Skull')).toBe(true);

    // Standalone LAs: 4 standalone LAs
    const standaloneLAs = normalized.filter(s => s.isStandaloneLA);
    expect(standaloneLAs.length).toBe(4);

    // Run full analysis
    const result = analyzeRotation(
      screenshotEvents,
      {
        reportId: 'screenshotReport',
        fightId: 1,
        fightName: 'Screenshot Analysis',
        startTime: 200535,
        endTime: 247737,
        actorId: 10,
        actorName: 'NecroPlayer',
        actorClass: 'Necromancer'
      },
      spec
    );

    expect(result.idleStats.weavedLAsCount).toBe(3);
    expect(result.idleStats.standaloneLAsCount).toBe(4);
    expect(result.idleStats.barSwapCancelsCount).toBe(3);
    expect(result.idleStats.avgWeaveDelayMs).toBe(155); // (106 + 190 + 168) / 3 = 154.67 -> 155ms
  });
});
