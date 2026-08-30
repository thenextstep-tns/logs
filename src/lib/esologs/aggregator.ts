import {
  ESORankingItem,
  FightSummaryResponse,
  PlayerDetail,
  AggregatedRosterData,
  RoleCompositionStats,
  ClassRoleStats,
  GearCombination,
  GearSetStat,
  SkillStat
} from '@/types/esologs';

export function formatDuration(ms: number): string {
  if (!ms || ms <= 0 || !isFinite(ms)) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

export function calculateMinMaxKillTimes(rankings: ESORankingItem[]): {
  minDuration: number;
  maxDuration: number;
  totalUniqueKills: number;
} {
  if (!rankings || rankings.length === 0) {
    return { minDuration: 0, maxDuration: 0, totalUniqueKills: 0 };
  }

  const validDurations = rankings
    .map(r => r.duration)
    .filter(d => typeof d === 'number' && d > 0);

  if (validDurations.length === 0) {
    return { minDuration: 0, maxDuration: 0, totalUniqueKills: 0 };
  }

  const minDuration = Math.min(...validDurations);
  const maxDuration = Math.max(...validDurations);

  // Unique report + fight
  const uniqueKeys = new Set(rankings.map(r => `${r.reportID}_${r.fightID}`));

  return {
    minDuration,
    maxDuration,
    totalUniqueKills: uniqueKeys.size
  };
}

/**
 * Extracts distinct sets and combinations from a player's gear array
 */
export function extractGearCombination(gearItems?: Array<{ setName?: string; name?: string; slot?: number; quality?: number }>): {
  combinationKey: string;
  identifiedSets: string[];
  setCounts: Record<string, number>;
} {
  if (!gearItems || gearItems.length === 0) {
    return { combinationKey: 'No Gear Recorded', identifiedSets: [], setCounts: {} };
  }

  const setCounts: Record<string, number> = {};
  for (const item of gearItems) {
    if (item.setName && item.setName.trim() !== '') {
      const setName = item.setName.trim();
      setCounts[setName] = (setCounts[setName] || 0) + 1;
    }
  }

  // Sort sets by piece count descending, then alphabetically
  const sortedSets = Object.entries(setCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => `${name}${count > 1 ? ` (${count})` : ''}`);

  const combinationKey = sortedSets.length > 0 ? sortedSets.join(' + ') : 'Undetermined Sets';

  return {
    combinationKey,
    identifiedSets: Object.keys(setCounts),
    setCounts
  };
}

/**
 * Aggregates group composition, gear combinations, and skill choices from summaries
 */
export function aggregateRosterData(
  bossId: number,
  summaries: FightSummaryResponse[],
  filterDurationMin: number,
  filterDurationMax: number
): AggregatedRosterData {
  const totalReports = summaries.length;

  const roleRawCounts: {
    tanks: Record<string, number>;
    healers: Record<string, number>;
    dps: Record<string, number>;
  } = {
    tanks: {},
    healers: {},
    dps: {}
  };

  let totalTanks = 0;
  let totalHealers = 0;
  let totalDps = 0;

  // Key: "ClassName - Role" (e.g. "Arcanist - Tank")
  const classRoleMap: Record<
    string,
    {
      className: string;
      role: 'Tank' | 'Healer' | 'Damage Dealer';
      sampleCount: number;
      combos: Record<string, { count: number; players: Set<string> }>;
      sets: Record<string, number>;
      skills: Record<string, { count: number; guid: number; abilityIcon: string }>;
    }
  > = {};

  for (const summary of summaries) {
    if (!summary || !summary.playerDetails) continue;

    const roles: Array<{ key: 'tanks' | 'healers' | 'dps'; roleLabel: 'Tank' | 'Healer' | 'Damage Dealer' }> = [
      { key: 'tanks', roleLabel: 'Tank' },
      { key: 'healers', roleLabel: 'Healer' },
      { key: 'dps', roleLabel: 'Damage Dealer' }
    ];

    for (const { key, roleLabel } of roles) {
      const players: PlayerDetail[] = summary.playerDetails[key] || [];
      for (const p of players) {
        const className = p.type || 'Unknown';
        roleRawCounts[key][className] = (roleRawCounts[key][className] || 0) + 1;

        if (key === 'tanks') totalTanks++;
        else if (key === 'healers') totalHealers++;
        else totalDps++;

        const crKey = `${className} - ${roleLabel}`;
        if (!classRoleMap[crKey]) {
          classRoleMap[crKey] = {
            className,
            role: roleLabel,
            sampleCount: 0,
            combos: {},
            sets: {},
            skills: {}
          };
        }

        const crData = classRoleMap[crKey];
        crData.sampleCount++;

        // Process Gear Combinations
        const gearItems = p.combatantInfo?.gear || [];
        const { combinationKey, identifiedSets } = extractGearCombination(gearItems);

        if (!crData.combos[combinationKey]) {
          crData.combos[combinationKey] = { count: 0, players: new Set() };
        }
        crData.combos[combinationKey].count++;
        if (p.name) {
          crData.combos[combinationKey].players.add(p.name);
        }

        // Process Individual Gear Sets
        for (const setName of identifiedSets) {
          crData.sets[setName] = (crData.sets[setName] || 0) + 1;
        }

        // Process Skills
        const talents = p.combatantInfo?.talents || [];
        const seenSkillsInFight = new Set<string>();
        for (const t of talents) {
          if (t.name && !seenSkillsInFight.has(t.name)) {
            seenSkillsInFight.add(t.name);
            if (!crData.skills[t.name]) {
              crData.skills[t.name] = {
                count: 0,
                guid: t.guid,
                abilityIcon: t.abilityIcon || ''
              };
            }
            crData.skills[t.name].count++;
          }
        }
      }
    }
  }

  const buildRoleStats = (
    role: 'tanks' | 'healers' | 'dps',
    totalSlots: number,
    counts: Record<string, number>
  ): RoleCompositionStats => {
    const classes = Object.entries(counts)
      .map(([className, count]) => ({
        className,
        count,
        percentage: totalSlots > 0 ? Number(((count / totalSlots) * 100).toFixed(1)) : 0,
        averagePerRaid: totalReports > 0 ? Number((count / totalReports).toFixed(2)) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      role,
      totalRoleSlots: totalSlots,
      classes
    };
  };

  // Build ClassRoleStats list
  const classRoles: ClassRoleStats[] = Object.entries(classRoleMap)
    .map(([classRoleKey, data]) => {
      const gearCombinations: GearCombination[] = Object.entries(data.combos)
        .map(([combinationKey, comboInfo]) => ({
          combinationKey,
          sets: combinationKey.split(' + '),
          count: comboInfo.count,
          percentage: data.sampleCount > 0 ? Number(((comboInfo.count / data.sampleCount) * 100).toFixed(1)) : 0,
          samplePlayers: Array.from(comboInfo.players).slice(0, 3)
        }))
        .sort((a, b) => b.count - a.count);

      const popularSets: GearSetStat[] = Object.entries(data.sets)
        .map(([setName, count]) => ({
          setName,
          count,
          percentage: data.sampleCount > 0 ? Number(((count / data.sampleCount) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.count - a.count);

      const popularSkills: SkillStat[] = Object.entries(data.skills)
        .map(([name, skillInfo]) => ({
          name,
          guid: skillInfo.guid,
          abilityIcon: skillInfo.abilityIcon,
          count: skillInfo.count,
          percentage: data.sampleCount > 0 ? Number(((skillInfo.count / data.sampleCount) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.count - a.count);

      return {
        classRoleKey,
        className: data.className,
        role: data.role,
        sampleCount: data.sampleCount,
        gearCombinations,
        popularSets,
        popularSkills
      };
    })
    .sort((a, b) => b.sampleCount - a.sampleCount);

  return {
    bossId,
    reportsAnalyzed: totalReports,
    filterDurationMin,
    filterDurationMax,
    composition: {
      tanks: buildRoleStats('tanks', totalTanks, roleRawCounts.tanks),
      healers: buildRoleStats('healers', totalHealers, roleRawCounts.healers),
      dps: buildRoleStats('dps', totalDps, roleRawCounts.dps)
    },
    classRoles
  };
}
