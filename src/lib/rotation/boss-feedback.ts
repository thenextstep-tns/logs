import { RotationAnalysisResult } from '@/types/rotation';
import {
  getSorcererCoachingFeedback,
  getArcanistCoachingFeedback,
  getNecromancerCoachingFeedback,
  getDragonknightCoachingFeedback,
  getUniversalCoachingFeedback,
  KEY_SKILL_EXPLANATIONS,
  CoachingFeedback
} from './feedback-phrases';

export interface BossFightContext {
  id: number;
  name: string;
  kill?: boolean;
  durationSec: number;
}

export interface BossFeedbackOptions {
  includeSummary?: boolean;
  includeSBI?: boolean; // backwards-compatible alias
  includeExplanations?: boolean; // backwards-compatible alias
  includeKeySkills?: boolean;
}

/**
 * Formats boss fight results into structured, Discord-ready markdown:
 * 1. Scope header (*Scope: Only looking at kill pulls (N bosses)*)
 * 2. Overall Summary (Human-sounding performance coaching: Strengths & Key Leaks)
 * 3. Key Skill Mechanics (Clean 1-2 sentence rules without Situation/Behavior/Impact labels)
 * 4. Boss Breakdown (Clean pull-by-pull stats without repeating headers or redundant explanations)
 */
export function generateFullDiscordReport(
  items: Array<{ fight: BossFightContext; result: RotationAnalysisResult }>,
  options: BossFeedbackOptions = { includeSummary: true, includeKeySkills: true }
): string {
  if (!items || items.length === 0) {
    return 'No boss encounters found for this player in the report.';
  }

  const showSummary =
    options.includeSummary !== undefined
      ? options.includeSummary
      : true;

  const showKeySkills =
    options.includeKeySkills !== undefined
      ? options.includeKeySkills
      : options.includeExplanations !== undefined
      ? options.includeExplanations
      : true;

  const firstResult = items[0].result;
  const actorName = firstResult.fightMeta.actorName;
  const specName = firstResult.spec.name;
  const specClass = firstResult.spec.class.toLowerCase();

  const allKills = items.every(i => i.fight.kill);
  const scopeText = allKills
    ? `*Scope: Only looking at kill pulls (${items.length} boss${items.length === 1 ? '' : 'es'})*`
    : `*Scope: Across all pulls (${items.length} boss fight${items.length === 1 ? '' : 's'})*`;

  let report = `# Rotation Performance Summary — ${actorName} (${specName})\n${scopeText}\n\n`;

  // 1. OVERALL SUMMARY
  if (showSummary) {
    report += generateOverallSummary(items, specClass);
    report += '\n\n';
  }

  // 2. KEY SKILL MECHANICS (Explained ONCE without robotic SBI headers)
  if (showKeySkills) {
    report += generateKeySkillMechanics(specClass, firstResult.spec.id);
    report += '\n\n';
  }

  // 3. BOSS BREAKDOWN
  report += '### Boss Breakdown\n\n';
  report += generateBossBreakdown(items, specClass, allKills);

  return report;
}

/**
 * High-level executive summary synthesizing strengths and primary leak areas using canned human phrases.
 */
