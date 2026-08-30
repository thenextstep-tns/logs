import {
  ESORankingItem,
  FightSummaryResponse,
  PlayerDetail,
  AggregatedRosterData,
  RoleCompositionStats,
  ClassRoleStats,
  ClassFrequency,
  GearCombination,
  GearSetStat,
  SkillStat,
  SupportFilter,
  AvailableSupportCombo,
  FourSupportAnalysis,
  FourSupportTeamLoadout
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
 * Helper to match an array of required classes against an array of present classes (with multiset support)
 */
function matchesClassMultiset(required: string[], available: string[]): boolean {
  if (required.length === 0) return true;
  const availCopy = available.map(c => c.toLowerCase());
  for (const req of required) {
    const reqLower = req.toLowerCase();
    const idx = availCopy.indexOf(reqLower);
    if (idx === -1) return false;
    availCopy.splice(idx, 1);
  }
  return true;
}

/**
 * Identifies all distinct 4-support setups that actually occurred across the logs
 */
export function extractAvailableSupportCombos(summaries: FightSummaryResponse[]): AvailableSupportCombo[] {
  const comboMap = new Map<string, { tank1: string; tank2: string; healer1: string; healer2: string; count: number }>();
  let totalValid = 0;

  for (const summary of summaries) {
    const tanks = summary.playerDetails?.tanks || [];
    const healers = summary.playerDetails?.healers || [];

    if (tanks.length >= 2 && healers.length >= 2) {
      const sortedTanks = [tanks[0].type || 'Unknown', tanks[1].type || 'Unknown'].sort();
      const sortedHealers = [healers[0].type || 'Unknown', healers[1].type || 'Unknown'].sort();

      const key = `${sortedTanks[0]}|${sortedTanks[1]}|${sortedHealers[0]}|${sortedHealers[1]}`;
      if (!comboMap.has(key)) {
        comboMap.set(key, {
          tank1: sortedTanks[0],
          tank2: sortedTanks[1],
          healer1: sortedHealers[0],
          healer2: sortedHealers[1],
          count: 0
        });
      }
      comboMap.get(key)!.count++;
      totalValid++;
    }
  }

  return Array.from(comboMap.values())
    .map(item => ({
      tank1: item.tank1,
      tank2: item.tank2,
      healer1: item.healer1,
      healer2: item.healer2,
      comboLabel: `${item.tank1} & ${item.tank2} Tanks + ${item.healer1} & ${item.healer2} Healers`,
      count: item.count,
      percentage: totalValid > 0 ? Number(((item.count / totalValid) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Filters fight summaries to only those matching the 4 selected support classes
 */
export function filterSummariesBySupport(
  summaries: FightSummaryResponse[],
  filter?: SupportFilter
): FightSummaryResponse[] {
  if (!filter || !filter.tank1 || !filter.tank2 || !filter.healer1 || !filter.healer2) {
    return summaries;
  }

  const reqTanks = [filter.tank1, filter.tank2];
  const reqHealers = [filter.healer1, filter.healer2];

  return summaries.filter(summary => {
    const tanks = (summary.playerDetails?.tanks || []).map(p => p.type);
    const healers = (summary.playerDetails?.healers || []).map(p => p.type);

    return matchesClassMultiset(reqTanks, tanks) && matchesClassMultiset(reqHealers, healers);
  });
}

/**
 * Computes deep analysis for a specific 4-support combination:
 * 1. Gear suggestions for all 4 players
 * 2. Team loadout combinations (simultaneous 4-player gear distribution)
 * 3. Recalculated DD group composition & popular DD loadouts
 */
export function computeFourSupportAnalysis(
  summaries: FightSummaryResponse[],
  filter: SupportFilter
): FourSupportAnalysis {
  const availableCombos = extractAvailableSupportCombos(summaries);
  const matchingSummaries = filterSummariesBySupport(summaries, filter);
  const matchingLogsCount = matchingSummaries.length;
  const totalLogsAnalyzed = summaries.length;

  const extractSlotStats = (
    className: string,
    role: 'tanks' | 'healers'
  ): { className: string; popularCombos: GearCombination[]; topSets: GearSetStat[] } => {
    const comboMap: Record<string, { count: number; players: Set<string> }> = {};
    const setMap: Record<string, number> = {};
    let sampleCount = 0;

    for (const summary of matchingSummaries) {
      const players = (summary.playerDetails?.[role] || []).filter(
        p => p.type.toLowerCase() === className.toLowerCase()
      );
      for (const p of players) {
        sampleCount++;
        const { combinationKey, identifiedSets } = extractGearCombination(p.combatantInfo?.gear);
        if (!comboMap[combinationKey]) {
          comboMap[combinationKey] = { count: 0, players: new Set() };
        }
        comboMap[combinationKey].count++;
        if (p.name) comboMap[combinationKey].players.add(p.name);

        for (const s of identifiedSets) {
          setMap[s] = (setMap[s] || 0) + 1;
        }
      }
    }

    const popularCombos: GearCombination[] = Object.entries(comboMap)
      .map(([combinationKey, info]) => ({
        combinationKey,
        sets: combinationKey.split(' + '),
        count: info.count,
        percentage: sampleCount > 0 ? Number(((info.count / sampleCount) * 100).toFixed(1)) : 0,
        samplePlayers: Array.from(info.players).slice(0, 3)
      }))
      .sort((a, b) => b.count - a.count);

    const topSets: GearSetStat[] = Object.entries(setMap)
      .map(([setName, count]) => ({
        setName,
        count,
        percentage: sampleCount > 0 ? Number(((count / sampleCount) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      className,
      popularCombos,
      topSets
    };
  };

  // Full 4-Player Team Loadout co-occurrences in each log
  const teamLoadoutsMap = new Map<string, { loadout: FourSupportTeamLoadout; count: number }>();

  for (const summary of matchingSummaries) {
    const tanks = summary.playerDetails?.tanks || [];
    const healers = summary.playerDetails?.healers || [];

    // Find players matching classes
    const t1Player = tanks.find(p => p.type.toLowerCase() === filter.tank1.toLowerCase());
    const t2Player = tanks.find(p => p !== t1Player && p.type.toLowerCase() === filter.tank2.toLowerCase());
    const h1Player = healers.find(p => p.type.toLowerCase() === filter.healer1.toLowerCase());
    const h2Player = healers.find(p => p !== h1Player && p.type.toLowerCase() === filter.healer2.toLowerCase());

    if (t1Player && t2Player && h1Player && h2Player) {
      const t1Gear = extractGearCombination(t1Player.combatantInfo?.gear).combinationKey;
      const t2Gear = extractGearCombination(t2Player.combatantInfo?.gear).combinationKey;
      const h1Gear = extractGearCombination(h1Player.combatantInfo?.gear).combinationKey;
      const h2Gear = extractGearCombination(h2Player.combatantInfo?.gear).combinationKey;

      const teamKey = `${t1Gear} || ${t2Gear} || ${h1Gear} || ${h2Gear}`;
      if (!teamLoadoutsMap.has(teamKey)) {
        teamLoadoutsMap.set(teamKey, {
          loadout: {
            tank1Class: filter.tank1,
            tank1Gear: t1Gear,
            tank2Class: filter.tank2,
            tank2Gear: t2Gear,
            healer1Class: filter.healer1,
            healer1Gear: h1Gear,
            healer2Class: filter.healer2,
            healer2Gear: h2Gear,
            count: 0,
            percentage: 0
          },
          count: 0
        });
      }
      teamLoadoutsMap.get(teamKey)!.count++;
    }
  }

  const teamLoadouts: FourSupportTeamLoadout[] = Array.from(teamLoadoutsMap.values())
    .map(item => ({
      ...item.loadout,
      count: item.count,
      percentage: matchingLogsCount > 0 ? Number(((item.count / matchingLogsCount) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Recalculate DPS composition for these matching logs
  const dpsClassCounts: Record<string, number> = {};
  const dpsCombos: Record<string, { count: number; players: Set<string> }> = {};
  const dpsSkills: Record<string, { count: number; guid: number; abilityIcon: string }> = {};
  let totalDpsSlots = 0;

  for (const summary of matchingSummaries) {
    const dpsList = summary.playerDetails?.dps || [];
    for (const p of dpsList) {
      totalDpsSlots++;
      const className = p.type || 'Unknown';
      dpsClassCounts[className] = (dpsClassCounts[className] || 0) + 1;

      const { combinationKey } = extractGearCombination(p.combatantInfo?.gear);
      if (!dpsCombos[combinationKey]) {
        dpsCombos[combinationKey] = { count: 0, players: new Set() };
      }
      dpsCombos[combinationKey].count++;
      if (p.name) dpsCombos[combinationKey].players.add(p.name);

      const talents = p.combatantInfo?.talents || [];
      const seen = new Set<string>();
      for (const t of talents) {
        if (t.name && !seen.has(t.name)) {
          seen.add(t.name);
          if (!dpsSkills[t.name]) {
            dpsSkills[t.name] = { count: 0, guid: t.guid, abilityIcon: t.abilityIcon || '' };
          }
          dpsSkills[t.name].count++;
        }
      }
    }
  }

  const recalculatedDpsClasses: ClassFrequency[] = Object.entries(dpsClassCounts)
    .map(([className, count]) => ({
      className,
      count,
      percentage: totalDpsSlots > 0 ? Number(((count / totalDpsSlots) * 100).toFixed(1)) : 0,
      averagePerRaid: matchingLogsCount > 0 ? Number((count / matchingLogsCount).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const recalculatedDpsCombos: GearCombination[] = Object.entries(dpsCombos)
    .map(([combinationKey, info]) => ({
      combinationKey,
      sets: combinationKey.split(' + '),
      count: info.count,
      percentage: totalDpsSlots > 0 ? Number(((info.count / totalDpsSlots) * 100).toFixed(1)) : 0,
      samplePlayers: Array.from(info.players).slice(0, 3)
    }))
    .sort((a, b) => b.count - a.count);

  const recalculatedDpsSkills: SkillStat[] = Object.entries(dpsSkills)
    .map(([name, info]) => ({
      name,
      guid: info.guid,
      abilityIcon: info.abilityIcon,
      count: info.count,
      percentage: totalDpsSlots > 0 ? Number(((info.count / totalDpsSlots) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  return {
    filter,
    matchingLogsCount,
    totalLogsAnalyzed,
    availableCombos,
    supportGearSuggestions: {
      tank1: extractSlotStats(filter.tank1, 'tanks'),
      tank2: extractSlotStats(filter.tank2, 'tanks'),
      healer1: extractSlotStats(filter.healer1, 'healers'),
      healer2: extractSlotStats(filter.healer2, 'healers')
    },
    teamLoadouts,
    recalculatedDps: {
      totalSlots: totalDpsSlots,
      averagePerRaid: matchingLogsCount > 0 ? Number((totalDpsSlots / matchingLogsCount).toFixed(1)) : 0,
      classes: recalculatedDpsClasses,
      popularCombos: recalculatedDpsCombos,
      popularSkills: recalculatedDpsSkills
    }
  };
}

/**
 * Aggregates group composition, gear combinations, and skill choices from summaries
 */
export function aggregateRosterData(
  bossId: number,
  summaries: FightSummaryResponse[],
  filterDurationMin: number,
  filterDurationMax: number,
  supportFilter?: SupportFilter
): AggregatedRosterData {
  const totalReports = summaries.length;
  const availableSupportCombos = extractAvailableSupportCombos(summaries);

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

  // If support filter is specified, compute 4-support analysis
  const fourSupportAnalysis = supportFilter && supportFilter.tank1 && supportFilter.tank2 && supportFilter.healer1 && supportFilter.healer2
    ? computeFourSupportAnalysis(summaries, supportFilter)
    : undefined;

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
    classRoles,
    availableSupportCombos,
    fourSupportAnalysis
  };
}
