import {
  RawCastEvent,
  NormalizedGCDCast,
  GCDClassification,
  RotationSpec,
  TripletCycle,
  TimelineDataPoint,
  ZoneDistribution,
  PatternDistributionStat,
  CadenceStats,
  IdleStats,
  RotationAnalysisResult,
  PerformanceZone,
  RawBuffEvent,
  RawDamageEvent,
  CruxStats,
  CruxBeamEvent,
  InterruptedBeamDetail,
  SuboptimalBeamType,
  DoTUptimeStat,
  SorcStats,
  DKStats
} from '@/types/rotation';

/**
 * Standard ESO Global Cooldown on active skills is 1000ms.
 */
export const ESO_SKILL_GCD_MS = 1000;

/**
 * Returns performance zone based on a score from 0 to 100
 */
export function getPerformanceZone(score: number): PerformanceZone {
  if (score >= 90) return 'green';
  if (score >= 75) return 'yellow';
  if (score >= 50) return 'orange';
  if (score >= 25) return 'red';
  return 'darkRed';
}

/**
 * Formats seconds into mm:ss format
 */
export function formatTimeSec(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.floor(Math.max(0, seconds) % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * List of known ESO combat synergies (activated via synergy prompt, off-GCD, do not interrupt casts/channels).
 */
const ESO_SYNERGIES = new Set([
  'purify',
  'grave robber',
  'harvest',
  'blood feast',
  'runebreak',
  'shackle',
  'healing combustion',
  'soul siphon',
  'charged synergy',
  'bone wall synergy',
  'spinal surge',
  'mirror',
  'radiate',
  'slipstream',
  'conduit',
  'combustion',
  'blessed seed',
  'black hole',
  'spawn broodlings',
  'supernova',
  'gravity crush',
  'hidden refresh',
  'luminous shards',
  'holy shards',
  'energy orb',
  'charged lightning',
  'wind shear'
]);

/**
 * Returns true if an ability is an off-GCD synergy or potion consumption (does not interrupt casts or channels).
 */
export function isSynergyOrPotion(abilityName: string): boolean {
  if (!abilityName) return false;
  const lower = abilityName.toLowerCase().trim();

  // Drinking potions (Restore Health/Magicka/Stamina/All Resources, Essence of...)
  if (
    lower.startsWith('restore ') ||
    lower.startsWith('essence of ') ||
    lower.includes('potion')
  ) {
    return true;
  }

  // Combat synergies
  if (ESO_SYNERGIES.has(lower) || lower.endsWith(' synergy')) {
    return true;
  }

  return false;
}

/**
 * Returns true if an ability is a utility animation cancel (Swap Weapons, Bash, Block, Break Free).
 */
export function isUtilityAction(abilityName: string): boolean {
  if (!abilityName) return false;
  const lower = abilityName.toLowerCase().trim();
  return (
    lower.includes('swap weapons') ||
    lower === 'bash' ||
    lower.includes('bash') ||
    lower === 'block' ||
    lower.includes('break free')
  );
}

/**
 * Returns true if an action can legitimately cancel a channeled ability (e.g. Fatecarver).
 * In ESO, regular weapon/class skills CANNOT cancel channels and are queued in the buffer.
 * Only active cancellation actions (Bash, Block, Roll Dodge, Break Free) can interrupt channels.
 */
export function isChannelCanceller(abilityName: string): boolean {
  if (!abilityName) return false;
  const lower = abilityName.toLowerCase().trim();
  return (
    lower.includes('bash') ||
    lower === 'block' ||
    lower.includes('block') ||
    lower.includes('roll dodge') ||
    lower.includes('break free')
  );
}

/**
 * Computes expected channel duration, expected tick pulses, windup, and ticking duration
 * for Fatecarver morphs based on Crux spent at activation.
 *
 * Rules:
 * - Pragmatic Fatecarver / Base Fatecarver: 4.5s full cast (0.5s windup + 4.0s of ticks = 12 pulses).
 * - Exhausting Fatecarver scales off Crux:
 *   - 0 Crux: 4.5s full cast (0.5s windup + 4.0s ticks = 12 pulses)
 *   - 1 Crux: 4.8s full cast (0.5s windup + 4.3s ticks = 13 pulses)
 *   - 2 Crux: 5.2s full cast (0.5s windup + 4.7s ticks = 14 pulses)
 *   - 3 Crux: 5.5s full cast (0.5s windup + 5.0s ticks = 15 pulses)
 * In all cases, there is an initial 0.5s windup before the first damage tick lands.
 */
export function getFatecarverExpectedSpecs(morphName: string, cruxBefore: number): {
  expectedDurationSec: number;
  expectedTicks: number;
  windupSec: number;
  tickingDurationSec: number;
} {
  const isExhausting = morphName.toLowerCase().includes('exhausting');
  const windupSec = 0.5;

  if (isExhausting) {
    let expectedDurationSec = 4.5;
    let expectedTicks = 12;
    if (cruxBefore >= 3) {
      expectedDurationSec = 5.5;
      expectedTicks = 15;
    } else if (cruxBefore === 2) {
      expectedDurationSec = 5.2;
      expectedTicks = 14;
    } else if (cruxBefore === 1) {
      expectedDurationSec = 4.8;
      expectedTicks = 13;
    }
    return {
      expectedDurationSec,
      expectedTicks,
      windupSec,
      tickingDurationSec: Number((expectedDurationSec - windupSec).toFixed(2))
    };
  }

  // Pragmatic Fatecarver or base Fatecarver: 4.5s total (0.5s windup + 4.0s ticks = 12 pulses)
  return {
    expectedDurationSec: 4.5,
    expectedTicks: 12,
    windupSec: 0.5,
    tickingDurationSec: 4.0
  };
}

/**
 * Extracts Fatecarver beam activations, measures channel durations, and coordinates
 * self-applied Crux buff stacks (ability=184220) immediately prior to beam consumption.
 */
export function extractCruxAndBeams(
  buffEvents: RawBuffEvent[] | undefined,
  damageEvents: RawDamageEvent[] | undefined,
  fightStartTs: number,
  fightEndTs: number,
  actorId: number,
  castEvents?: RawCastEvent[]
): {
  cruxStats: CruxStats;
  synthesizedBeams: RawCastEvent[];
} {
  const fightDurationSec = Math.max(1, (fightEndTs - fightStartTs) / 1000);

  if (!buffEvents || buffEvents.length === 0) {
    return {
      cruxStats: {
        totalBeams: 0,
        optimalBeams: 0,
        optimalPct: 100,
        threeCruxBeams: 0,
        underCruxBeams: 0,
        threeCruxPct: 100,
        interruptedBeams: 0,
        interruptedPct: 0,
        totalBeamChannelSec: 0,
        beamUptimePct: 0,
        totalEstimatedDamageLost: 0,
        avgDamageLostPerInterruptedBeam: 0,
        avgTicksLostPerInterruptedBeam: 0,
        beams: [],
        underCruxList: [],
        interruptedList: []
      },
      synthesizedBeams: []
    };
  }

  // Sort buff events by timestamp
  const sortedBuffs = [...buffEvents].sort((a, b) => a.timestamp - b.timestamp);

  // Filter damage ticks for Fatecarver (guid 186370, 186366, 182998)
  const dmgTicks = damageEvents
    ? damageEvents
        .filter(
          d =>
            d.ability &&
            (d.ability.guid === 186370 ||
              d.ability.guid === 186366 ||
              d.ability.guid === 182998 ||
              d.ability.name.toLowerCase().includes('fatecarver'))
        )
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  const totalFightFatecarverDmg = dmgTicks.reduce((sum, d) => sum + (d.amount || 0), 0);
  const globalDps =
    totalFightFatecarverDmg > 0 && fightDurationSec > 0
      ? totalFightFatecarverDmg / Math.max(1, fightDurationSec * 0.45)
      : 80000;

  // 1. Crux removal events (Crux consumed when Fatecarver starts)
  const removeEvents = sortedBuffs.filter(
    e =>
      e.type === 'removebuff' &&
      (!e.ability || e.ability.guid === 184220 || e.ability.name.toLowerCase().includes('crux'))
  );

  const matchedTickIndices = new Set<number>();
  const beams: CruxBeamEvent[] = [];

  for (let i = 0; i < removeEvents.length; i++) {
    const rem = removeEvents[i];
    const nextRemTs = i < removeEvents.length - 1 ? removeEvents[i + 1].timestamp : fightEndTs;

    // Find Crux stack held immediately preceding this removebuff
    const prevEvents = sortedBuffs.filter(e => e.timestamp < rem.timestamp);
    const lastEvent = prevEvents[prevEvents.length - 1];
    let cruxBefore = 0;
    if (lastEvent) {
      if (lastEvent.type === 'applybuff') {
        cruxBefore = 1;
      } else if (lastEvent.type === 'applybuffstack') {
        cruxBefore = lastEvent.stack || 1;
      }
    }

    // Associate damage ticks within [rem.timestamp, Math.min(nextRemTs, rem.timestamp + 5500)]
    const associatedTicks: RawDamageEvent[] = [];
    for (let tIdx = 0; tIdx < dmgTicks.length; tIdx++) {
      const tick = dmgTicks[tIdx];
      if (
        tick.timestamp >= rem.timestamp &&
        tick.timestamp <= Math.min(nextRemTs, rem.timestamp + 5500)
      ) {
        associatedTicks.push(tick);
        matchedTickIndices.add(tIdx);
      }
    }

    // Determine morph
    const morphAbility = associatedTicks.length > 0 ? associatedTicks[0].ability : null;
    let morphName = 'Pragmatic Fatecarver';
    if (morphAbility) {
      if (morphAbility.guid === 186366 || morphAbility.name.toLowerCase().includes('exhausting')) {
        morphName = 'Exhausting Fatecarver';
      } else if (morphAbility.guid === 182998 || morphAbility.name.toLowerCase() === 'fatecarver') {
        morphName = 'Fatecarver';
      }
    }

    const { expectedDurationSec, expectedTicks, windupSec } = getFatecarverExpectedSpecs(
      morphName,
      cruxBefore
    );

    // Group damage ticks by timestamp into pulses (~150ms window = 1 pulse wave)
    // to handle AoE multi-target ticks accurately
    const pulses: number[] = [];
    associatedTicks.forEach(t => {
      if (pulses.length === 0 || t.timestamp - pulses[pulses.length - 1] > 150) {
        pulses.push(t.timestamp);
      }
    });

    // Check for any explicit cancellation action by the player (Bash, Block, Roll Dodge, Break Free)
    // Regular class/weapon skills CANNOT cancel Fatecarver and are queued in the buffer!
    const cancelAction = castEvents
      ? castEvents.find(
          c =>
            c.sourceID === actorId &&
            c.timestamp > rem.timestamp + 400 &&
            c.timestamp < rem.timestamp + (expectedDurationSec - 0.3) * 1000 &&
            isChannelCanceller(c.ability.name)
        )
      : undefined;

    let actualDurationSec = expectedDurationSec;
    let isInterrupted = false;
    let interruptReason = '';

    const beamDmg = associatedTicks.reduce((s, t) => s + (t.amount || 0), 0);

    let tickSpanSec = 0;
    if (pulses.length > 0) {
      const lastTick = pulses[pulses.length - 1];
      tickSpanSec = Number(((lastTick - rem.timestamp + 333) / 1000).toFixed(2));
    }

    const isFullTicks = pulses.length >= expectedTicks - 1 || tickSpanSec >= expectedDurationSec - 0.4;

    // Check when the next active skill/attack was cast by this player
    const nextPlayerCast = castEvents
      ? castEvents.find(
          c =>
            c.sourceID === actorId &&
            c.timestamp > rem.timestamp + 400 &&
            !isSynergyOrPotion(c.ability.name)
        )
      : undefined;

    const nextCastGapSec = nextPlayerCast
      ? Number(((nextPlayerCast.timestamp - rem.timestamp) / 1000).toFixed(2))
      : (nextRemTs - rem.timestamp) / 1000;

    const heldFullDuration = !cancelAction && nextCastGapSec >= expectedDurationSec - 0.3;

    if (cancelAction) {
      const gapSec = Number(((cancelAction.timestamp - rem.timestamp) / 1000).toFixed(2));
      actualDurationSec = Math.max(0.5, Math.min(gapSec, tickSpanSec > 0 ? tickSpanSec : gapSec));
      isInterrupted = true;
      interruptReason = `Cancelled early by ${cancelAction.ability.name} at ${gapSec}s`;
    } else if (!isFullTicks) {
      isInterrupted = true;
      if (heldFullDuration) {
        actualDurationSec = expectedDurationSec;
        interruptReason =
          pulses.length === 0
            ? `Channel held for full duration (${expectedDurationSec}s), but no damage ticks landed (target immune, out of range, or aimed away)`
            : `Channel held for full duration (${expectedDurationSec}s), but only ${pulses.length}/${expectedTicks} ticks landed (aimed away, out of range, or target immune)`;
      } else if (pulses.length === 0) {
        actualDurationSec = 0;
        interruptReason = 'No damage ticks landed (target missing or out of range)';
      } else {
        actualDurationSec = Math.min(expectedDurationSec, Math.max(0.5, tickSpanSec));
        interruptReason = `Damage ticks ended early at ${actualDurationSec}s (${pulses.length}/${expectedTicks} pulses)`;
      }
    } else {
      actualDurationSec = expectedDurationSec;
      isInterrupted = false;
    }

    const durationLostSec = isInterrupted ? Math.max(0, expectedDurationSec - actualDurationSec) : 0;
    const lostTicks = isInterrupted ? Math.max(0, expectedTicks - pulses.length) : 0;
    const avgDmgPerTick = beamDmg > 0 && pulses.length > 0 ? beamDmg / pulses.length : (globalDps * 0.33);
    const estimatedDamageLost = Math.round(lostTicks * avgDmgPerTick);

    // Suboptimal classification
    let suboptimalType: SuboptimalBeamType = 'none';
    const isOptimal = cruxBefore === 3 && !isInterrupted;
    if (cruxBefore < 3 && isInterrupted) {
      suboptimalType = 'under_crux_and_interrupted';
    } else if (cruxBefore < 3) {
      suboptimalType = 'under_crux';
    } else if (isInterrupted) {
      suboptimalType = 'interrupted';
    }

    const startSec = Number(((rem.timestamp - fightStartTs) / 1000).toFixed(1));
    const endSec = Number(
      ((rem.timestamp + Math.round(actualDurationSec * 1000) - fightStartTs) / 1000).toFixed(1)
    );

    beams.push({
      beamIndex: i + 1,
      startTs: rem.timestamp,
      startSec,
      endTs: rem.timestamp + Math.round(actualDurationSec * 1000),
      endSec,
      channelDurationSec: actualDurationSec,
      cruxBefore,
      isOptimal,
      suboptimalType,
      morphName,
      expectedDurationSec,
      isInterrupted,
      interruptReason,
      ticks: pulses.length,
      expectedTicks,
      lostTicks,
      totalDamage: beamDmg,
      estimatedDamageLost
    });
  }

  // 2. Check for any damage tick clusters with NO matching removebuff (0-Crux beams)
  if (dmgTicks.length > 0) {
    const unmatchedTicks = dmgTicks.filter((_, idx) => !matchedTickIndices.has(idx));
    if (unmatchedTicks.length > 0) {
      const clusters: RawDamageEvent[][] = [];
      let currentCluster: RawDamageEvent[] = [];
      for (const tick of unmatchedTicks) {
        if (
          currentCluster.length === 0 ||
          tick.timestamp - currentCluster[currentCluster.length - 1].timestamp <= 750
        ) {
          currentCluster.push(tick);
        } else {
          clusters.push(currentCluster);
          currentCluster = [tick];
        }
      }
      if (currentCluster.length > 0) clusters.push(currentCluster);

      for (const cl of clusters) {
        const clStart = cl[0].timestamp;
        const closeToExisting = beams.some(b => Math.abs(b.startTs - clStart) <= 1000);
        if (!closeToExisting) {
          const clPulses: number[] = [];
          cl.forEach(t => {
            if (clPulses.length === 0 || t.timestamp - clPulses[clPulses.length - 1] > 150) {
              clPulses.push(t.timestamp);
            }
          });

          const clEnd = cl[cl.length - 1].timestamp + 333;
          const durMs = Math.max(500, clEnd - clStart);
          const durSec = Number((durMs / 1000).toFixed(2));
          const isInterrupted = clPulses.length < 11 && durSec < 4.1;
          const beamDmg = cl.reduce((s, t) => s + (t.amount || 0), 0);
          const durationLostSec = isInterrupted ? Math.max(0, 4.5 - durSec) : 0;
          const lostTicks = isInterrupted ? Math.max(0, 12 - clPulses.length) : 0;
          const avgDmg = clPulses.length > 0 ? beamDmg / clPulses.length : (globalDps * 0.33);

          beams.push({
            beamIndex: 0,
            startTs: clStart,
            startSec: Number(((clStart - fightStartTs) / 1000).toFixed(1)),
            endTs: clEnd,
            endSec: Number(((clEnd - fightStartTs) / 1000).toFixed(1)),
            channelDurationSec: isInterrupted ? durSec : 4.5,
            cruxBefore: 0,
            isOptimal: false,
            suboptimalType: isInterrupted ? 'under_crux_and_interrupted' : 'under_crux',
            morphName: 'Pragmatic Fatecarver',
            expectedDurationSec: 4.5,
            isInterrupted,
            interruptReason: isInterrupted ? `0-Crux beam ended at ${durSec}s (${clPulses.length}/12 pulses)` : undefined,
            ticks: clPulses.length,
            expectedTicks: 12,
            lostTicks,
            totalDamage: beamDmg,
            estimatedDamageLost: Math.round(durationLostSec * avgDmg)
          });
        }
      }
    }
  }

  // Sort beams by startTs and re-index
  beams.sort((a, b) => a.startTs - b.startTs);
  beams.forEach((b, idx) => {
    b.beamIndex = idx + 1;
  });

  const totalBeams = beams.length;
  const optimalBeams = beams.filter(b => b.isOptimal).length;
  const optimalPct = totalBeams > 0 ? Math.round((optimalBeams / totalBeams) * 100) : 100;
  const threeCruxBeams = beams.filter(b => b.cruxBefore === 3).length;
  const underCruxBeams = totalBeams - threeCruxBeams;
  const threeCruxPct = totalBeams > 0 ? Math.round((threeCruxBeams / totalBeams) * 100) : 100;
  const interruptedBeams = beams.filter(b => b.isInterrupted).length;
  const interruptedPct = totalBeams > 0 ? Math.round((interruptedBeams / totalBeams) * 100) : 0;

  const totalBeamChannelSec = Number(
    beams.reduce((sum, b) => sum + b.channelDurationSec, 0).toFixed(1)
  );
  const beamUptimePct = Number(((totalBeamChannelSec / fightDurationSec) * 100).toFixed(1));

  const totalEstimatedDamageLost = Math.round(
    beams.reduce((sum, b) => sum + b.estimatedDamageLost, 0)
  );
  const avgDamageLostPerInterruptedBeam =
    interruptedBeams > 0 ? Math.round(totalEstimatedDamageLost / interruptedBeams) : 0;
  const totalLostTicks = beams.reduce((sum, b) => sum + b.lostTicks, 0);
  const avgTicksLostPerInterruptedBeam =
    interruptedBeams > 0 ? Number((totalLostTicks / interruptedBeams).toFixed(1)) : 0;

  const underCruxList = beams
    .filter(b => b.cruxBefore < 3)
    .map(b => ({
      beamIndex: b.beamIndex,
      timeSec: b.startSec,
      cruxCount: b.cruxBefore,
      channelDurationSec: b.channelDurationSec
    }));

  const interruptedList: InterruptedBeamDetail[] = beams
    .filter(b => b.isInterrupted)
    .map(b => ({
      beamIndex: b.beamIndex,
      timeSec: b.startSec,
      cruxCount: b.cruxBefore,
      actualDurationSec: b.channelDurationSec,
      expectedDurationSec: b.expectedDurationSec,
      actualTicks: b.ticks,
      expectedTicks: b.expectedTicks,
      lostTicks: b.lostTicks,
      estimatedDamageLost: b.estimatedDamageLost,
      reason: b.interruptReason || 'Channel ended prematurely',
      suboptimalType: b.cruxBefore === 3 ? 'interrupted' : 'under_crux_and_interrupted'
    }));

  const cruxStats: CruxStats = {
    totalBeams,
    optimalBeams,
    optimalPct,
    threeCruxBeams,
    underCruxBeams,
    threeCruxPct,
    interruptedBeams,
    interruptedPct,
    totalBeamChannelSec,
    beamUptimePct,
    totalEstimatedDamageLost,
    avgDamageLostPerInterruptedBeam,
    avgTicksLostPerInterruptedBeam,
    beams,
    underCruxList,
    interruptedList
  };

  // Synthesize into cast events
  const synthesizedBeams: RawCastEvent[] = beams.map(b => ({
    timestamp: b.startTs,
    type: 'cast',
    sourceID: actorId,
    ability: {
      name: b.morphName,
      guid: b.morphName === 'Exhausting Fatecarver' ? 186366 : 186370,
      abilityIcon: 'ability_arcanist_006.dds'
    },
    fight: 0,
    channelDurationMs: Math.round(b.channelDurationSec * 1000),
    cruxCount: b.cruxBefore
  } as any));

  return {
    cruxStats,
    synthesizedBeams
  };
}

/**
 * Extracts Sorcerer-specific DPS rotation metrics:
 * 1. Crystal Fragments instant proc vs hardcast detection & proc window efficiency.
 * 2. Bound Armaments stack tracking (rewarding 4+ or 8 stacks, flagging < 4 stacks).
 * 3. Status Knife refresh timing (target: 1s before 10s CD, i.e. 8.5s - 9.8s).
 * 4. Haunting Curse double-explosion survival (flagging recasts < 8.5s).
 * 5. Shattered Paths Signet mythic monitoring (ensuring Ultimate never drops below 133).
 * 6. Power Overload opener check & deactivation timing.
 */
export function extractSorcStats(
  events: RawCastEvent[],
  fightStartTs: number,
  fightEndTs: number,
  actorId: number,
  options?: {
    buffEvents?: RawBuffEvent[];
    buffTable?: Array<{ name: string; guid: number; totalUptime: number; type?: number }>;
    ultimateSeries?: Array<[number, number]>;
  }
): SorcStats {
  const details: SorcStats['details'] = [];
  const buffEvents = options?.buffEvents || [];
  const buffTable = options?.buffTable || [];
  const ultSeries = options?.ultimateSeries || [];

  const actorCasts = events
    .filter(e => e.type === 'cast' && e.ability && e.sourceID === actorId)
    .sort((a, b) => a.timestamp - b.timestamp);

  // 1. Crystal Fragments & Procs (guid 46327 for proc buff, 114716/46324 for cast)
  const fragProcBuffs = buffEvents
    .filter(b => b.ability?.guid === 46327 && (b.sourceID === actorId || b.targetID === actorId))
    .sort((a, b) => a.timestamp - b.timestamp);

  const fragsCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return (
      n.includes('crystal fragments') ||
      n.includes('crystal weapon') ||
      c.ability.guid === 114716 ||
      c.ability.guid === 46324
    );
  });

  let procFragsCasts = 0;
  let hardcastFragsCasts = 0;

  for (const fc of fragsCasts) {
    const timeSec = Number(((fc.timestamp - fightStartTs) / 1000).toFixed(1));
    const isProc = fragProcBuffs.some(
      b =>
        Math.abs(b.timestamp - fc.timestamp) <= 300 ||
        (b.type === 'removebuff' && Math.abs(b.timestamp - fc.timestamp) <= 500)
    );

    if (isProc) {
      procFragsCasts++;
    } else {
      hardcastFragsCasts++;
      details.push({
        timeSec,
        description: `Suboptimal hardcast of Crystal Fragments at ${timeSec}s without an instant proc (0.8s cast time, high resource cost).`,
        severity: 'warning'
      });
    }
  }

  const totalFragsCasts = fragsCasts.length;
  const fragProcEfficiencyPct =
    totalFragsCasts > 0 ? Number(((procFragsCasts / totalFragsCasts) * 100).toFixed(1)) : 100;

  // Active GCD skills (excluding Light Attacks, weapon swaps, potions, synergies)
  const gcdCasts = actorCasts.filter(c => {
    const name = c.ability.name.toLowerCase();
    return (
      !name.startsWith('light attack') &&
      !name.includes('swap weapons') &&
      !name.includes('potion') &&
      !isSynergyOrPotion(c.ability.name)
    );
  });

  // Pair applybuff and removebuff into discrete proc windows
  const procWindows: Array<{ start: number; end: number }> = [];
  let currentProcStart: number | null = null;

  for (const b of fragProcBuffs) {
    if (b.type === 'applybuff') {
      currentProcStart = b.timestamp;
    } else if (b.type === 'removebuff' && currentProcStart !== null) {
      procWindows.push({ start: currentProcStart, end: b.timestamp });
      currentProcStart = null;
    }
  }
  if (currentProcStart !== null) {
    procWindows.push({ start: currentProcStart, end: fightEndTs });
  }

  let immediateFragProcsCount = 0;
  let delayedFragProcsCount = 0;
  let expiredFragProcsCount = 0;
  let interveningSkillsDuringProcCount = 0;

  for (const w of procWindows) {
    const procStartSec = Number(((w.start - fightStartTs) / 1000).toFixed(1));

    // Did a Crystal Fragments cast consume this proc around w.end?
    const terminatingFrag = gcdCasts.find(
      c =>
        (c.ability.name.toLowerCase().includes('crystal fragments') ||
          c.ability.guid === 114716 ||
          c.ability.guid === 46324) &&
        Math.abs(c.timestamp - w.end) <= 400
    );

    // Any GCD abilities cast during this proc window before Crystal Fragments was cast
    const intervening = gcdCasts.filter(
      c =>
        c.timestamp > w.start + 150 &&
        c.timestamp < (terminatingFrag ? terminatingFrag.timestamp - 150 : w.end - 100) &&
        !c.ability.name.toLowerCase().includes('crystal fragments')
    );

    if (terminatingFrag) {
      if (intervening.length === 0) {
        immediateFragProcsCount++;
      } else {
        delayedFragProcsCount++;
        interveningSkillsDuringProcCount += intervening.length;
        const skillNames = intervening.map(c => c.ability.name).join(', ');
        const delaySec = ((terminatingFrag.timestamp - w.start) / 1000).toFixed(1);
        details.push({
          timeSec: procStartSec,
          description: `Crystal Fragments Proc delayed for ${delaySec}s: cast ${skillNames} while proc was ready (Crystal Frag Proc is absolute priority!).`,
          severity: 'warning'
        });
      }
    } else {
      expiredFragProcsCount++;
      interveningSkillsDuringProcCount += intervening.length;
      const skillNames =
        intervening.length > 0
          ? `cast ${intervening.map(c => c.ability.name).join(', ')}`
          : 'no skills cast';
      details.push({
        timeSec: procStartSec,
        description: `Crystal Fragments Proc expired after ${((w.end - w.start) / 1000).toFixed(1)}s without being cast (Wasted Proc! ${skillNames}).`,
        severity: 'error'
      });
    }
  }

  const totalFragProcsGained = procWindows.length;
  const fragProcImmediateCastPct =
    totalFragProcsGained > 0
      ? Number(((immediateFragProcsCount / totalFragProcsGained) * 100).toFixed(1))
      : 100;
  const missedProcWindowsCount = delayedFragProcsCount + expiredFragProcsCount;

  // 2. Bound Armaments (guid 24165 for cast, 203447 for stack buff)
  const armBuffs = buffEvents
    .filter(b => b.ability?.guid === 203447 && (b.sourceID === actorId || b.targetID === actorId))
    .sort((a, b) => a.timestamp - b.timestamp);

  const armCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return n.includes('bound armaments') || c.ability.guid === 24165;
  });

  let optimalArmamentsCasts = 0;
  let suboptimalArmamentsCasts = 0;
  let totalStacksAtCast = 0;

  for (const ac of armCasts) {
    const timeSec = Number(((ac.timestamp - fightStartTs) / 1000).toFixed(1));
    const priorEvents = armBuffs.filter(b => b.timestamp <= ac.timestamp + 100);
    let stacksAtCast = 0;
    if (priorEvents.length > 0) {
      for (let i = priorEvents.length - 1; i >= 0; i--) {
        const ev = priorEvents[i];
        if (ev.type === 'applybuffstack' && (ev as any).stack) {
          stacksAtCast = (ev as any).stack;
          break;
        } else if (ev.type === 'removebuffstack' && (ev as any).stack) {
          stacksAtCast = (ev as any).stack;
          break;
        } else if (ev.type === 'applybuff') {
          stacksAtCast = 1;
          break;
        }
      }
    }

    totalStacksAtCast += stacksAtCast;
    if (stacksAtCast >= 4) {
      optimalArmamentsCasts++;
    } else {
      suboptimalArmamentsCasts++;
      details.push({
        timeSec,
        description: `Bound Armaments cast at ${timeSec}s with only ${stacksAtCast} stack(s) (optimal: 4+ or 8 stacks).`,
        severity: 'warning'
      });
    }
  }

  const totalArmamentsCasts = armCasts.length;
  const avgStacksAtCast =
    totalArmamentsCasts > 0 ? Number((totalStacksAtCast / totalArmamentsCasts).toFixed(1)) : 0;

  // 3. Status Knife (Sundering Knife / Traveling Knife with Assassin's Misery, buff 218988)
  const knifeCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return n.includes('knife') || c.ability.guid === 217872;
  });

  let optimalKnifeRefreshes = 0;
  let droppedKnifeCount = 0;
  let prematureKnifeCount = 0;
  let totalKnifeInterval = 0;
  let knifeIntervalCount = 0;

  for (let i = 1; i < knifeCasts.length; i++) {
    const intervalSec = (knifeCasts[i].timestamp - knifeCasts[i - 1].timestamp) / 1000;
    const timeSec = Number(((knifeCasts[i].timestamp - fightStartTs) / 1000).toFixed(1));
    totalKnifeInterval += intervalSec;
    knifeIntervalCount++;

    if (intervalSec < 8.0) {
      prematureKnifeCount++;
      details.push({
        timeSec,
        description: `Status Knife refreshed prematurely at ${timeSec}s (${intervalSec.toFixed(1)}s interval; target: ~1s before 10s CD).`,
        severity: 'info'
      });
    } else if (intervalSec > 10.5) {
      droppedKnifeCount++;
      details.push({
        timeSec,
        description: `Status Knife dropped for ${(intervalSec - 10).toFixed(1)}s at ${timeSec}s (${intervalSec.toFixed(1)}s interval; target: ~1s before 10s CD).`,
        severity: 'warning'
      });
    } else {
      optimalKnifeRefreshes++;
    }
  }

  const totalKnifeCasts = knifeCasts.length;
  const avgKnifeIntervalSec =
    knifeIntervalCount > 0 ? Number((totalKnifeInterval / knifeIntervalCount).toFixed(1)) : 0;

  // 4. Haunting Curse (guid 24330, explodes at 3.5s and 8.5s)
  const curseCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return n.includes('curse') || c.ability.guid === 24330;
  });

  let recastBeforeSecondExplosionCount = 0;
  let optimalCurseRefreshes = 0;
  let totalCurseInterval = 0;
  let curseIntervalCount = 0;

  for (let i = 1; i < curseCasts.length; i++) {
    const intervalSec = (curseCasts[i].timestamp - curseCasts[i - 1].timestamp) / 1000;
    const timeSec = Number(((curseCasts[i].timestamp - fightStartTs) / 1000).toFixed(1));
    totalCurseInterval += intervalSec;
    curseIntervalCount++;

    if (intervalSec < 8.5) {
      recastBeforeSecondExplosionCount++;
      details.push({
        timeSec,
        description: `Haunting Curse recast at ${timeSec}s after only ${intervalSec.toFixed(1)}s, clipping the 2nd explosion at 8.5s!`,
        severity: 'error'
      });
    } else {
      optimalCurseRefreshes++;
    }
  }

  const totalCurseCasts = curseCasts.length;
  const avgCurseIntervalSec =
    curseIntervalCount > 0 ? Number((totalCurseInterval / curseIntervalCount).toFixed(1)) : 0;

  // 5. Shattered Paths Signet & Power Overload
  const hasShatteredPathsSignet = buffTable.some(
    b => b.guid === 261285 || b.name.toLowerCase().includes('shattered paths')
  );

  let minUltimateValue: number | undefined = undefined;
  let ultimateBelow133Count: number | undefined = undefined;
  let timeBelow133Sec: number | undefined = undefined;

  if (hasShatteredPathsSignet && ultSeries.length > 0) {
    // Exclude the final 5 seconds before death (execute phase where dumping ult right before boss dies is expected)
    const executeCutoffTs = fightEndTs - 5000;
    const nonExecuteSeries = ultSeries.filter(d => d[0] < executeCutoffTs);

    // If the fight is longer than 5s, evaluate violations only during active combat before execute cutoff
    const evaluationSeries = nonExecuteSeries.length > 0 ? nonExecuteSeries : ultSeries;
    const ultValues = evaluationSeries.map(d => d[1]);
    minUltimateValue = Math.min(...ultValues);
    const below133 = evaluationSeries.filter(d => d[1] < 133);
    ultimateBelow133Count = below133.length;
    timeBelow133Sec = Math.round(below133.length);

    if (ultimateBelow133Count > 0) {
      details.push({
        timeSec: 0,
        description: `Shattered Paths Signet equipped: Ultimate dropped to ${minUltimateValue} (< 133 required minimum) across ${ultimateBelow133Count} recorded intervals (excluding final 5s execute), causing loss of maximum status effect bonus!`,
        severity: 'error'
      });
    }
  }

  // Power Overload check
  const overloadCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return n.includes('overload') || c.ability.guid === 24785;
  });

  let powerOverloadOpenedActive: boolean | undefined = undefined;
  let powerOverloadDeactivatedInTime: boolean | undefined = undefined;

  if (overloadCasts.length > 0) {
    const first5sCasts = actorCasts.filter(c => c.timestamp - fightStartTs <= 5000);
    powerOverloadOpenedActive = first5sCasts.some(c =>
      c.ability.name.toLowerCase().includes('overload')
    );
    if (hasShatteredPathsSignet) {
      powerOverloadDeactivatedInTime =
        minUltimateValue !== undefined ? minUltimateValue >= 133 : true;
    } else {
      powerOverloadDeactivatedInTime = true;
    }
  }

  // Sort details chronologically
  details.sort((a, b) => a.timeSec - b.timeSec);

  return {
    totalFragsCasts,
    procFragsCasts,
    hardcastFragsCasts,
    fragProcEfficiencyPct,
    totalFragProcsGained,
    immediateFragProcsCount,
    delayedFragProcsCount,
    expiredFragProcsCount,
    interveningSkillsDuringProcCount,
    fragProcImmediateCastPct,
    missedProcWindowsCount,
    totalArmamentsCasts,
    optimalArmamentsCasts,
    suboptimalArmamentsCasts,
    avgStacksAtCast,
    totalKnifeCasts,
    avgKnifeIntervalSec,
    optimalKnifeRefreshes,
    droppedKnifeCount,
    prematureKnifeCount,
    totalCurseCasts,
    avgCurseIntervalSec,
    recastBeforeSecondExplosionCount,
    optimalCurseRefreshes,
    hasShatteredPathsSignet,
    minUltimateValue,
    ultimateBelow133Count,
    timeBelow133Sec,
    powerOverloadOpenedActive,
    powerOverloadDeactivatedInTime,
    details
  };
}