function generateOverallSummary(
  items: Array<{ fight: BossFightContext; result: RotationAnalysisResult }>,
  specClass: string
): string {
  let summary = '### Overall Summary\n';

  // Aggregate universal stats
  const connectedLAs = items.reduce((acc, i) => acc + (i.result.idleStats.connectedLAsCount ?? 0), 0);
  const emptyLAs = items.reduce((acc, i) => acc + (i.result.idleStats.emptyLAsCount ?? 0), 0);
  const totalActiveSec = items.reduce((acc, i) => acc + i.result.idleStats.totalActiveSec, 0);
  const totalIdleSec = items.reduce((acc, i) => acc + i.result.idleStats.totalIdleSec, 0);
  const totalCombatSec = totalActiveSec + totalIdleSec;
  const activeUptimePct = totalCombatSec > 0 ? (totalActiveSec / totalCombatSec) * 100 : 100;

  let coaching: CoachingFeedback;

  if (specClass === 'sorcerer') {
    const totalFragProcs = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.totalFragProcsGained || 0),
      0
    );
    const immFrags = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.immediateFragProcsCount || 0),
      0
    );
    const delayedFrags = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.delayedFragProcsCount || 0),
      0
    );
    const delayedGCDs = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.interveningSkillsDuringProcCount || 0),
      0
    );
    const expiredFrags = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.expiredFragProcsCount || 0),
      0
    );
    const hardcasts = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.hardcastFragsCasts || 0),
      0
    );

    const totalArmCasts = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.totalArmamentsCasts || 0),
      0
    );
    const optimalArmCasts = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.optimalArmamentsCasts || 0),
      0
    );
    const totalStacks = items.reduce(
      (acc, i) =>
        acc +
        (i.result.sorcStats?.avgStacksAtCast || 0) * (i.result.sorcStats?.totalArmamentsCasts || 0),
      0
    );
    const avgArmStacks = totalArmCasts > 0 ? totalStacks / totalArmCasts : 0;

    const hasShatteredPaths = items.some(i => i.result.sorcStats?.hasShatteredPathsSignet);
    const shatteredDropFightsCount = items.filter(
      i => (i.result.sorcStats?.ultimateBelow133Count || 0) > 0
    ).length;

    const totalKnifeCasts = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.totalKnifeCasts || 0),
      0
    );
    const optimalKnife = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.optimalKnifeRefreshes || 0),
      0
    );
    const droppedKnife = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.droppedKnifeCount || 0),
      0
    );
    const earlyKnife = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.prematureKnifeCount || 0),
      0
    );
    const totalKnifeIntervalWeighted = items.reduce(
      (acc, i) =>
        acc +
        (i.result.sorcStats?.avgKnifeIntervalSec || 0) *
          (i.result.sorcStats?.totalKnifeCasts || 0),
      0
    );
    const avgKnifeInterval =
      totalKnifeCasts > 0 ? totalKnifeIntervalWeighted / totalKnifeCasts : 0;

    const totalCurseCasts = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.totalCurseCasts || 0),
      0
    );
    const clippedCurse = items.reduce(
      (acc, i) => acc + (i.result.sorcStats?.recastBeforeSecondExplosionCount || 0),
      0
    );
    const totalCurseIntervalWeighted = items.reduce(
      (acc, i) =>
        acc +
        (i.result.sorcStats?.avgCurseIntervalSec || 0) *
          (i.result.sorcStats?.totalCurseCasts || 0),
      0
    );
    const avgCurseInterval =
      totalCurseCasts > 0 ? totalCurseIntervalWeighted / totalCurseCasts : 0;

    coaching = getSorcererCoachingFeedback({
      bossCount: items.length,
      totalFragProcs,
      immFrags,
      delayedFrags,
      delayedGCDs,
      expiredFrags,
      hardcasts,
      totalArmCasts,
      optimalArmCasts,
      avgArmStacks,
      hasShatteredPaths,
      shatteredDropFightsCount,
      totalKnifeCasts,
      optimalKnife,
      droppedKnife,
      earlyKnife,
      avgKnifeInterval,
      totalCurseCasts,
      clippedCurse,
      avgCurseInterval,
      connectedLAs,
      emptyLAs,
      activeUptimePct,
      totalIdleSec
    });
  } else if (specClass === 'arcanist') {
    const totalBeams = items.reduce((acc, i) => acc + (i.result.cruxStats?.totalBeams || 0), 0);
    const optimalBeams = items.reduce(
      (acc, i) => acc + (i.result.cruxStats?.optimalBeams || 0),
      0
    );
    const interruptedBeams = items.reduce(
      (acc, i) => acc + (i.result.cruxStats?.interruptedBeams || 0),
      0
    );
    const threeCruxBeams = items.reduce(
      (acc, i) => acc + (i.result.cruxStats?.threeCruxBeams || 0),
      0
    );
    const underCruxBeams = items.reduce(
      (acc, i) => acc + (i.result.cruxStats?.underCruxBeams || 0),
      0
    );
    const beamChannelSec = items.reduce(
      (acc, i) => acc + (i.result.cruxStats?.totalBeamChannelSec || 0),
      0
    );
    const totalFightSec = items.reduce((acc, i) => acc + i.fight.durationSec, 0);

    coaching = getArcanistCoachingFeedback({
      bossCount: items.length,
      totalBeams,
      optimalBeams,
      interruptedBeams,
      threeCruxBeams,
      underCruxBeams,
      beamChannelSec,
      totalFightSec,
      connectedLAs,
      emptyLAs,
      activeUptimePct,
      totalIdleSec
    });
  } else if (specClass === 'necromancer') {
    const totalGCDCasts = items.reduce((acc, i) => acc + i.result.totalGCDCasts, 0);
    const perfectTripletsCount = items.reduce(
      (acc, i) => acc + (i.result.cadenceStats?.perfectTripletsCount || 0),
      0
    );
    const delayedCadenceCount = items.reduce(
      (acc, i) => acc + (i.result.cadenceStats?.delayedCadenceCount || 0),
      0
    );
    const totalCycles = items.reduce((acc, i) => acc + i.result.totalCycles, 0);
    const perfectTripletsPct =
      totalCycles > 0 ? Math.round((perfectTripletsCount / totalCycles) * 100) : 100;

    coaching = getNecromancerCoachingFeedback({
      bossCount: items.length,
      totalGCDCasts,
      perfectTripletsPct,
      delayedCadenceCount,
      connectedLAs,
      emptyLAs,
      activeUptimePct,
      totalIdleSec
    });
  } else if (specClass === 'dragonknight' || specClass === 'dk') {
    const isTank = items.some(i => i.result.dkStats?.specVariant === 'tank');
    const hasMagmaFist = items.some(i => i.result.dkStats?.magmaFist?.hasMagmaFist);
    const totalMFCasts = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.magmaFist?.totalCasts || 0),
      0
    );
    const optimalMF = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.magmaFist?.optimalRefreshes || 0),
      0
    );
    const earlyMF = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.magmaFist?.earlyRefreshes || 0),
      0
    );
    const droppedMF = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.magmaFist?.droppedRefreshes || 0),
      0
    );
    const totalMFIntervalWeighted = items.reduce(
      (acc, i) =>
        acc +
        (i.result.dkStats?.magmaFist?.avgIntervalSec || 0) *
          (i.result.dkStats?.magmaFist?.totalCasts || 0),
      0
    );
    const avgMFInterval = totalMFCasts > 0 ? totalMFIntervalWeighted / totalMFCasts : 0;
    const avgThreeStackUptime =
      items.reduce(
        (acc, i) => acc + (i.result.dkStats?.magmaFist?.heatShockThreeStackUptimePct || 0),
        0
      ) / Math.max(1, items.length);

    const firstWhip = items.find(i => i.result.dkStats?.whipMiniGame?.morph !== 'none')?.result.dkStats?.whipMiniGame;
    const whipMorph = firstWhip?.morph || 'none';

    let reactionDelayMs: number | undefined = undefined;
    let castsInOffBalance = 0;
    let offBalanceWindowsCount = 0;
    let priorityViolationsCount = 0;
    let expiredDotsCount = 0;
    const expiredDotsNames: string[] = [];

    let totalWhipCasts = 0;
    let castsAtThreeStacks = 0;
    let castsUnderThreeStacks = 0;

    for (const item of items) {
      const w = item.result.dkStats?.whipMiniGame;
      if (w) {
        if (w.reactionDelayMs !== undefined) {
          reactionDelayMs = Math.round(((reactionDelayMs || w.reactionDelayMs) + w.reactionDelayMs) / 2);
        }
        castsInOffBalance += w.castsInOffBalance || 0;
        offBalanceWindowsCount += w.offBalanceWindowsCount || 0;
        priorityViolationsCount += w.priorityViolationsCount || 0;
        if (w.expiredDotsDuringLash) {
          expiredDotsCount += w.expiredDotsDuringLash.length;
          for (const d of w.expiredDotsDuringLash) {
            if (!expiredDotsNames.includes(d.name)) expiredDotsNames.push(d.name);
          }
        }
        totalWhipCasts += w.totalCasts || 0;
        castsAtThreeStacks += w.castsAtThreeStacks || 0;
        castsUnderThreeStacks += w.castsUnderThreeStacks || 0;
      }
    }

    const seethingFuryThreeStackPct =
      totalWhipCasts > 0 ? Math.round((castsAtThreeStacks / totalWhipCasts) * 100) : 100;

    const hasIgneousWeapons = items.some(i => i.result.dkStats?.igneousWeapons?.hasIgneousWeapons);
    const avgIgneousUptime =
      items.reduce(
        (acc, i) => acc + (i.result.dkStats?.igneousWeapons?.uptimePct || 0),
        0
      ) / Math.max(1, items.length);
    const earlyIgneousRecasts = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.igneousWeapons?.prematureRecasts || 0),
      0
    );
    const droppedIgneousWindows = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.igneousWeapons?.droppedWindows || 0),
      0
    );

    const penalizedStandardSec = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.standard?.penalizedHoldSec || 0),
      0
    );

    const totalKnifeCasts = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.statusKnife?.totalCasts || 0),
      0
    );
    const optimalKnife = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.statusKnife?.optimalRefreshes || 0),
      0
    );
    const earlyKnife = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.statusKnife?.prematureRefreshes || 0),
      0
    );
    const droppedKnife = items.reduce(
      (acc, i) => acc + (i.result.dkStats?.statusKnife?.droppedRefreshes || 0),
      0
    );
    const totalKnifeIntervalWeighted = items.reduce(
      (acc, i) =>
        acc +
        (i.result.dkStats?.statusKnife?.avgIntervalSec || 0) *
          (i.result.dkStats?.statusKnife?.totalCasts || 0),
      0
    );
    const avgKnifeInterval =
      totalKnifeCasts > 0 ? totalKnifeIntervalWeighted / totalKnifeCasts : 0;

    const tauntUptimePct = Math.round(
      items.reduce((acc, i) => acc + (i.result.dkStats?.tankDebuffs?.tauntUptimePct || 0), 0) /
        Math.max(1, items.length)
    );
    const majorBreachUptimePct = Math.round(
      items.reduce((acc, i) => acc + (i.result.dkStats?.tankDebuffs?.majorBreachUptimePct || 0), 0) /
        Math.max(1, items.length)
    );
    const crusherUptimePct = Math.round(
      items.reduce((acc, i) => acc + (i.result.dkStats?.tankDebuffs?.crusherUptimePct || 0), 0) /
        Math.max(1, items.length)
    );
    const maimUptimePct = Math.round(
      items.reduce((acc, i) => acc + (i.result.dkStats?.tankDebuffs?.maimUptimePct || 0), 0) /
        Math.max(1, items.length)
    );

    coaching = getDragonknightCoachingFeedback({
      bossCount: items.length,
      specVariant: isTank ? 'tank' : 'parse',
      hasMagmaFist,
      heatShockThreeStackUptimePct: Math.round(avgThreeStackUptime),
      optimalMagmaFistRefreshes: optimalMF,
      earlyMagmaFistRefreshes: earlyMF,
      droppedHeatShockCount: droppedMF,
      avgMagmaFistInterval: avgMFInterval,
      whipMorph,
      reactionDelayMs,
      castsInOffBalance,
      offBalanceWindowsCount,
      expiredDotsCount,
      expiredDotsList: expiredDotsNames.join(', '),
      priorityViolationsCount,
      seethingFuryThreeStackPct,
      moltenWhipUnderThreeStacks: castsUnderThreeStacks,
      hasIgneousWeapons,
      igneousUptimePct: Math.round(avgIgneousUptime),
      earlyIgneousRecasts,
      droppedIgneousWindows,
      penalizedStandardSec,
      totalKnifeCasts,
      optimalKnife,
      earlyKnife,
      droppedKnife,
      avgKnifeInterval,
      isTank,
      tauntUptimePct,
      majorBreachUptimePct,
      crusherUptimePct,
      maimUptimePct,
      connectedLAs,
      emptyLAs,
      activeUptimePct,
      totalIdleSec
    });
  } else {
    coaching = getUniversalCoachingFeedback({
      connectedLAs,
      emptyLAs,
      activeUptimePct,
      totalIdleSec
    });
  }

  summary += `${coaching.assessment}\n\n`;

  if (coaching.strengths.length > 0) {
    summary += `**What went well:**\n`;
    for (const s of coaching.strengths) {
      summary += `- ${s}\n`;
    }
    summary += '\n';
  }

  if (coaching.leaks.length > 0) {
    summary += `**Key leaks to tighten up:**\n`;
    for (const l of coaching.leaks) {
      summary += `- ${l}\n`;
    }
  }

  return summary.trimEnd();
}