/**
 * Extracts Dragonknight DPS and Tank rotation metrics:
 * 1. Magma Fist & Heat Shock cadence (single-target debuff on main boss, max 3 stacks, 7s duration, optimal refresh 5.5s-6.8s).
 * 2. Igneous Weapons 60s group buff uptime and recast cadence.
 * 3. Status Knife cadence (10s CD, refresh ~1s early: 8.5s-9.8s).
 * 4. Whip mini-games (Both morphs are spammables; never penalize individual casts if DoTs are running):
 *    - Flame Lash: Off-Balance reaction delay ms, Power Lash casts in OB window, DoTs expired during Lash, priority check (Magma Fist / Knife take priority).
 *    - Molten Whip: Stacks of Seething Fury (guid 122658), % of casts at 3 stacks (+99% damage bonus).
 * 5. Dragonknight Standard (250 Ult): sitting at 250+ Ult, with exemption for phased burn windows.
 * 6. DK Tank Debuffs (main boss only): Taunt (100%), Major Breach (100%), Crusher (~80-100%), Maim.
 */
export function extractDKStats(
  events: RawCastEvent[],
  fightStartTs: number,
  fightEndTs: number,
  actorId: number,
  spec: RotationSpec,
  options?: {
    buffEvents?: RawBuffEvent[];
    damageEvents?: RawDamageEvent[];
    buffTable?: Array<{ name: string; guid: number; totalUptime: number; type?: number }>;
    debuffTable?: Array<{
      name: string;
      guid: number;
      totalUptime: number;
      totalUses: number;
      type?: number;
      bands?: Array<{ startTime: number; endTime: number }>;
    }> | {
      auras?: Array<{
        name: string;
        guid: number;
        totalUptime: number;
        totalUses: number;
        type?: number;
        bands?: Array<{ startTime: number; endTime: number }>;
      }>;
    };
    ultimateSeries?: Array<[number, number]>;
  }
): DKStats {
  const details: DKStats['details'] = [];
  const buffEvents = options?.buffEvents || [];
  const buffTable = options?.buffTable || [];
  const ultSeries = options?.ultimateSeries || [];

  const rawDebuff = options?.debuffTable;
  const debuffAuras = Array.isArray(rawDebuff)
    ? rawDebuff
    : rawDebuff?.auras || [];

  const durationMs = Math.max(1000, fightEndTs - fightStartTs);

  const actorCasts = events
    .filter(e => e.type === 'cast' && e.ability && e.sourceID === actorId)
    .sort((a, b) => a.timestamp - b.timestamp);

  // Determine spec variant
  let specVariant: 'tank' | 'zenkosh' | 'parse' = 'parse';
  if (spec.id.toLowerCase().includes('tank')) {
    specVariant = 'tank';
  } else if (spec.id.toLowerCase().includes('zenkosh')) {
    specVariant = 'zenkosh';
  }

  // --- 1. Magma Fist & Heat Shock ---
  const magmaFistCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return n.includes('magma fist') || c.ability.guid === 134340 || c.ability.guid === 134341;
  });

  let magmaFistStats: DKStats['magmaFist'] = undefined;
  if (magmaFistCasts.length > 0) {
    let optimalRefreshes = 0;
    let earlyRefreshes = 0;
    let droppedRefreshes = 0;
    let totalIntervalSec = 0;

    for (let i = 1; i < magmaFistCasts.length; i++) {
      const prev = magmaFistCasts[i - 1];
      const curr = magmaFistCasts[i];
      const intervalSec = Number(((curr.timestamp - prev.timestamp) / 1000).toFixed(1));
      const timeSec = Number(((curr.timestamp - fightStartTs) / 1000).toFixed(1));
      totalIntervalSec += intervalSec;

      if (intervalSec >= 5.5 && intervalSec <= 6.8) {
        optimalRefreshes++;
      } else if (intervalSec < 5.0) {
        earlyRefreshes++;
        details.push({
          timeSec,
          description: `Magma Fist cast early at ${timeSec}s (${intervalSec}s since last cast). Wait until ~1s before Heat Shock expires (5.5s–6.8s) to sustain 3 stacks without wasting GCDs.`,
          severity: 'info'
        });
      } else if (intervalSec > 7.2) {
        droppedRefreshes++;
        details.push({
          timeSec,
          description: `Heat Shock dropped! Recast Magma Fist after ${intervalSec}s at ${timeSec}s. Stacks fell from 3 to 1, losing group damage scaling.`,
          severity: 'warning'
        });
      }
    }

    const intervalsCount = Math.max(1, magmaFistCasts.length - 1);
    const avgIntervalSec = Number((totalIntervalSec / intervalsCount).toFixed(1));

    // Calculate Heat Shock debuff uptime and 3-stack uptime on main boss
    const heatShockAura = debuffAuras.find(
      a => a.guid === 134340 || a.name.toLowerCase().includes('heat shock')
    );

    let heatShockUptimePct = 0;
    if (heatShockAura && heatShockAura.totalUptime > 0) {
      heatShockUptimePct = Math.min(100, Math.round((heatShockAura.totalUptime / durationMs) * 100));
    } else {
      // Estimate from casts (7.0s duration per cast)
      let activeMs = 0;
      let lastCoveredEnd = 0;
      for (const c of magmaFistCasts) {
        const start = Math.max(lastCoveredEnd, c.timestamp);
        const end = Math.min(fightEndTs, c.timestamp + 7000);
        if (end > start) {
          activeMs += end - start;
          lastCoveredEnd = end;
        }
      }
      heatShockUptimePct = Math.min(100, Math.round((activeMs / durationMs) * 100));
    }

    // Calculate 3-stack Heat Shock duration
    let currentStacks = 0;
    let threeStackStart: number | null = null;
    let threeStackMs = 0;
    let lastCastTs = 0;

    for (const c of magmaFistCasts) {
      if (lastCastTs > 0 && c.timestamp - lastCastTs > 7200) {
        if (threeStackStart !== null) {
          threeStackMs += Math.min(lastCastTs + 7000, fightEndTs) - threeStackStart;
          threeStackStart = null;
        }
        currentStacks = 1;
      } else {
        currentStacks = Math.min(3, currentStacks + 1);
        if (currentStacks === 3 && threeStackStart === null) {
          threeStackStart = c.timestamp;
        }
      }
      lastCastTs = c.timestamp;
    }
    if (threeStackStart !== null && lastCastTs > 0) {
      threeStackMs += Math.min(lastCastTs + 7000, fightEndTs) - threeStackStart;
    }
    const heatShockThreeStackUptimePct = Math.min(100, Math.round((threeStackMs / durationMs) * 100));

    magmaFistStats = {
      hasMagmaFist: true,
      totalCasts: magmaFistCasts.length,
      avgIntervalSec,
      optimalRefreshes,
      earlyRefreshes,
      droppedRefreshes,
      heatShockUptimePct,
      heatShockThreeStackUptimePct
    };
  }

  // --- 2. Igneous Weapons ---
  const igneousCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return n.includes('igneous weapons') || n.includes('molten weapons') || c.ability.guid === 31874 || c.ability.guid === 258666;
  });

  let igneousWeaponsStats: DKStats['igneousWeapons'] = undefined;
  if (igneousCasts.length > 0) {
    let prematureRecasts = 0;
    let droppedWindows = 0;

    for (let i = 1; i < igneousCasts.length; i++) {
      const prev = igneousCasts[i - 1];
      const curr = igneousCasts[i];
      const intervalSec = (curr.timestamp - prev.timestamp) / 1000;
      const timeSec = Number(((curr.timestamp - fightStartTs) / 1000).toFixed(1));

      if (intervalSec < 45) {
        prematureRecasts++;
        details.push({
          timeSec,
          description: `Igneous Weapons recast prematurely at ${timeSec}s (${intervalSec.toFixed(1)}s since last cast; buff lasts 60s). Save GCDs by waiting closer to 60s.`,
          severity: 'info'
        });
      } else if (intervalSec > 62) {
        droppedWindows++;
        details.push({
          timeSec,
          description: `Igneous Weapons dropped for ${(intervalSec - 60).toFixed(1)}s at ${timeSec}s. Group lost Major Brutality and Sorcery.`,
          severity: 'warning'
        });
      }
    }

    const igneousBuff = buffTable.find(
      b => b.guid === 31874 || b.name.toLowerCase().includes('igneous weapons')
    );
    let uptimePct = 0;
    if (igneousBuff && igneousBuff.totalUptime > 0) {
      uptimePct = Math.min(100, Math.round((igneousBuff.totalUptime / durationMs) * 100));
    } else {
      let activeMs = 0;
      let lastCoveredEnd = 0;
      for (const c of igneousCasts) {
        const start = Math.max(lastCoveredEnd, c.timestamp);
        const end = Math.min(fightEndTs, c.timestamp + 60000);
        if (end > start) {
          activeMs += end - start;
          lastCoveredEnd = end;
        }
      }
      uptimePct = Math.min(100, Math.round((activeMs / durationMs) * 100));
    }

    igneousWeaponsStats = {
      hasIgneousWeapons: true,
      totalCasts: igneousCasts.length,
      uptimePct,
      prematureRecasts,
      droppedWindows
    };
  }

  // --- 3. Status Knife ---
  const knifeCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return (
      (n.includes('knife') || c.ability.guid === 217872 || c.ability.guid === 217353) &&
      !n.startsWith('light attack')
    );
  });

  let statusKnifeStats: DKStats['statusKnife'] = undefined;
  if (knifeCasts.length > 0) {
    let optimalRefreshes = 0;
    let prematureRefreshes = 0;
    let droppedRefreshes = 0;
    let totalKnifeInterval = 0;

    for (let i = 1; i < knifeCasts.length; i++) {
      const prev = knifeCasts[i - 1];
      const curr = knifeCasts[i];
      const intervalSec = Number(((curr.timestamp - prev.timestamp) / 1000).toFixed(1));
      const timeSec = Number(((curr.timestamp - fightStartTs) / 1000).toFixed(1));
      totalKnifeInterval += intervalSec;

      if (intervalSec >= 8.5 && intervalSec <= 9.8) {
        optimalRefreshes++;
      } else if (intervalSec < 8.0) {
        prematureRefreshes++;
        details.push({
          timeSec,
          description: `Status Knife refreshed early at ${timeSec}s (${intervalSec}s interval; 10s cooldown). Delay recast to ~9s to save GCDs.`,
          severity: 'info'
        });
      } else if (intervalSec > 10.5) {
        droppedRefreshes++;
        details.push({
          timeSec,
          description: `Status Knife debuff dropped at ${timeSec}s (${intervalSec}s interval). Refresh ~1s before 10s CD to maintain status effect uptime.`,
          severity: 'warning'
        });
      }
    }

    const intervalsCount = Math.max(1, knifeCasts.length - 1);
    const avgIntervalSec = Number((totalKnifeInterval / intervalsCount).toFixed(1));

    statusKnifeStats = {
      totalCasts: knifeCasts.length,
      avgIntervalSec,
      optimalRefreshes,
      droppedRefreshes,
      prematureRefreshes
    };
  }

  // --- 4. Whip Mini-Games (Flame Lash vs Molten Whip) ---
  const flameLashCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return n.includes('flame lash') || c.ability.guid === 20779;
  });

  const moltenWhipCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return n.includes('molten whip') || c.ability.guid === 20805;
  });

  let whipMiniGameStats: DKStats['whipMiniGame'] = undefined;
  const isFlameLash = flameLashCasts.length > 0;
  const isMoltenWhip = !isFlameLash && moltenWhipCasts.length > 0;

  if (isFlameLash) {
    const obAura = debuffAuras.find(
      a => a.guid === 62988 || a.guid === 45902 || a.name.toLowerCase().includes('off balance')
    );
    const obBands = obAura?.bands || [];
    const reactionDelays: number[] = [];
    let castsInOffBalance = 0;
    let powerLashCasts = 0;

    const dotAbilities = [
      { name: 'Venomous Claw', duration: 20000, guids: [20925, 20927] },
      { name: 'Engulfing Flames', duration: 15000, guids: [20919, 20921] },
      { name: 'Flames of Oblivion', duration: 15000, guids: [20816, 20818] },
      { name: 'Stampede', duration: 15000, guids: [38782] },
      { name: 'Carve', duration: 12000, guids: [38745] },
      { name: 'Barbed Trap', duration: 20000, guids: [40382] },
      { name: 'Status Knife', duration: 10000, guids: [217872, 217353] },
      { name: 'Magma Fist', duration: 7000, guids: [134340, 134341] }
    ];

    const expiredDotsDuringLash: Array<{
      name: string;
      expiredAtSec: number;
      whipCastSec: number;
    }> = [];
    let priorityViolationsCount = 0;

    for (const band of obBands) {
      const firstLashInBand = flameLashCasts.find(
        c => c.timestamp >= band.startTime - 200 && c.timestamp <= band.endTime + 500
      );
      if (firstLashInBand) {
        const delay = Math.max(0, firstLashInBand.timestamp - band.startTime);
        reactionDelays.push(delay);
      }

      const lashesInBand = flameLashCasts.filter(
        c => c.timestamp >= band.startTime - 200 && c.timestamp <= band.endTime + 300
      );
      castsInOffBalance += lashesInBand.length;
      powerLashCasts += lashesInBand.length;
    }

    for (const c of flameLashCasts) {
      const timeSec = Number(((c.timestamp - fightStartTs) / 1000).toFixed(1));

      // Check priority of Magma Fist and Status Knife over Lash
      if (magmaFistCasts.length > 0) {
        const lastMF = [...magmaFistCasts].filter(m => m.timestamp < c.timestamp).pop();
        if (lastMF && c.timestamp - lastMF.timestamp > 6500) {
          priorityViolationsCount++;
          details.push({
            timeSec,
            description: `Priority violation: Cast Flame Lash at ${timeSec}s while Heat Shock was at risk of dropping (${((c.timestamp - lastMF.timestamp) / 1000).toFixed(1)}s since last Magma Fist). Heat Shock takes priority!`,
            severity: 'warning'
          });
        }
      }

      if (knifeCasts.length > 0) {
        const lastKnife = [...knifeCasts].filter(k => k.timestamp < c.timestamp).pop();
        if (lastKnife && c.timestamp - lastKnife.timestamp > 10000) {
          priorityViolationsCount++;
          details.push({
            timeSec,
            description: `Priority violation: Cast Flame Lash at ${timeSec}s while Status Knife debuff was dropped (${((c.timestamp - lastKnife.timestamp) / 1000).toFixed(1)}s since last Knife). Status Knife takes priority!`,
            severity: 'warning'
          });
        }
      }

      // Check which DoTs expired while casting Lash
      for (const dot of dotAbilities) {
        const lastCast = actorCasts
          .filter(
            ac =>
              ac.timestamp < c.timestamp &&
              (ac.ability.name.toLowerCase().includes(dot.name.toLowerCase()) ||
                dot.guids.includes(ac.ability.guid))
          )
          .pop();

        if (lastCast) {
          const expirationTs = lastCast.timestamp + dot.duration;
          if (c.timestamp > expirationTs && c.timestamp - expirationTs <= 3000) {
            const alreadyFlagged = expiredDotsDuringLash.some(
              e => e.name === dot.name && Math.abs(e.whipCastSec - timeSec) < 4
            );
            if (!alreadyFlagged) {
              const expiredAtSec = Number(((expirationTs - fightStartTs) / 1000).toFixed(1));
              expiredDotsDuringLash.push({
                name: dot.name,
                expiredAtSec,
                whipCastSec: timeSec
              });
              details.push({
                timeSec,
                description: `DoT expired during Flame Lash: ${dot.name} expired at ${expiredAtSec}s while casting Flame Lash at ${timeSec}s.`,
                severity: 'info'
              });
            }
          }
        }
      }
    }

    const avgReactionDelay =
      reactionDelays.length > 0
        ? Math.round(reactionDelays.reduce((a, b) => a + b, 0) / reactionDelays.length)
        : undefined;

    whipMiniGameStats = {
      morph: 'flame_lash',
      totalCasts: flameLashCasts.length,
      reactionDelayMs: avgReactionDelay,
      castsInOffBalance,
      powerLashCasts: Math.max(powerLashCasts, Math.min(flameLashCasts.length, castsInOffBalance * 2)),
      offBalanceWindowsCount: obBands.length,
      expiredDotsDuringLash,
      priorityViolationsCount
    };
  } else if (isMoltenWhip) {
    const seethingBuffs = buffEvents
      .filter(b => b.ability?.guid === 122658 || b.ability?.name?.toLowerCase().includes('seething fury'))
      .sort((a, b) => a.timestamp - b.timestamp);

    let castsAtThreeStacks = 0;
    let castsUnderThreeStacks = 0;

    if (seethingBuffs.length > 0) {
      for (const whip of moltenWhipCasts) {
        const timeSec = Number(((whip.timestamp - fightStartTs) / 1000).toFixed(1));
        const priorBuffEvents = seethingBuffs.filter(b => b.timestamp <= whip.timestamp + 50);
        let currentStack = 0;

        for (const b of priorBuffEvents) {
          if (b.timestamp >= whip.timestamp && b.type === 'removebuff') {
            continue;
          }
          if (b.type === 'applybuff') currentStack = 1;
          else if (b.type === 'applybuffstack' && b.stack) currentStack = b.stack;
          else if (b.type === 'removebuff') currentStack = 0;
        }

        if (currentStack >= 3) {
          castsAtThreeStacks++;
        } else {
          castsUnderThreeStacks++;
          details.push({
            timeSec,
            description: `Molten Whip cast at ${timeSec}s with ${currentStack} stack(s) of Seething Fury (< 3 stacks). Build 3 stacks with Ardent Flame skills for the full +99% damage bonus.`,
            severity: 'info'
          });
        }
      }
    } else {
      const ardentFlameNames = [
        'venomous claw',
        'burning claw',
        'searing strike',
        'engulfing flames',
        'fiery breath',
        'flames of oblivion',
        'inferno',
        'standard'
      ];

      let simulatedStacks = 0;
      let lastCastIdx = 0;

      for (const whip of moltenWhipCasts) {
        const timeSec = Number(((whip.timestamp - fightStartTs) / 1000).toFixed(1));
        const interveningArdent = actorCasts.filter(
          c =>
            c.timestamp > lastCastIdx &&
            c.timestamp < whip.timestamp &&
            ardentFlameNames.some(af => c.ability.name.toLowerCase().includes(af))
        );

        simulatedStacks = Math.min(3, simulatedStacks + interveningArdent.length);

        if (simulatedStacks >= 3) {
          castsAtThreeStacks++;
        } else {
          castsUnderThreeStacks++;
          details.push({
            timeSec,
            description: `Molten Whip cast at ${timeSec}s with ~${simulatedStacks} stack(s) of Seething Fury (< 3 stacks). Build 3 stacks before unleashing.`,
            severity: 'info'
          });
        }
        simulatedStacks = 0;
        lastCastIdx = whip.timestamp;
      }
    }

    const totalWhip = castsAtThreeStacks + castsUnderThreeStacks;
    const seethingFuryThreeStackPct =
      totalWhip > 0 ? Math.round((castsAtThreeStacks / totalWhip) * 100) : 100;

    whipMiniGameStats = {
      morph: 'molten_whip',
      totalCasts: moltenWhipCasts.length,
      castsAtThreeStacks,
      castsUnderThreeStacks,
      seethingFuryThreeStackPct
    };
  } else {
    whipMiniGameStats = {
      morph: 'none',
      totalCasts: 0
    };
  }

  // --- 5. Dragonknight Standard (250 Ult) ---
  const standardCasts = actorCasts.filter(c => {
    const n = c.ability.name.toLowerCase();
    return n.includes('standard') || c.ability.guid === 32947 || c.ability.guid === 32958;
  });

  let standardStats: DKStats['standard'] = undefined;
  if (standardCasts.length > 0 || ultSeries.length > 0) {
    let timeAt250PlusUltSec = 0;
    let phasedHoldExemptSec = 0;
    let penalizedHoldSec = 0;

    if (ultSeries.length > 0) {
      const samplesAt250 = ultSeries.filter(u => u[1] >= 250);
      timeAt250PlusUltSec = samplesAt250.length;

      for (const sample of samplesAt250) {
        const sampleTs = sample[0];
        const nextStandard = standardCasts.find(sc => sc.timestamp >= sampleTs && sc.timestamp <= sampleTs + 15000);
        const nearEnd = fightEndTs - sampleTs <= 10000;

        if (nextStandard || nearEnd) {
          phasedHoldExemptSec++;
        } else {
          penalizedHoldSec++;
        }
      }

      if (penalizedHoldSec > 12) {
        details.push({
          timeSec: 0,
          description: `Dragonknight Standard: Sat at 250+ Ultimate for ${penalizedHoldSec}s during active combat without dropping standard. Place standard promptly unless holding for upcoming burn phases.`,
          severity: 'warning'
        });
      }
    }

    standardStats = {
      hasStandard: standardCasts.length > 0,
      totalCasts: standardCasts.length,
      timeAt250PlusUltSec,
      phasedHoldExemptSec,
      penalizedHoldSec
    };
  }

  // --- 6. Tank Debuff Stats (Main Boss Only) ---
  let tankDebuffs: DKStats['tankDebuffs'] = undefined;
  if (specVariant === 'tank') {
    const findAuraUptime = (names: string[], guids: number[]) => {
      const match = debuffAuras.find(
        a => guids.includes(a.guid) || names.some(n => a.name.toLowerCase().includes(n))
      );
      if (match && match.totalUptime > 0) {
        return Math.min(100, Math.round((match.totalUptime / durationMs) * 100));
      }
      return 0;
    };

    const tauntUptimePct = findAuraUptime(['taunt'], [38254]);
    const majorBreachUptimePct = findAuraUptime(['major breach'], [61743, 62775]);
    const crusherUptimePct = findAuraUptime(['crusher'], [17906]);
    const maimUptimePct = findAuraUptime(['maim'], [61723, 68368, 61725, 108833]);

    if (tauntUptimePct > 0 && tauntUptimePct < 95) {
      details.push({
        timeSec: 0,
        description: `Taunt uptime on main boss was ${tauntUptimePct}% (target: 100%). Refresh Pierce Armor before it expires to keep boss locked.`,
        severity: 'error'
      });
    }

    if (majorBreachUptimePct > 0 && majorBreachUptimePct < 90) {
      details.push({
        timeSec: 0,
        description: `Major Breach uptime was ${majorBreachUptimePct}% (target: 100%). Reapply Pierce Armor to maintain group physical and spell penetration.`,
        severity: 'warning'
      });
    }

    if (crusherUptimePct > 0 && crusherUptimePct < 75) {
      details.push({
        timeSec: 0,
        description: `Crusher enchant uptime was ${crusherUptimePct}% (target: ~80-100%). Ensure your Infused backbar weapon enchant is proccing consistently.`,
        severity: 'warning'
      });
    }

    tankDebuffs = {
      isTank: true,
      tauntUptimePct,
      majorBreachUptimePct,
      crusherUptimePct,
      maimUptimePct
    };
  }

  details.sort((a, b) => a.timeSec - b.timeSec);

  return {
    specVariant,
    magmaFist: magmaFistStats,
    igneousWeapons: igneousWeaponsStats,
    whipMiniGame: whipMiniGameStats,
    standard: standardStats,
    tankDebuffs,
    statusKnife: statusKnifeStats,
    details
  };
}