/**
 * Returns just the Overall Summary block (Header, Scope, Assessment, What went well, Key leaks).
 */
export function generateOverallSummaryOnly(
  items: Array<{ fight: BossFightContext; result: RotationAnalysisResult }>,
  specClass: string
): string {
  if (!items || items.length === 0) return '';
  const firstResult = items[0].result;
  const actorName = firstResult.fightMeta.actorName;
  const specName = firstResult.spec.name;
  const allKills = items.every(i => i.fight.kill);
  const scopeText = allKills
    ? `*Scope: Only looking at kill pulls (${items.length} boss${items.length === 1 ? '' : 'es'})*`
    : `*Scope: Across all pulls (${items.length} boss fight${items.length === 1 ? '' : 's'})*`;

  return `# Rotation Performance Summary — ${actorName} (${specName})\n${scopeText}\n\n${generateOverallSummary(items, specClass)}`;
}

/**
 * Natural 1-2 sentence human explanations for key skills across specs.
 */
export function generateKeySkillMechanics(specClass: string, specId?: string): string {
  const specKey =
    specId && KEY_SKILL_EXPLANATIONS[specId]
      ? specId
      : KEY_SKILL_EXPLANATIONS[specClass]
      ? specClass
      : 'sorcerer';
  const list = KEY_SKILL_EXPLANATIONS[specKey] || KEY_SKILL_EXPLANATIONS['sorcerer'];
  let text = '### Key Skill Mechanics\n';
  for (const item of list) {
    text += `- **${item.skill}**: ${item.explanation}\n`;
  }
  return text.trimEnd();
}

export interface TrialAverages {
  avgLaHitRate: number;
  avgActiveUptime: number;
  avgHeatShock?: number;
  avgIgneous?: number;
  avgFragImmediate?: number;
  avgBeamOptimal?: number;
  avgTriplets?: number;
}

export function computeTrialAverages(
  items: Array<{ fight: BossFightContext; result: RotationAnalysisResult }>,
  specClass: string
): TrialAverages {
  const totalConnected = items.reduce((acc, i) => acc + (i.result.idleStats.connectedLAsCount ?? 0), 0);
  const totalEmpty = items.reduce((acc, i) => acc + (i.result.idleStats.emptyLAsCount ?? 0), 0);
  const totalLAs = totalConnected + totalEmpty;
  const avgLaHitRate = totalLAs > 0 ? (totalConnected / totalLAs) * 100 : 100;

  const totalActive = items.reduce((acc, i) => acc + i.result.idleStats.totalActiveSec, 0);
  const totalIdle = items.reduce((acc, i) => acc + i.result.idleStats.totalIdleSec, 0);
  const avgActiveUptime = (totalActive + totalIdle) > 0 ? (totalActive / (totalActive + totalIdle)) * 100 : 100;

  let avgHeatShock: number | undefined = undefined;
  let avgIgneous: number | undefined = undefined;
  let avgFragImmediate: number | undefined = undefined;
  let avgBeamOptimal: number | undefined = undefined;
  let avgTriplets: number | undefined = undefined;

  if (specClass === 'dragonknight' || specClass === 'dk') {
    const mfItems = items.filter(i => i.result.dkStats?.magmaFist);
    if (mfItems.length > 0) {
      avgHeatShock =
        mfItems.reduce((acc, i) => acc + (i.result.dkStats?.magmaFist?.heatShockThreeStackUptimePct || 0), 0) /
        mfItems.length;
    }
    const ignItems = items.filter(i => i.result.dkStats?.igneousWeapons);
    if (ignItems.length > 0) {
      avgIgneous =
        ignItems.reduce((acc, i) => acc + (i.result.dkStats?.igneousWeapons?.uptimePct || 0), 0) /
        ignItems.length;
    }
  } else if (specClass === 'sorcerer') {
    const fragItems = items.filter(i => i.result.sorcStats?.totalFragProcsGained);
    if (fragItems.length > 0) {
      avgFragImmediate =
        fragItems.reduce((acc, i) => acc + (i.result.sorcStats?.fragProcImmediateCastPct || 0), 0) /
        fragItems.length;
    }
  } else if (specClass === 'arcanist') {
    const beamItems = items.filter(i => i.result.cruxStats?.totalBeams);
    if (beamItems.length > 0) {
      avgBeamOptimal =
        beamItems.reduce((acc, i) => acc + (i.result.cruxStats?.optimalPct || 0), 0) /
        beamItems.length;
    }
  } else if (specClass === 'necromancer') {
    const necroItems = items.filter(i => i.result.totalCycles > 0);
    if (necroItems.length > 0) {
      avgTriplets =
        necroItems.reduce((acc, i) => acc + (i.result.cadenceStats?.perfectTripletsPct || 0), 0) /
        necroItems.length;
    }
  }

  return {
    avgLaHitRate,
    avgActiveUptime,
    avgHeatShock,
    avgIgneous,
    avgFragImmediate,
    avgBeamOptimal,
    avgTriplets
  };
}