/**
 * Normalizes and filters raw cast events, categorizing GCD skills according to the spec,
 * while analyzing ESO's animation cancelling (Light Attack weaving & Bar Swaps) and idle time.
 * Implements the core combat mechanics:
 * 1. Synergies and Potions are off-GCD and do not interrupt casts or channels.
 * 2. Light Attack animation is cancelled by immediate skill cast (< 0.7s) -> weaved [LA + Skill] combo.
 *    Skill animation CAN NOT be cancelled by a Light Attack.
 * 3. Standalone Light Attacks (gap >= 0.7s) count as individual active actions on the GCD.
 * 4. Heavy Attacks and Avoidance actions (Roll Dodge ~800ms) count as individual active actions.
 * 5. Utility actions (Swap Weapons, Bash, Block) adjacent to casts (< 0.7s) count as animation cancels,
 *    otherwise if isolated count as separate actions.
 */
export function normalizeCasts(
  events: RawCastEvent[],
  fightStartTs: number,
  spec: RotationSpec,
  damageEvents?: RawDamageEvent[]
): {
  normalized: NormalizedGCDCast[];
  totalLightAttacks: number;
  totalBarSwaps: number;
} {
  const nonGCDSet = new Set((spec.nonGCDSkills || []).map(s => s.toLowerCase()));

  // 1. Filter out synergies & potions (off-GCD, non-interrupting)
  // Avoidance actions, weapon attacks, and utilities are handled by combat rules, not discarded by nonGCDSet.
  const validEvents = events
    .filter(ev => ev.type === 'cast' && ev.ability && ev.ability.name)
    .filter(ev => {
      const name = ev.ability.name.trim();
      const lower = name.toLowerCase();

      // Always filter out synergies and potions
      if (isSynergyOrPotion(name)) return false;

      // Keep Light Attacks, Heavy Attacks, Roll Dodge, and Utility actions for rule evaluation
      if (
        lower.startsWith('light attack') ||
        lower.startsWith('heavy attack') ||
        lower.includes('roll dodge') ||
        isUtilityAction(lower)
      ) {
        return true;
      }

      if (nonGCDSet.has(lower)) return false;

      return true;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  const totalLightAttacks = validEvents.filter(e =>
    e.ability.name.toLowerCase().startsWith('light attack')
  ).length;
  const totalBarSwaps = validEvents.filter(e =>
    e.ability.name.toLowerCase().includes('swap weapons')
  ).length;

  // Pass 1: Identify which Light Attacks are weaved into a subsequent skill (< 700ms)
  // Per ESO mechanics and the parse guide video:
  // - LA animation CAN be cancelled by skill cast, barswap, dodge, bash, block
  // - Skill animation CAN NOT be cancelled by a light attack
  // - LA immediately preceding a skill (< 700ms, ideally 50-200ms) is paired with that skill
  // - Skill gets hasPrecedingLA = true, laTimestamp, and weaveDelayMs
  const weavedLAIndices = new Set<number>();
  const skillToLAPair = new Map<number, RawCastEvent>();

  for (let i = 0; i < validEvents.length; i++) {
    const ev = validEvents[i];
    const lower = ev.ability.name.toLowerCase();
    if (!lower.startsWith('light attack')) continue;

    // Look forward for the immediate next active action (regular skill, Heavy Attack, or Roll Dodge)
    for (let j = i + 1; j < validEvents.length; j++) {
      const nextEv = validEvents[j];
      const nextLower = nextEv.ability.name.toLowerCase();

      // Another LA cannot cancel an LA (consecutive LAs count as missed skill after LA)
      if (nextLower.startsWith('light attack')) break;

      const gap = nextEv.timestamp - ev.timestamp;
      if (gap < 700 && gap >= 0) {
        weavedLAIndices.add(i);
        skillToLAPair.set(j, ev);
      }
      break; // Only check immediate next action
    }
  }

  // Pass 2: Identify utility actions (Swap Weapons, Bash, Block)
  // Per Rule 3 & video guide:
  // - Orange pluses are adjacent to adjacent casts if within < 700ms (or within 1000ms after preceding skill)
  // - In that case they are animation cancels (clipping post-cast delay) and not separate GCD steps
  // - Otherwise if isolated (gap >= 700ms from both prev and next casts), count as separate actions
  const adjacentUtilityIndices = new Set<number>();

  for (let i = 0; i < validEvents.length; i++) {
    const ev = validEvents[i];
    if (!isUtilityAction(ev.ability.name)) continue;

    const prevEv = i > 0 ? validEvents[i - 1] : null;
    const nextEv = i < validEvents.length - 1 ? validEvents[i + 1] : null;

    const prevDist = prevEv ? ev.timestamp - prevEv.timestamp : Infinity;
    const nextDist = nextEv ? nextEv.timestamp - ev.timestamp : Infinity;

    if (prevDist < 700 || nextDist < 700 || prevDist <= 1000) {
      adjacentUtilityIndices.add(i);
    }
  }

  // Pass 3: Construct normalized GCD casts
  const normalized: NormalizedGCDCast[] = [];

  for (let i = 0; i < validEvents.length; i++) {
    const ev = validEvents[i];
    const name = ev.ability.name.trim();
    const lower = name.toLowerCase();

    // Skip weaved LAs (absorbed into following skill)
    if (weavedLAIndices.has(i)) continue;

    // Skip adjacent utilities (absorbed as animation cancels)
    if (adjacentUtilityIndices.has(i)) continue;

    const isLA = lower.startsWith('light attack');
    const classification = classifySkill(name, ev.ability.guid, spec);

    const pairedLA = skillToLAPair.get(i);
    const hasPrecedingLA = !!pairedLA;
    const laTimestamp = pairedLA ? pairedLA.timestamp : undefined;
    const weaveDelayMs = pairedLA ? ev.timestamp - pairedLA.timestamp : undefined;

    let laHit: boolean | undefined = undefined;
    if (damageEvents && damageEvents.length > 0) {
      const laTargetTs = pairedLA ? pairedLA.timestamp : (isLA ? ev.timestamp : undefined);
      if (laTargetTs !== undefined) {
        const found = damageEvents.some(
          d =>
            d.ability &&
            d.ability.name.toLowerCase().startsWith('light attack') &&
            d.timestamp >= laTargetTs - 100 &&
            d.timestamp <= laTargetTs + 800
        );
        laHit = found;
      }
    }

    // Check if followed by a bar swap animation cancel within 1000ms
    const followedByBarSwap = validEvents.some(
      (u, uIdx) =>
        adjacentUtilityIndices.has(uIdx) &&
        u.ability.name.toLowerCase().includes('swap weapons') &&
        u.timestamp >= ev.timestamp &&
        u.timestamp <= ev.timestamp + 1000
    );

    normalized.push({
      timestamp: ev.timestamp,
      timeSec: Math.max(0, (ev.timestamp - fightStartTs) / 1000),
      abilityName: name,
      abilityGuid: ev.ability.guid,
      classification,
      icon: ev.ability.abilityIcon,
      hasPrecedingLA,
      laTimestamp,
      weaveDelayMs,
      isStandaloneLA: isLA,
      laHit,
      followedByBarSwap,
      channelDurationMs: (ev as any).channelDurationMs,
      cruxCount: (ev as any).cruxCount
    });
  }

  // Calculate gaps and idle times between consecutive GCD casts
  for (let i = 0; i < normalized.length - 1; i++) {
    const diffMs = normalized[i + 1].timestamp - normalized[i].timestamp;
    normalized[i].gapToNextSkillMs = diffMs;

    const isDodge = normalized[i].abilityName.toLowerCase().includes('roll dodge');
    const isUtil = isUtilityAction(normalized[i].abilityName);
    const defaultDuration = (isDodge || isUtil) ? 800 : ESO_SKILL_GCD_MS;
    const activeDurationMs = normalized[i].channelDurationMs || defaultDuration;

    normalized[i].idleTimeMs = Math.max(0, diffMs - activeDurationMs);
  }

  if (normalized.length > 0) {
    const last = normalized[normalized.length - 1];
    last.gapToNextSkillMs = last.channelDurationMs || ESO_SKILL_GCD_MS;
    last.idleTimeMs = 0;
  }

  return {
    normalized,
    totalLightAttacks,
    totalBarSwaps
  };
}

/**
 * Classifies an ability into a GCDClassification token based on spec rules
 */
export function classifySkill(
  abilityName: string,
  guid: number,
  spec: RotationSpec
): GCDClassification {
  const lower = abilityName.toLowerCase();

  // 1. Avoidance mechanics (Roll Dodge)
  if (lower.includes('roll dodge') || lower.includes('dodge')) {
    return 'Mechanic';
  }

  // 2. Heavy Attacks and Standalone Light Attacks are resource/filler spammables
  if (lower.startsWith('heavy attack') || lower.startsWith('light attack')) {
    return 'Skull';
  }

  // 3. Isolated utility actions
  if (
    lower.includes('swap weapons') ||
    lower === 'bash' ||
    lower.includes('bash') ||
    lower === 'block' ||
    lower.includes('break free')
  ) {
    return 'Mechanic';
  }

  // 4. Anchor check (e.g. Blastbones, Fatecarver)
  if (
    spec.keySkills.anchorSkill.aliases.some(a => lower.includes(a.toLowerCase())) ||
    (spec.keySkills.anchorSkill.guids && spec.keySkills.anchorSkill.guids.includes(guid))
  ) {
    return spec.keySkills.anchorSkill.token;
  }

  // 5. Siphon check
  if (
    spec.keySkills.siphonSkills.aliases.some(a => lower.includes(a.toLowerCase())) ||
    (spec.keySkills.siphonSkills.guids && spec.keySkills.siphonSkills.guids.includes(guid))
  ) {
    return 'Siphon';
  }

  // 6. Spammable check (Venom Skull)
  if (
    spec.keySkills.spammableSkills.aliases.some(a => lower.includes(a.toLowerCase())) ||
    (spec.keySkills.spammableSkills.guids && spec.keySkills.spammableSkills.guids.includes(guid))
  ) {
    return 'Skull';
  }

  // 7. Ultimates check
  if (
    spec.keySkills.ultimateSkills.aliases.some(a => lower.includes(a.toLowerCase())) ||
    (spec.keySkills.ultimateSkills.guids && spec.keySkills.ultimateSkills.guids.includes(guid))
  ) {
    return 'Ult';
  }

  // 8. Mechanic check (e.g. Mirror in Lucent Citadel)
  if (
    spec.keySkills.mechanicSkills?.aliases.some(a => lower.includes(a.toLowerCase())) ||
    (spec.keySkills.mechanicSkills?.guids && spec.keySkills.mechanicSkills.guids.includes(guid))
  ) {
    return 'Mechanic';
  }

  // 9. Dot check
  if (
    spec.keySkills.dotSkills.aliases.some(a => lower.includes(a.toLowerCase())) ||
    (spec.keySkills.dotSkills.guids && spec.keySkills.dotSkills.guids.includes(guid))
  ) {
    return 'Dot';
  }

  return 'Dot';
}

/**
 * Evaluates a 2-skill payload following Blastbones against the spec's valid patterns.
 * Fights are dynamic: ANY of the 4 patterns is 100% optimal!
 */
function evaluateSequence(
  s1: NormalizedGCDCast | undefined,
  s2: NormalizedGCDCast | undefined,
  spec: RotationSpec
): {
  matchedPatternId: string | null;
  matchedPatternName: string;
  isOptimal: boolean;
  score: number;
  diagnostics: string[];
} {
  const diagnostics: string[] = [];

  if (!s1) {
    return {
      matchedPatternId: null,
      matchedPatternName: 'Incomplete Cycle',
      isOptimal: false,
      score: 20,
      diagnostics: ['Missing skills after Blastbones']
    };
  }

  const c1 = s1.classification;
  const c2 = s2 ? s2.classification : 'Unknown';

  // Handle Ultimate substitution: if an Ult is cast in either slot, it's 100% optimal!
  if (c1 === 'Ult' || c2 === 'Ult') {
    const otherSkill = c1 === 'Ult' ? s2?.abilityName || 'Unknown' : s1.abilityName;
    return {
      matchedPatternId: 'ult-weave',
      matchedPatternName: `BB - ${c1 === 'Ult' ? 'Ultimate' : s1.classification} - ${c2 === 'Ult' ? 'Ultimate' : c2}`,
      isOptimal: true,
      score: 100,
      diagnostics: [`Optimal Ultimate weave (${c1 === 'Ult' ? s1.abilityName : s2?.abilityName}) alongside ${otherSkill}`]
    };
  }

  // Handle Encounter Mechanic (e.g. Mirror in Lucent Citadel)
  if (c1 === 'Mechanic' || c2 === 'Mechanic') {
    return {
      matchedPatternId: 'mechanic',
      matchedPatternName: `BB - ${c1} - ${c2}`,
      isOptimal: true,
      score: 95,
      diagnostics: ['Raid mechanic interaction during rotation cycle']
    };
  }

  // Pattern 1: BB - Siphon - Dot
  if (c1 === 'Siphon' && c2 === 'Dot') {
    return {
      matchedPatternId: 'bb-siphon-dot',
      matchedPatternName: 'BB - Siphon - Dot',
      isOptimal: true,
      score: 100,
      diagnostics: [`Optimal primary sequence: Detonated corpse (${s1.abilityName}), refreshed DoT (${s2?.abilityName})`]
    };
  }
  // Inverted: BB - Dot - Siphon
  if (c1 === 'Dot' && c2 === 'Siphon') {
    return {
      matchedPatternId: 'bb-siphon-dot',
      matchedPatternName: 'BB - Dot - Siphon (Inverted)',
      isOptimal: true,
      score: 95,
      diagnostics: [`Primary sequence with DoT first: Refreshed (${s1.abilityName}) then detonated (${s2?.abilityName})`]
    };
  }

  // Pattern 2: BB - Dot - Dot (Dual DoT refresh)
  if (c1 === 'Dot' && c2 === 'Dot') {
    return {
      matchedPatternId: 'bb-dot-dot',
      matchedPatternName: 'BB - Dot - Dot',
      isOptimal: true,
      score: 100,
      diagnostics: [`Optimal dual DoT refresh: Refreshed ${s1.abilityName} and ${s2?.abilityName}`]
    };
  }

  // Pattern 3: BB - Siphon - Siphon (Corpse spammable)
  if (c1 === 'Siphon' && c2 === 'Siphon') {
    return {
      matchedPatternId: 'bb-siphon-siphon',
      matchedPatternName: 'BB - Siphon - Siphon',
      isOptimal: true,
      score: 100,
      diagnostics: [`Optimal corpse spammable: Double ${s1.abilityName} Corpseburster procs`]
    };
  }

  // Pattern 4: BB - Siphon - Skull (Corpse starve / filler)
  if (c1 === 'Siphon' && c2 === 'Skull') {
    return {
      matchedPatternId: 'bb-siphon-skull',
      matchedPatternName: 'BB - Siphon - Skulls',
      isOptimal: true,
      score: 100,
      diagnostics: [`Optimal filler sequence: ${s1.abilityName} followed by ${s2?.abilityName}`]
    };
  }
  // Inverted: BB - Skull - Siphon
  if (c1 === 'Skull' && c2 === 'Siphon') {
    return {
      matchedPatternId: 'bb-siphon-skull',
      matchedPatternName: 'BB - Skulls - Siphon',
      isOptimal: true,
      score: 95,
      diagnostics: [`Filler sequence: ${s1.abilityName} followed by ${s2?.abilityName}`]
    };
  }

  // Suboptimal / Non-standard variations
  if (c1 === 'Dot' && c2 === 'Skull') {
    return {
      matchedPatternId: 'suboptimal-dot-skull',
      matchedPatternName: 'BB - Dot - Skull',
      isOptimal: false,
      score: 70,
      diagnostics: [`Suboptimal sequence: Cast DoT (${s1.abilityName}) and Skull (${s2?.abilityName}) without Siphon`]
    };
  }

  if (c1 === 'Skull' && c2 === 'Dot') {
    return {
      matchedPatternId: 'suboptimal-skull-dot',
      matchedPatternName: 'BB - Skull - Dot',
      isOptimal: false,
      score: 70,
      diagnostics: [`Suboptimal sequence: Cast Skull (${s1.abilityName}) then DoT (${s2?.abilityName}) without Siphon`]
    };
  }

  if (c1 === 'Skull' && c2 === 'Skull') {
    return {
      matchedPatternId: 'suboptimal-skull-skull',
      matchedPatternName: 'BB - Skull - Skull',
      isOptimal: false,
      score: 50,
      diagnostics: [`Inefficient filler: Double Skull (${s1.abilityName}) cast with no Siphon corpses detonated`]
    };
  }

  return {
    matchedPatternId: 'non-standard',
    matchedPatternName: `BB - ${c1} - ${c2}`,
    isOptimal: false,
    score: 40,
    diagnostics: [`Unrecognized rotation sequence: ${s1.abilityName} -> ${s2?.abilityName || 'None'}`]
  };
}

/**
 * Segments GCD casts into Triplet Cycles anchored by Blastbones and computes idle time per cycle
 */
export function segmentTripletCycles(
  gcdCasts: NormalizedGCDCast[],
  spec: RotationSpec
): TripletCycle[] {
  const cycles: TripletCycle[] = [];
  const anchorToken = spec.keySkills.anchorSkill?.token || 'BB';
  const anchorName = spec.keySkills.anchorSkill?.name || 'Anchor';
  const anchorTarget = spec.keySkills.anchorSkill?.cadenceTarget || 3;

  const anchorIndices: number[] = [];
  for (let i = 0; i < gcdCasts.length; i++) {
    if (gcdCasts[i].classification === anchorToken) {
      anchorIndices.push(i);
    }
  }

  for (let cIdx = 0; cIdx < anchorIndices.length; cIdx++) {
    const currentAnchorIdx = anchorIndices[cIdx];
    const nextAnchorIdx =
      cIdx < anchorIndices.length - 1 ? anchorIndices[cIdx + 1] : gcdCasts.length;

    const cadenceCount = nextAnchorIdx - currentAnchorIdx;
    const bbCast = gcdCasts[currentAnchorIdx];
    const interveningCasts = gcdCasts.slice(currentAnchorIdx + 1, nextAnchorIdx);

    const s1 = interveningCasts[0];
    const s2 = interveningCasts[1];

    // Calculate Cadence Score
    let cadenceScore = 100;
    const cadenceDiag: string[] = [];

    if (cadenceCount === anchorTarget) {
      cadenceScore = 100;
      cadenceDiag.push(`Perfect ${anchorTarget}-skill ${anchorName} cadence`);
    } else if (cadenceCount === anchorTarget + 1) {
      cadenceScore = 80;
      cadenceDiag.push(`${anchorName} delayed by 1 cast (${cadenceCount} skills total)`);
    } else if (cadenceCount === anchorTarget + 2) {
      cadenceScore = 60;
      cadenceDiag.push(`${anchorName} delayed by 2 casts (${cadenceCount} skills total)`);
    } else if (cadenceCount > anchorTarget + 2) {
      cadenceScore = Math.max(20, 100 - (cadenceCount - anchorTarget) * 15);
      cadenceDiag.push(`${anchorName} delayed by ${cadenceCount - anchorTarget} casts (${cadenceCount} skills total)`);
    } else if (cadenceCount === anchorTarget - 1) {
      cadenceScore = 60;
      cadenceDiag.push(`Premature ${anchorName} cast`);
    } else if (cadenceCount === 1) {
      cadenceScore = 20;
      cadenceDiag.push(`Wasted ${anchorName}: Cast back-to-back`);
    }

    // Sequence evaluation
    const seqEval = evaluateSequence(s1, s2, spec);

    const allCycleCasts = [bbCast, ...interveningCasts];
    const lastCast = allCycleCasts[allCycleCasts.length - 1];

    // Compute cycle duration & idle time
    const activeLastCastMs = lastCast.channelDurationMs || ESO_SKILL_GCD_MS;
    const cycleDurationSec = Math.max(
      0.1,
      Number(((lastCast.timestamp - bbCast.timestamp + activeLastCastMs) / 1000).toFixed(2))
    );

    let cycleIdleMs = 0;
    let weavedLACount = 0;

    for (const cast of allCycleCasts) {
      if (cast.hasPrecedingLA) weavedLACount++;
      cycleIdleMs += cast.idleTimeMs || 0;
    }

    const cycleIdleSec = Number((cycleIdleMs / 1000).toFixed(2));
    const laWeavePct =
      allCycleCasts.length > 0
        ? Math.round((weavedLACount / allCycleCasts.length) * 100)
        : 0;

    // Combined Cycle Score (50% cadence adherence, 50% sequence pattern quality)
    // Idle penalty: if cycle idle time exceeds 1.5s, apply minor decay
    let idlePenalty = 0;
    if (cycleIdleSec > 2.0) {
      idlePenalty = Math.min(25, Math.round((cycleIdleSec - 2.0) * 5));
    }

    const cycleScore = Math.max(
      0,
      Math.round(cadenceScore * 0.5 + seqEval.score * 0.5 - idlePenalty)
    );
    const zone = getPerformanceZone(cycleScore);

    const cyclePatternString = [
      anchorToken,
      ...interveningCasts.slice(0, 2).map(c => c.classification)
    ].join(' - ');

    if (cycleIdleSec > 1.5) {
      cadenceDiag.push(`Contains ${cycleIdleSec}s inactive / idle time`);
    }

    cycles.push({
      cycleIndex: cIdx + 1,
      startTs: bbCast.timestamp,
      startSec: bbCast.timeSec,
      endTs: lastCast.timestamp,
      endSec: lastCast.timeSec,
      durationSec: cycleDurationSec,
      idleTimeSec: cycleIdleSec,
      casts: allCycleCasts,
      patternString: cyclePatternString,
      matchedPatternId: seqEval.matchedPatternId,
      matchedPatternName: seqEval.matchedPatternName,
      isOptimal: seqEval.isOptimal && cadenceCount === anchorTarget,
      cadenceCount,
      cadenceScore,
      sequenceScore: seqEval.score,
      cycleScore,
      zone,
      laWeaveCount: weavedLACount,
      laWeavePct,
      diagnostics: [...cadenceDiag, ...seqEval.diagnostics]
    });
  }

  return cycles;
}

/**
 * Generates continuous optimality timeline points over the duration of the fight
 */
export function generateOptimalityTimeline(
  fightDurationSec: number,
  cycles: TripletCycle[],
  gcdCasts: NormalizedGCDCast[],
  cruxStats?: CruxStats
): TimelineDataPoint[] {
  if (cycles.length === 0) {
    if (gcdCasts.length === 0) return [];

    const timeline: TimelineDataPoint[] = [];
    const timeStep = 2;
    const fightEndSec = Math.ceil(fightDurationSec);

    for (let t = 0; t <= fightEndSec; t += timeStep) {
      // Check if t falls within a Fatecarver beam channel
      const activeBeam = cruxStats?.beams.find(
        b => t >= b.startSec && t <= b.endSec
      );

      // Check if player is currently in an idle gap at time t
      const currentCast = gcdCasts.find(
        c => t >= c.timeSec && t < c.timeSec + ((c.gapToNextSkillMs || 1000) / 1000)
      );
      const isCurrentlyIdle =
        !activeBeam && currentCast && currentCast.idleTimeMs && currentCast.idleTimeMs > 1000;

      let score = 85;
      let activePattern = 'Active GCD Pacing';
      let notes = '';

      if (activeBeam) {
        if (activeBeam.isOptimal) {
          score = 98;
          activePattern = '3-Crux Fatecarver Beam';
          notes = `Optimal 3-Crux Fatecarver channel (${activeBeam.channelDurationSec}s)`;
        } else if (activeBeam.suboptimalType === 'interrupted') {
          score = 60;
          activePattern = 'Interrupted Fatecarver Beam';
          const lostDmgText =
            activeBeam.estimatedDamageLost > 0
              ? ` (~${Math.round(activeBeam.estimatedDamageLost / 1000)}k dmg lost)`
              : '';
          notes = `Interrupted 3-Crux Fatecarver (${activeBeam.channelDurationSec}s / ${activeBeam.expectedDurationSec}s)${lostDmgText}: ${activeBeam.interruptReason || 'Channel clipped early'}`;
        } else if (activeBeam.suboptimalType === 'under_crux_and_interrupted') {
          score = 35;
          activePattern = `Interrupted ${activeBeam.cruxBefore}-Crux Fatecarver`;
          const lostDmgText =
            activeBeam.estimatedDamageLost > 0
              ? ` (~${Math.round(activeBeam.estimatedDamageLost / 1000)}k dmg lost)`
              : '';
          notes = `Beam cast with only ${activeBeam.cruxBefore} Crux and cut short at ${activeBeam.channelDurationSec}s${lostDmgText}: ${activeBeam.interruptReason || 'Channel clipped early'}`;
        } else {
          score = Math.max(30, Math.round(activeBeam.cruxBefore * 25));
          activePattern = `Suboptimal ${activeBeam.cruxBefore}-Crux Fatecarver`;
          notes = `Beam cast with only ${activeBeam.cruxBefore} Crux (-${(3 - activeBeam.cruxBefore) * 33}% damage)`;
        }
      } else {
        const localCasts = gcdCasts.filter(c => c.timeSec >= t - 2 && c.timeSec <= t + 2);
        if (localCasts.length > 0) {
          let localGapSum = 0;
          let localWeaves = 0;
          for (const c of localCasts) {
            localGapSum += c.gapToNextSkillMs || 1000;
            if (c.hasPrecedingLA) localWeaves++;
          }
          const avgGap = localGapSum / localCasts.length;
          const weaveRatio = localWeaves / localCasts.length;

          if (avgGap <= 1150) {
            score = 90 + Math.round(weaveRatio * 10);
          } else if (avgGap <= 1400) {
            score = 80 + Math.round(weaveRatio * 10);
          } else if (avgGap <= 1800) {
            score = 65 + Math.round(weaveRatio * 10);
          } else if (avgGap <= 2500) {
            score = 45;
          } else {
            score = 25;
          }
          activePattern = isCurrentlyIdle ? 'Idle / Inactive' : 'Active GCD Pacing';
          notes = isCurrentlyIdle
            ? 'Inactivity window (>1s without skill cast)'
            : `Active skill cadence (${localCasts.length} casts nearby)`;
        } else {
          score = 20;
          activePattern = 'Idle / Inactive';
          notes = 'Inactivity window';
        }

        if (isCurrentlyIdle) {
          score = Math.max(15, score - 30);
        }
      }

      const recent = gcdCasts
        .filter(c => c.timeSec >= t - 3 && c.timeSec <= t + 1)
        .map(c => c.abilityName);

      const zone = getPerformanceZone(score);

      timeline.push({
        timestamp: t * 1000,
        timeSec: t,
        formattedTime: formatTimeSec(t),
        score,
        zone,
        recentCasts: recent,
        activePattern,
        cycleIndex: -1,
        idleTimeSec: isCurrentlyIdle
          ? Number(((currentCast?.idleTimeMs || 0) / 1000).toFixed(1))
          : 0,
        notes
      });
    }

    return timeline;
  }

  const timeline: TimelineDataPoint[] = [];
  const timeStep = 2; // 2-second resolution
  const windowRadius = 6;

  const fightEndSec = Math.ceil(fightDurationSec);

  for (let t = 0; t <= fightEndSec; t += timeStep) {
    const activeCycles = cycles.filter(
      c => c.endSec >= t - windowRadius && c.startSec <= t + windowRadius
    );

    let nearestCycle = cycles[0];
    let minCycleDist = Math.abs(cycles[0].startSec - t);
    for (const c of cycles) {
      const dist = Math.min(Math.abs(c.startSec - t), Math.abs(c.endSec - t));
      if (dist < minCycleDist) {
        minCycleDist = dist;
        nearestCycle = c;
      }
    }

    // Check if player is currently in an idle gap at time t
    const currentCast = gcdCasts.find(
      c => t >= c.timeSec && t < c.timeSec + ((c.gapToNextSkillMs || 1000) / 1000)
    );
    const isCurrentlyIdle =
      currentCast && currentCast.idleTimeMs && currentCast.idleTimeMs > 1000;

    let score = 0;
    if (activeCycles.length > 0) {
      const weightedSum = activeCycles.reduce((sum, c) => sum + c.cycleScore, 0);
      score = Math.round(weightedSum / activeCycles.length);
    } else {
      const decay = Math.min(50, Math.floor(minCycleDist * 5));
      score = Math.max(10, nearestCycle.cycleScore - decay);
    }

    // Heavy idle gap drops score
    if (isCurrentlyIdle) {
      score = Math.max(15, score - 25);
    }

    const recent = gcdCasts
      .filter(c => c.timeSec >= t - 3 && c.timeSec <= t + 1)
      .map(c => c.abilityName);

    const zone = getPerformanceZone(score);

    timeline.push({
      timestamp: t * 1000,
      timeSec: t,
      formattedTime: formatTimeSec(t),
      score,
      zone,
      recentCasts: recent,
      activePattern: nearestCycle.matchedPatternName,
      cycleIndex: nearestCycle.cycleIndex,
      idleTimeSec: nearestCycle.idleTimeSec,
      notes: isCurrentlyIdle
        ? 'Inactivity / Idle window (>1s without skill cast)'
        : nearestCycle.diagnostics[0]
    });
  }

  return timeline;
}

/**
 * Dynamically extracts Damage Over Time (DoT) and maintained aura uptimes without hardcoding.
 * Identifies abilities from damage events that deal periodic ticks (>= 2 ticks)
 * and player-cast buff auras with duration.
 */
export function extractDynamicDoTUptimes(
  damageEvents: RawDamageEvent[] | undefined,
  buffTable: Array<{ name: string; guid: number; totalUptime: number; type?: number }> | undefined,
  castEvents: RawCastEvent[],
  fightDurationSec: number
): DoTUptimeStat[] {
  if (!damageEvents && !buffTable && (!castEvents || castEvents.length === 0)) {
    return [];
  }

  // Count player casts per ability name
  const castCounts = new Map<string, number>();
  for (const c of castEvents) {
    if (!c.ability?.name) continue;
    const normName = c.ability.name.trim();
    castCounts.set(normName.toLowerCase(), (castCounts.get(normName.toLowerCase()) || 0) + 1);
  }

  // Group damage events by ability name
  const damageByAbility = new Map<string, { timestamps: number[]; totalDamage: number; icon?: string }>();
  if (damageEvents) {
    for (const e of damageEvents) {
      if (!e.ability?.name) continue;
      const abName = e.ability.name.trim();
      const lower = abName.toLowerCase();

      if (!damageByAbility.has(lower)) {
        damageByAbility.set(lower, {
          timestamps: [],
          totalDamage: 0,
          icon: e.ability.abilityIcon
        });
      }
      const rec = damageByAbility.get(lower)!;
      rec.timestamps.push(e.timestamp);
      rec.totalDamage += (e.amount || 0);
      if (!rec.icon && e.ability.abilityIcon) rec.icon = e.ability.abilityIcon;
    }
  }

  // Excluded patterns for non-DoTs:
  // Light / Heavy attacks, Fatecarver (tracked in CruxBeamChart),
  // Direct spammables (e.g. Flail), basic mechanics, consumables, weapon enchant procs
  const excludedRegex = [
    /fatecarver/i,
    /light attack/i,
    /heavy attack/i,
    /bash/i,
    /food/i,
    /potion/i,
    /weapon/i,
    /break free/i,
    /roll dodge/i,
    /swap weapons/i,
    /flail/i,
    /mirror/i,
    /blood feast/i,
    /purify/i,
    /grave robber/i,
    /harvest/i,
    /healing combustion/i
  ];

  const isExcluded = (name: string) => excludedRegex.some(rx => rx.test(name));

  const dotMap = new Map<string, DoTUptimeStat>();

  // 1. Process damage events with periodic ticks
  for (const [lowerName, item] of Array.from(damageByAbility.entries())) {
    if (isExcluded(lowerName)) continue;
    const ts = item.timestamps.sort((a, b) => a - b);
    if (ts.length < 2) continue;

    // Merge tick windows (assume max tick gap for continuous application is 2.5s)
    let activeMs = 0;
    let wStart = ts[0];
    let wEnd = ts[0];

    for (let i = 1; i < ts.length; i++) {
      if (ts[i] - wEnd <= 2500) {
        wEnd = ts[i];
      } else {
        activeMs += (wEnd - wStart) + 1000;
        wStart = ts[i];
        wEnd = ts[i];
      }
    }
    activeMs += (wEnd - wStart) + 1000;

    // Check if buffTable has an aura matching this ability with a longer contact uptime
    if (buffTable) {
      const matchingAura = buffTable.find(a => a.name.toLowerCase() === lowerName);
      if (matchingAura && matchingAura.totalUptime > activeMs) {
        activeMs = matchingAura.totalUptime;
      }
    }

    const uptimeSec = Number((activeMs / 1000).toFixed(1));
    const uptimePct = Number(Math.min(100, (activeMs / 1000 / fightDurationSec) * 100).toFixed(1));

    const originalEvent = damageEvents?.find(e => e.ability?.name.toLowerCase() === lowerName);
    const displayName = originalEvent?.ability?.name || lowerName;

    dotMap.set(lowerName, {
      name: displayName,
      uptimeSec,
      uptimePct,
      ticks: ts.length,
      casts: castCounts.get(lowerName) || 0,
      totalDamage: item.totalDamage,
      icon: item.icon
    });
  }

  // 2. Process buffTable for maintained player buffs/auras
  if (buffTable) {
    for (const aura of buffTable) {
      if (isExcluded(aura.name)) continue;
      const lowerAura = aura.name.toLowerCase();

      if (dotMap.has(lowerAura)) {
        const existing = dotMap.get(lowerAura)!;
        if (aura.totalUptime > existing.uptimeSec * 1000) {
          existing.uptimeSec = Number((aura.totalUptime / 1000).toFixed(1));
          existing.uptimePct = Number(Math.min(100, (aura.totalUptime / 1000 / fightDurationSec) * 100).toFixed(1));
        }
        continue;
      }

      const castCount = castCounts.get(lowerAura) || 0;
      if (castCount > 0 && aura.totalUptime > 0) {
        const uptimeSec = Number((aura.totalUptime / 1000).toFixed(1));
        const uptimePct = Number(Math.min(100, (aura.totalUptime / 1000 / fightDurationSec) * 100).toFixed(1));
        if (uptimePct > 0) {
          dotMap.set(lowerAura, {
            name: aura.name,
            uptimeSec,
            uptimePct,
            ticks: 0,
            casts: castCount,
            totalDamage: 0
          });
        }
      }
    }
  }

  return Array.from(dotMap.values()).sort((a, b) => b.uptimePct - a.uptimePct);
}

/**
 * Main Analyzer Engine: Evaluates full fight log against the rotation spec
 */
export function analyzeRotation(
  events: RawCastEvent[],
  fightMeta: {
    reportId: string;
    fightId: number;
    fightName: string;
    startTime: number;
    endTime: number;
    actorId: number;
    actorName: string;
    actorDisplayName?: string;
    actorClass: string;
  },
  spec: RotationSpec,
  options?: {
    buffEvents?: RawBuffEvent[];
    damageEvents?: RawDamageEvent[];
    buffTable?: Array<{ name: string; guid: number; totalUptime: number; type?: number }>;
    debuffTable?: Array<{
      name: string;
      guid: number;
      totalUptime: number;
      totalUses: number;
      type?: number;
      bands?: Array<{ startTime: number; endTime: number }>;
    }> | {
      auras?: Array<{
        name: string;
        guid: number;
        totalUptime: number;
        totalUses: number;
        type?: number;
        bands?: Array<{ startTime: number; endTime: number }>;
      }>;
    };
    ultimateSeries?: Array<[number, number]>;
  }
): RotationAnalysisResult {
  const durationSec = Math.max(1, (fightMeta.endTime - fightMeta.startTime) / 1000);

  // 1. If Arcanist or if buffEvents/damageEvents provided, extract Crux & Fatecarver beams
  let cruxStats: CruxStats | undefined = undefined;
  let castsToAnalyze = [...events];

  if (
    options?.buffEvents ||
    options?.damageEvents ||
    spec.class === 'Arcanist' ||
    fightMeta.actorClass === 'Arcanist'
  ) {
    const cruxResult = extractCruxAndBeams(
      options?.buffEvents,
      options?.damageEvents,
      fightMeta.startTime,
      fightMeta.endTime,
      fightMeta.actorId,
      events
    );
    cruxStats = cruxResult.cruxStats;

    if (cruxResult.synthesizedBeams.length > 0) {
      // Filter out existing Fatecarver in casts if any to prevent duplicate entries
      const nonBeams = events.filter(
        e => !(e.ability && e.ability.name.toLowerCase().includes('fatecarver'))
      );

      // In ESO, skills queued during an active beam channel (e.g. Flail queued in buffer)
      // do not execute until the channel completes.
      // Adjust timestamps of queued skills that occurred during a beam channel
      const adjustedNonBeams = nonBeams.map(c => {
        if (!c.ability || !c.ability.name) return c;
        if (isChannelCanceller(c.ability.name)) return c; // Cancels like Bash/Dodge executed at their timestamp

        // Check if c falls strictly inside an active beam channel
        const activeBeam = cruxResult.cruxStats.beams.find(
          b => c.timestamp > b.startTs + 300 && c.timestamp < b.endTs
        );
        if (activeBeam) {
          // Clamped to beam endTs when the queue buffer released
          return {
            ...c,
            timestamp: activeBeam.endTs
          };
        }
        return c;
      });

      castsToAnalyze = [...adjustedNonBeams, ...cruxResult.synthesizedBeams].sort(
        (a, b) => a.timestamp - b.timestamp
      );
    }
  }

  // 2. Normalize and categorize GCD skills + analyze animation cancels & idle time
  const { normalized: gcdCasts, totalLightAttacks, totalBarSwaps } = normalizeCasts(
    castsToAnalyze,
    fightMeta.startTime,
    spec,
    options?.damageEvents
  );

  // 3. Segment into triplet cycles anchored by spec anchor skill (e.g. Fatecarver or Blastbones)
  const cycles = segmentTripletCycles(gcdCasts, spec);

  // 4. Compute Idle Time Statistics & Light Attack Hit Validation
  let totalIdleMs = 0;
  let totalGapsMs = 0;
  let weavedLAsCount = 0;
  let totalWeaveDelayMs = 0;
  let weavedDelaysCount = 0;
  let standaloneLAsCount = 0;
  let barSwapCancelsCount = 0;
  const idleGaps: Array<{
    fromSkill: string;
    toSkill: string;
    startSec: number;
    endSec: number;
    idleSec: number;
    reason?: string;
  }> = [];

  for (let i = 0; i < gcdCasts.length; i++) {
    const cast = gcdCasts[i];
    if (cast.hasPrecedingLA) {
      // Per ESO combat mechanics: empty LA casts with no damage event do not count as connected weaves
      const isValidWeave =
        options?.damageEvents && options.damageEvents.length > 0
          ? cast.laHit === true
          : true;

      if (isValidWeave) {
        weavedLAsCount++;
        if (cast.weaveDelayMs !== undefined) {
          totalWeaveDelayMs += cast.weaveDelayMs;
          weavedDelaysCount++;
        }
      }
    }
    if (cast.isStandaloneLA) {
      standaloneLAsCount++;
    }
    if (cast.followedByBarSwap) {
      barSwapCancelsCount++;
    }

    if (i < gcdCasts.length - 1) {
      const gapMs = cast.gapToNextSkillMs || ESO_SKILL_GCD_MS;
      const idleMs = cast.idleTimeMs || 0;
      totalGapsMs += gapMs;
      totalIdleMs += idleMs;

      if (idleMs >= 1500) {
        const nextCast = gcdCasts[i + 1];
        let reason = 'Inactivity / Movement';
        if (cast.abilityName === 'Mirror' || nextCast.abilityName === 'Mirror') {
          reason = 'Lucent Citadel Mirror Mechanic';
        }
        idleGaps.push({
          fromSkill: cast.abilityName,
          toSkill: nextCast.abilityName,
          startSec: Number(cast.timeSec.toFixed(1)),
          endSec: Number(nextCast.timeSec.toFixed(1)),
          idleSec: Number((idleMs / 1000).toFixed(2)),
          reason
        });
      }
    }
  }

  // Cross-class Light Attack damage hit stats
  let connectedLAsCount: number | undefined = undefined;
  let emptyLAsCount: number | undefined = undefined;
  let laHitRatePct: number | undefined = undefined;

  if (options?.damageEvents && options.damageEvents.length > 0) {
    let connected = 0;
    let empty = 0;
    for (const cast of gcdCasts) {
      if (cast.hasPrecedingLA || cast.isStandaloneLA) {
        if (cast.laHit === true) {
          connected++;
        } else if (cast.laHit === false) {
          empty++;
        }
      }
    }
    connectedLAsCount = connected;
    emptyLAsCount = empty;
    const totalChecked = connected + empty;
    laHitRatePct = totalChecked > 0 ? Number(((connected / totalChecked) * 100).toFixed(1)) : 0;
  }

  const totalIdleSec = Number((totalIdleMs / 1000).toFixed(2));
  const totalActiveSec = Number(Math.max(0, durationSec - totalIdleSec).toFixed(2));
  const activeUptimePct = Number(((totalActiveSec / durationSec) * 100).toFixed(1));
  const idlePct = Number(((totalIdleSec / durationSec) * 100).toFixed(1));
  const averageGapMs =
    gcdCasts.length > 1 ? Math.round(totalGapsMs / (gcdCasts.length - 1)) : 1000;
  const laWeaveEfficiencyPct =
    gcdCasts.length > 0 ? Number(((weavedLAsCount / gcdCasts.length) * 100).toFixed(1)) : 0;
  const avgWeaveDelayMs =
    weavedDelaysCount > 0 ? Math.round(totalWeaveDelayMs / weavedDelaysCount) : undefined;
  const missedLAsCount = Math.max(0, gcdCasts.length - weavedLAsCount - standaloneLAsCount);

  // Sort top idle gaps descending
  idleGaps.sort((a, b) => b.idleSec - a.idleSec);

  const idleStats: IdleStats = {
    totalIdleSec,
    totalActiveSec,
    idlePct,
    activeUptimePct,
    averageGapMs,
    totalLightAttacks,
    weavedLAsCount,
    standaloneLAsCount,
    missedLAsCount,
    laWeaveEfficiencyPct,
    avgWeaveDelayMs,
    totalBarSwaps,
    barSwapCancelsCount,
    connectedLAsCount,
    emptyLAsCount,
    laHitRatePct,
    topIdleGaps: idleGaps.slice(0, 6)
  };

  // 4b. Extract Sorcerer DPS specific stats if applicable
  let sorcStats: SorcStats | undefined = undefined;
  if (
    spec.class.toLowerCase() === 'sorcerer' ||
    fightMeta.actorClass.toLowerCase() === 'sorcerer'
  ) {
    sorcStats = extractSorcStats(
      events,
      fightMeta.startTime,
      fightMeta.endTime,
      fightMeta.actorId,
      options
    );
  }

  // 4c. Extract Dragonknight specific stats if applicable
  let dkStats: DKStats | undefined = undefined;
  if (
    spec.class.toLowerCase() === 'dragonknight' ||
    spec.class.toLowerCase() === 'dk' ||
    fightMeta.actorClass.toLowerCase() === 'dragonknight' ||
    fightMeta.actorClass.toLowerCase() === 'dk'
  ) {
    dkStats = extractDKStats(
      events,
      fightMeta.startTime,
      fightMeta.endTime,
      fightMeta.actorId,
      spec,
      options
    );
  }

  // 5. Generate smooth timeline
  const timeline = generateOptimalityTimeline(durationSec, cycles, gcdCasts, cruxStats);

  // 6. Compute Zone Distribution (% of time in each zone)
  const zoneCounts: Record<PerformanceZone, number> = {
    green: 0,
    yellow: 0,
    orange: 0,
    red: 0,
    darkRed: 0
  };

  for (const pt of timeline) {
    zoneCounts[pt.zone]++;
  }

  const totalPoints = Math.max(1, timeline.length);
  const zoneDistribution: ZoneDistribution = {
    greenPct: Math.round((zoneCounts.green / totalPoints) * 100),
    yellowPct: Math.round((zoneCounts.yellow / totalPoints) * 100),
    orangePct: Math.round((zoneCounts.orange / totalPoints) * 100),
    redPct: Math.round((zoneCounts.red / totalPoints) * 100),
    darkRedPct: Math.round((zoneCounts.darkRed / totalPoints) * 100)
  };

  // 7. Compute Cadence Statistics
  let totalInterval = 0;
  let perfectTripletsCount = 0;
  let delayedCadenceCount = 0;
  let prematureCadenceCount = 0;
  const targetCadence = spec.keySkills.anchorSkill?.cadenceTarget || 3;

  for (const c of cycles) {
    totalInterval += c.cadenceCount;
    if (c.cadenceCount === targetCadence) perfectTripletsCount++;
    else if (c.cadenceCount > targetCadence) delayedCadenceCount++;
    else if (c.cadenceCount < targetCadence) prematureCadenceCount++;
  }

  const averageInterval =
    cycles.length > 0 ? Number((totalInterval / cycles.length).toFixed(2)) : targetCadence;

  const cadenceStats: CadenceStats = {
    averageInterval,
    targetInterval: targetCadence,
    perfectTripletsCount,
    perfectTripletsPct:
      cycles.length > 0 ? Math.round((perfectTripletsCount / cycles.length) * 100) : 0,
    delayedCadenceCount,
    prematureCadenceCount
  };

  // 8. Compute Pattern Usage Breakdown
  const patternCounts = new Map<string, number>();
  for (const p of spec.patterns) {
    patternCounts.set(p.id, 0);
  }
  let nonStandardCount = 0;

  for (const c of cycles) {
    if (c.matchedPatternId && patternCounts.has(c.matchedPatternId)) {
      patternCounts.set(
        c.matchedPatternId,
        (patternCounts.get(c.matchedPatternId) || 0) + 1
      );
    } else {
      nonStandardCount++;
    }
  }

  const totalCycles = Math.max(1, cycles.length);
  const patternStats: PatternDistributionStat[] = spec.patterns.map(p => {
    const observedCount = patternCounts.get(p.id) || 0;
    const observedPct = Math.round((observedCount / totalCycles) * 100);
    return {
      id: p.id,
      name: p.name,
      observedCount,
      observedPct,
      description: p.description,
      isValidPattern: true
    };
  });

  // 9. Overall Fight Score
  let overallScore = 0;
  if (timeline.length > 0) {
    const sum = timeline.reduce((acc, pt) => acc + pt.score, 0);
    overallScore = Math.round(sum / timeline.length);
  }
  const overallZone = getPerformanceZone(overallScore);

  // 10. Actionable Feedback
  const topFeedback: string[] = [];

  if (cruxStats && cruxStats.totalBeams > 0) {
    topFeedback.push(
      `${cruxStats.optimalPct}% optimal Fatecarver beams (${cruxStats.optimalBeams} / ${cruxStats.totalBeams} cast with 3 Crux and fully completed).`
    );
    if (cruxStats.interruptedBeams > 0) {
      const lostDmgStr =
        cruxStats.avgDamageLostPerInterruptedBeam > 0
          ? ` (avg ~${Math.round(cruxStats.avgDamageLostPerInterruptedBeam / 1000)}k damage lost per cut channel)`
          : '';
      topFeedback.push(
        `${cruxStats.interruptedBeams} beam(s) interrupted early${lostDmgStr}: ${cruxStats.interruptedList
          .slice(0, 3)
          .map(u => `Beam #${u.beamIndex} (${u.reason})`)
          .join(', ')}${cruxStats.interruptedList.length > 3 ? '...' : ''}.`
      );
    }
    if (cruxStats.underCruxBeams > 0) {
      topFeedback.push(
        `${cruxStats.underCruxBeams} beam(s) activated with < 3 Crux: ${cruxStats.underCruxList
          .map(u => `Beam #${u.beamIndex} at ${u.timeSec}s (${u.cruxCount} Crux)`)
          .join(', ')}.`
      );
    }
    topFeedback.push(
      `Fatecarver channel uptime: ${cruxStats.beamUptimePct}% (${cruxStats.totalBeamChannelSec}s of ${Math.round(durationSec)}s fight spent channeling).`
    );
  } else if (cadenceStats.perfectTripletsPct >= 70) {
    topFeedback.push(`Solid cadence: ${cadenceStats.perfectTripletsPct}% of cycles maintained the anchor rhythm.`);
  } else if (cadenceStats.delayedCadenceCount > 4) {
    topFeedback.push(`Anchor skill was delayed in ${cadenceStats.delayedCadenceCount} cycles.`);
  }

  // Sorcerer DPS Specific Feedback
  if (sorcStats) {
    if (sorcStats.totalFragsCasts > 0) {
      topFeedback.push(
        `${sorcStats.fragProcEfficiencyPct}% Crystal Fragments instant procs (${sorcStats.procFragsCasts} / ${sorcStats.totalFragsCasts} procced).`
      );
      if (sorcStats.hardcastFragsCasts > 0) {
        topFeedback.push(
          `⚠️ ${sorcStats.hardcastFragsCasts} suboptimal hardcast(s) of Crystal Fragments without an instant proc.`
        );
      }
    }
    if (sorcStats.totalFragProcsGained > 0) {
      topFeedback.push(
        `${sorcStats.fragProcImmediateCastPct}% of Crystal Frag procs cast immediately (${sorcStats.immediateFragProcsCount} / ${sorcStats.totalFragProcsGained} immediate; ${sorcStats.interveningSkillsDuringProcCount} skills cast while procs were delayed).`
      );
      if (sorcStats.expiredFragProcsCount > 0) {
        topFeedback.push(
          `⚠️ ${sorcStats.expiredFragProcsCount} Crystal Fragments proc(s) expired completely without being cast (wasted procs).`
        );
      }
    }
    if (sorcStats.totalArmamentsCasts > 0) {
      topFeedback.push(
        `${sorcStats.optimalArmamentsCasts} / ${sorcStats.totalArmamentsCasts} Bound Armaments cast at 4+ stacks (avg: ${sorcStats.avgStacksAtCast.toFixed(1)} stacks).`
      );
      if (sorcStats.suboptimalArmamentsCasts > 0) {
        topFeedback.push(
          `⚠️ ${sorcStats.suboptimalArmamentsCasts} cast(s) of Bound Armaments at < 4 stacks.`
        );
      }
    }
    if (sorcStats.totalCurseCasts > 1) {
      if (sorcStats.recastBeforeSecondExplosionCount > 0) {
        topFeedback.push(
          `⚠️ ${sorcStats.recastBeforeSecondExplosionCount} Haunting Curse recast(s) clipped before the 2nd explosion at 8.5s!`
        );
      }
    }
    if (sorcStats.hasShatteredPathsSignet) {
      if (sorcStats.ultimateBelow133Count && sorcStats.ultimateBelow133Count > 0) {
        topFeedback.push(
          `⚠️ Shattered Paths Signet: Ultimate dropped below 133 threshold (${sorcStats.minUltimateValue} min) in ${sorcStats.ultimateBelow133Count} logs, reducing status effect bonus!`
        );
      } else {
        topFeedback.push(
          `✅ Shattered Paths Signet: Ultimate maintained at ≥ 133 throughout combat.`
        );
      }
    }
    if (sorcStats.powerOverloadOpenedActive !== undefined) {
      if (sorcStats.powerOverloadOpenedActive) {
        topFeedback.push(`✅ Opened fight with Power Overload active.`);
      } else {
        topFeedback.push(`⚠️ Did not open fight with Power Overload active.`);
      }
    }
  }

  // Dragonknight Specific Feedback
  if (dkStats) {
    if (dkStats.magmaFist) {
      const mf = dkStats.magmaFist;
      topFeedback.push(
        `Heat Shock (Magma Fist): ${mf.heatShockThreeStackUptimePct}% 3-stack uptime on main boss (${mf.optimalRefreshes} on-time refreshes, ${mf.earlyRefreshes} early, ${mf.droppedRefreshes} dropped).`
      );
      if (mf.droppedRefreshes > 0) {
        topFeedback.push(
          `⚠️ Heat Shock dropped ${mf.droppedRefreshes} time(s) on main boss, resetting stacks from 3 to 1.`
        );
      }
    }

    if (dkStats.whipMiniGame && dkStats.whipMiniGame.morph === 'flame_lash') {
      const w = dkStats.whipMiniGame;
      const delayStr = w.reactionDelayMs !== undefined ? ` (avg ${w.reactionDelayMs}ms reaction delay)` : '';
      topFeedback.push(
        `Flame Lash (Off-Balance): ${w.castsInOffBalance} cast(s) in ${w.offBalanceWindowsCount ?? 0} Off-Balance window(s)${delayStr}.`
      );
      if (w.expiredDotsDuringLash && w.expiredDotsDuringLash.length > 0) {
        const dropNames = Array.from(new Set(w.expiredDotsDuringLash.map(d => d.name))).join(', ');
        topFeedback.push(
          `⚠️ ${w.expiredDotsDuringLash.length} DoT expiration(s) occurred while casting Power Lash: ${dropNames}.`
        );
      }
      if (w.priorityViolationsCount && w.priorityViolationsCount > 0) {
        topFeedback.push(
          `⚠️ ${w.priorityViolationsCount} priority violation(s): cast Flame Lash while Magma Fist (3 stacks) or Status Knife was expiring.`
        );
      }
    } else if (dkStats.whipMiniGame && dkStats.whipMiniGame.morph === 'molten_whip') {
      const w = dkStats.whipMiniGame;
      topFeedback.push(
        `Molten Whip: ${w.seethingFuryThreeStackPct}% cast at 3 stacks of Seething Fury (${w.castsAtThreeStacks} / ${w.totalCasts} at 3 stacks for +99% damage).`
      );
      if (w.castsUnderThreeStacks && w.castsUnderThreeStacks > 0) {
        topFeedback.push(
          `⚠️ ${w.castsUnderThreeStacks} Molten Whip cast(s) fired with < 3 stacks of Seething Fury.`
        );
      }
    }

    if (dkStats.igneousWeapons) {
      const iw = dkStats.igneousWeapons;
      topFeedback.push(
        `Igneous Weapons: ${iw.uptimePct}% group buff uptime (${iw.totalCasts} cast(s), ${iw.prematureRecasts} early recasts).`
      );
    }

    if (dkStats.tankDebuffs) {
      const td = dkStats.tankDebuffs;
      topFeedback.push(
        `Main Boss Debuffs: Taunt ${td.tauntUptimePct}%, Major Breach ${td.majorBreachUptimePct}%, Crusher ${td.crusherUptimePct}%, Maim ${td.maimUptimePct}%.`
      );
    }
  }

  topFeedback.push(`Active Cast Uptime: ${activeUptimePct}% (${totalActiveSec}s active, ${totalIdleSec}s idle time out of ${Math.round(durationSec)}s fight).`);

  if (laWeaveEfficiencyPct >= 75) {
    topFeedback.push(`Excellent light attack weaving: ${laWeaveEfficiencyPct}% of skills weaved with a light attack.`);
  } else {
    topFeedback.push(`Light attack weave ratio: ${laWeaveEfficiencyPct}% (${weavedLAsCount} / ${gcdCasts.length} skills).`);
  }

  if (idleStats.laHitRatePct !== undefined) {
    topFeedback.push(
      `🎯 Light Attack Hit Rate: ${idleStats.laHitRatePct}% (${idleStats.connectedLAsCount} connected / ${idleStats.totalLightAttacks} casts; ${idleStats.emptyLAsCount} empty/missed).`
    );
  }

  if (avgWeaveDelayMs !== undefined) {
    if (avgWeaveDelayMs < 100) {
      topFeedback.push(
        `⚡ Elite Light Attack weaving delay: ${avgWeaveDelayMs}ms average (< 100ms parse standard).`
      );
    } else if (avgWeaveDelayMs <= 200) {
      topFeedback.push(
        `⏱️ Solid Light Attack weaving delay: ${avgWeaveDelayMs}ms average (100 - 200ms target range).`
      );
    } else {
      topFeedback.push(
        `⚠️ Delayed Light Attack weaving: ${avgWeaveDelayMs}ms average delay. Aim for < 100ms by queuing skills immediately after light attacking.`
      );
    }
  }

  if (standaloneLAsCount > 0) {
    topFeedback.push(
      `${standaloneLAsCount} standalone Light Attack(s) cast without an immediate skill cancel within 0.7s (missed skill follow-up).`
    );
  }

  if (barSwapCancelsCount > 0) {
    topFeedback.push(
      `${barSwapCancelsCount} animation-cancelling bar swap(s) executed smoothly after skill casts.`
    );
  }

  const isRecognized = spec.isRecognized !== false;
  const unrecognizedWarning = !isRecognized
    ? `No custom rotation pattern model is available for ${spec.class} yet. Tracking global cooldown pacing, light attack weaving, animation cancels, and inactive windows.`
    : undefined;

  // Extract dynamic DoT uptimes
  const dotUptimes = extractDynamicDoTUptimes(
    options?.damageEvents,
    options?.buffTable,
    events,
    durationSec
  );

  return {
    spec: {
      id: spec.id,
      name: spec.name,
      class: spec.class,
      isRecognized
    },
    unrecognizedWarning,
    fightMeta: {
      reportId: fightMeta.reportId,
      fightId: fightMeta.fightId,
      fightName: fightMeta.fightName,
      durationSec: Math.round(durationSec),
      actorId: fightMeta.actorId,
      actorName: fightMeta.actorName,
      actorDisplayName: fightMeta.actorDisplayName,
      actorClass: fightMeta.actorClass
    },
    overallScore,
    overallZone,
    zoneDistribution,
    cadenceStats,
    idleStats,
    patternStats,
    cruxStats,
    sorcStats,
    dkStats,
    dotUptimes,
    nonStandardCyclesCount: nonStandardCount,
    totalCycles: cycles.length,
    totalGCDCasts: gcdCasts.length,
    timeline,
    cycles,
    topFeedback
  };
}