export function computeBossTrialComparison(
  item: { fight: BossFightContext; result: RotationAnalysisResult },
  averages: TrialAverages,
  specClass: string,
  bossCount: number
): string {
  if (bossCount <= 1) return '';

  const bossLa = item.result.idleStats.laHitRatePct ?? 100;
  const bossActive = item.result.idleStats.activeUptimePct ?? 100;
  const laDiff = bossLa - averages.avgLaHitRate;
  const activeDiff = bossActive - averages.avgActiveUptime;

  const points: string[] = [];
  let score = 0;

  // Active uptime
  if (activeDiff >= 3.5) {
    points.push(`active uptime held at ${bossActive}% (+${activeDiff.toFixed(1)}% vs trial avg)`);
    score += 2;
  } else if (activeDiff <= -3.5) {
    points.push(`active uptime dropped to ${bossActive}% (${activeDiff.toFixed(1)}% vs trial avg) with ${item.result.idleStats.totalIdleSec}s idle`);
    score -= 2;
  }

  // Light attacks
  if (laDiff >= 3.0 && bossLa >= 88) {
    points.push(`cleaner LA accuracy at ${bossLa}% (+${laDiff.toFixed(1)}% vs avg)`);
    score += 1;
  } else if (laDiff <= -4.0) {
    points.push(`LA hit rate dropped to ${bossLa}% (${laDiff.toFixed(1)}% vs avg)`);
    score -= 1;
  }

  // Spec mechanics
  if (specClass === 'dragonknight' || specClass === 'dk') {
    const dk = item.result.dkStats;
    if (dk?.magmaFist && averages.avgHeatShock !== undefined) {
      const hsDiff = dk.magmaFist.heatShockThreeStackUptimePct - averages.avgHeatShock;
      if (hsDiff >= 6) {
        points.push(`3-stack Heat Shock held higher at ${dk.magmaFist.heatShockThreeStackUptimePct}% (+${hsDiff.toFixed(0)}% vs avg)`);
        score += 2;
      } else if (hsDiff <= -6 || dk.magmaFist.droppedRefreshes >= 5) {
        points.push(`Heat Shock dropped ${dk.magmaFist.droppedRefreshes} times (${dk.magmaFist.heatShockThreeStackUptimePct}% vs ${averages.avgHeatShock.toFixed(0)}% avg)`);
        score -= 2;
      }
    }
    if (dk?.igneousWeapons && averages.avgIgneous !== undefined) {
      const ignDiff = dk.igneousWeapons.uptimePct - averages.avgIgneous;
      if (ignDiff >= 6) {
        points.push(`Igneous Weapons stayed up at ${dk.igneousWeapons.uptimePct}% (+${ignDiff.toFixed(0)}% vs avg)`);
        score += 1;
      } else if (ignDiff <= -6) {
        points.push(`Igneous Weapons fell to ${dk.igneousWeapons.uptimePct}% (${ignDiff.toFixed(0)}% vs avg)`);
        score -= 1;
      }
    }
  } else if (specClass === 'sorcerer') {
    const s = item.result.sorcStats;
    if (s && averages.avgFragImmediate !== undefined) {
      const fragDiff = (s.fragProcImmediateCastPct ?? 100) - averages.avgFragImmediate;
      if (fragDiff >= 8) {
        points.push(`instant Frag reactions were sharper at ${s.fragProcImmediateCastPct}% (+${fragDiff.toFixed(0)}% vs avg)`);
        score += 2;
      } else if (fragDiff <= -8) {
        points.push(`delayed Frag procs (${s.fragProcImmediateCastPct}% vs ${averages.avgFragImmediate.toFixed(0)}% avg)`);
        score -= 2;
      }
    }
  } else if (specClass === 'arcanist') {
    const c = item.result.cruxStats;
    if (c && averages.avgBeamOptimal !== undefined) {
      const optDiff = c.optimalPct - averages.avgBeamOptimal;
      if (optDiff >= 8) {
        points.push(`Fatecarver execution was cleaner at ${c.optimalPct}% full 3-Crux channels (+${optDiff.toFixed(0)}% vs avg)`);
        score += 2;
      } else if (optDiff <= -8) {
        points.push(`more interrupted beams (${c.optimalPct}% vs ${averages.avgBeamOptimal.toFixed(0)}% avg)`);
        score -= 2;
      }
    }
  } else if (specClass === 'necromancer') {
    const n = item.result.cadenceStats;
    if (n && averages.avgTriplets !== undefined) {
      const tripDiff = n.perfectTripletsPct - averages.avgTriplets;
      if (tripDiff >= 8) {
        points.push(`Blastbones cadence was tighter at ${n.perfectTripletsPct}% (+${tripDiff.toFixed(0)}% vs avg)`);
        score += 2;
      } else if (tripDiff <= -8) {
        points.push(`cadence was delayed (${n.perfectTripletsPct}% vs ${averages.avgTriplets.toFixed(0)}% avg)`);
        score -= 2;
      }
    }
  }

  const details = points.length > 0 ? ` (${points.join(', ')})` : '';
  if (score >= 2) {
    return `*This boss went better than other bosses in this trial${details}.*`;
  } else if (score <= -2) {
    return `*This boss was more turbulent than other bosses in this trial${details}.*`;
  } else {
    return `*Consistent with your trial average${details}.*`;
  }
}

export function formatBossStatsLines(
  item: { fight: BossFightContext; result: RotationAnalysisResult },
  specClass: string
): string[] {
  const lines: string[] = [];

  if (specClass === 'sorcerer' && item.result.sorcStats) {
    const s = item.result.sorcStats;

    if (s.hasShatteredPathsSignet) {
      if (s.ultimateBelow133Count && s.ultimateBelow133Count > 0) {
        lines.push(
          `- **Shattered Paths**: Dropped below 133 (Min: ${s.minUltimateValue}, ${s.ultimateBelow133Count} sub-133 samples)`
        );
      } else {
        lines.push(`- **Shattered Paths**: Maintained ≥ 133`);
      }
    }

    const hardcasts = s.hardcastFragsCasts > 0 ? ` | ${s.hardcastFragsCasts} hardcasts` : '';
    lines.push(
      `- **Frag Procs (Prio #1)**: ${s.fragProcImmediateCastPct ?? 100}% Immediate (${s.immediateFragProcsCount}/${s.totalFragProcsGained} immediate, ${s.delayedFragProcsCount} delayed by ${s.interveningSkillsDuringProcCount} GCDs, ${s.expiredFragProcsCount} expired)${hardcasts}`
    );

    const armPct =
      s.totalArmamentsCasts > 0
        ? Math.round((s.optimalArmamentsCasts / s.totalArmamentsCasts) * 100)
        : 100;
    lines.push(
      `- **Bound Armaments**: ${armPct}% Optimal (${s.optimalArmamentsCasts}/${s.totalArmamentsCasts} at 4+, avg ${s.avgStacksAtCast} stacks)`
    );

    lines.push(
      `- **Status Knife**: ${s.optimalKnifeRefreshes}/${s.totalKnifeCasts} on-time (${s.droppedKnifeCount} dropped, ${s.prematureKnifeCount} early, avg ${s.avgKnifeIntervalSec}s)`
    );

    lines.push(
      `- **Haunting Curse**: ${s.optimalCurseRefreshes}/${s.totalCurseCasts} intact (${s.recastBeforeSecondExplosionCount} clipped, avg ${s.avgCurseIntervalSec}s)`
    );

    lines.push(
      `- **Active Uptime & Idle**: ${item.result.idleStats.activeUptimePct}% active (${item.result.idleStats.totalIdleSec}s idle downtime)`
    );

    lines.push(
      `- **Light Attacks**: ${item.result.idleStats.laHitRatePct ?? 0}% hit rate (${item.result.idleStats.connectedLAsCount} connected / ${item.result.idleStats.emptyLAsCount} empty)`
    );
  } else if (specClass === 'arcanist' && item.result.cruxStats) {
    const c = item.result.cruxStats;

    const cutText = c.interruptedBeams > 0 ? ` (${c.interruptedBeams} interrupted)` : '';
    lines.push(
      `- **Fatecarver Execution**: ${c.optimalPct}% Optimal — ${c.optimalBeams} / ${c.totalBeams} 3-Crux full channels${cutText}`
    );

    lines.push(
      `- **Crux Usage**: ${c.threeCruxPct}% at 3 Crux (${c.underCruxBeams} cast at < 3 Crux)`
    );

    lines.push(
      `- **Beam Channel Uptime**: ${c.beamUptimePct}% (${c.totalBeamChannelSec}s of ${item.fight.durationSec}s fight)`
    );

    lines.push(
      `- **Active Uptime & Idle**: ${item.result.idleStats.activeUptimePct}% active (${item.result.idleStats.totalIdleSec}s idle downtime)`
    );

    lines.push(
      `- **Light Attacks**: ${item.result.idleStats.laHitRatePct ?? 0}% hit rate (${item.result.idleStats.connectedLAsCount} connected / ${item.result.idleStats.emptyLAsCount} empty)`
    );
  } else if ((specClass === 'dragonknight' || specClass === 'dk') && item.result.dkStats) {
    const dk = item.result.dkStats;

    if (dk.magmaFist) {
      lines.push(
        `- **Heat Shock (Magma Fist)**: ${dk.magmaFist.heatShockThreeStackUptimePct}% 3-stack uptime (${dk.magmaFist.optimalRefreshes} on-time, ${dk.magmaFist.earlyRefreshes} early, ${dk.magmaFist.droppedRefreshes} dropped, avg ${dk.magmaFist.avgIntervalSec}s)`
      );
    }

    if (dk.whipMiniGame && dk.whipMiniGame.morph === 'flame_lash') {
      const w = dk.whipMiniGame;
      const delayStr = w.reactionDelayMs !== undefined ? ` | ${w.reactionDelayMs}ms avg reaction` : '';
      const droppedStr =
        w.expiredDotsDuringLash && w.expiredDotsDuringLash.length > 0
          ? ` | ${w.expiredDotsDuringLash.length} DoTs dropped`
          : '';
      const prioStr =
        w.priorityViolationsCount && w.priorityViolationsCount > 0
          ? ` | ${w.priorityViolationsCount} prio violations`
          : '';
      lines.push(
        `- **Flame Lash (Off-Balance)**: ${w.castsInOffBalance} casts in ${w.offBalanceWindowsCount ?? 0} OB windows${delayStr}${droppedStr}${prioStr}`
      );
    } else if (dk.whipMiniGame && dk.whipMiniGame.morph === 'molten_whip') {
      const w = dk.whipMiniGame;
      lines.push(
        `- **Molten Whip**: ${w.seethingFuryThreeStackPct}% at 3 stacks (${w.castsAtThreeStacks}/${w.totalCasts} at 3 stacks for +99% dmg)`
      );
    }

    if (dk.tankDebuffs) {
      const td = dk.tankDebuffs;
      lines.push(
        `- **Tank Debuffs**: Taunt ${td.tauntUptimePct}% | Major Breach ${td.majorBreachUptimePct}% | Crusher ${td.crusherUptimePct}% | Maim ${td.maimUptimePct}%`
      );
    }

    if (dk.igneousWeapons) {
      lines.push(
        `- **Igneous Weapons**: ${dk.igneousWeapons.uptimePct}% uptime (${dk.igneousWeapons.totalCasts} casts, ${dk.igneousWeapons.prematureRecasts} early)`
      );
    }

    if (dk.statusKnife) {
      lines.push(
        `- **Status Knife**: ${dk.statusKnife.optimalRefreshes}/${dk.statusKnife.totalCasts} on-time (${dk.statusKnife.droppedRefreshes} dropped, ${dk.statusKnife.prematureRefreshes} early, avg ${dk.statusKnife.avgIntervalSec}s)`
      );
    }

    lines.push(
      `- **Active Uptime & Idle**: ${item.result.idleStats.activeUptimePct}% active (${item.result.idleStats.totalIdleSec}s idle downtime)`
    );

    lines.push(
      `- **Light Attacks**: ${item.result.idleStats.laHitRatePct ?? 0}% hit rate (${item.result.idleStats.connectedLAsCount} connected / ${item.result.idleStats.emptyLAsCount} empty)`
    );
  } else {
    lines.push(
      `- **Active Uptime & Idle**: ${item.result.idleStats.activeUptimePct}% active (${item.result.idleStats.totalIdleSec}s idle downtime)`
    );
    lines.push(
      `- **Light Attacks**: ${item.result.idleStats.laHitRatePct ?? 0}% hit rate (${item.result.idleStats.connectedLAsCount} connected / ${item.result.idleStats.emptyLAsCount} empty)`
    );
    lines.push(
      `- **GCD APM**: ${Math.round(
        (item.result.totalGCDCasts / Math.max(1, item.fight.durationSec)) * 60
      )} casts/min (${item.result.idleStats.averageGapMs}ms avg gap)`
    );
  }

  return lines;
}

/**
 * Returns a single boss's breakdown text including comparison with trial averages.
 */
export function generateBossItemBreakdown(
  item: { fight: BossFightContext; result: RotationAnalysisResult },
  allItems: Array<{ fight: BossFightContext; result: RotationAnalysisResult }>,
  specClass: string
): string {
  const averages = computeTrialAverages(allItems, specClass);
  const lines: string[] = [`## ${item.fight.name}`];
  const compNote = computeBossTrialComparison(item, averages, specClass, allItems.length);
  if (compNote) {
    lines.push(compNote);
  }
  lines.push(...formatBossStatsLines(item, specClass));
  return lines.join('\n');
}

/**
 * Pull-by-pull boss stats without repetitive headers or redundant explanations.
 */
function generateBossBreakdown(
  items: Array<{ fight: BossFightContext; result: RotationAnalysisResult }>,
  specClass: string,
  allKills: boolean
): string {
  const averages = computeTrialAverages(items, specClass);
  // Track pull occurrences if in all-pulls mode
  const fightNameCounts: { [name: string]: number } = {};
  for (const item of items) {
    fightNameCounts[item.fight.name] = (fightNameCounts[item.fight.name] || 0) + 1;
  }
  const currentPullCounter: { [name: string]: number } = {};

  const sections: string[] = [];

  for (const item of items) {
    const fightName = item.fight.name;
    let headerTitle = fightName;

    // If multiple pulls of same boss, differentiate
    if (!allKills && fightNameCounts[fightName] > 1) {
      currentPullCounter[fightName] = (currentPullCounter[fightName] || 0) + 1;
      const pullNum = currentPullCounter[fightName];
      const outcome = item.fight.kill ? 'Kill' : 'Wipe';
      headerTitle = `${fightName} (Pull ${pullNum} - ${outcome})`;
    }

    const lines: string[] = [`## ${headerTitle}`];
    const compNote = computeBossTrialComparison(item, averages, specClass, items.length);
    if (compNote) {
      lines.push(compNote);
    }
    lines.push(...formatBossStatsLines(item, specClass));
    sections.push(lines.join('\n'));
  }

  return sections.join('\n\n');
}
