export interface ESOEncounter {
  id: number;
  name: string;
}

export interface ESOZone {
  id: number;
  name: string;
  frozen?: boolean;
  encounters: ESOEncounter[];
}

export interface ESORankingItem {
  name: string;
  class: number;
  spec: number;
  total: number;
  duration: number; // in milliseconds
  startTime: number;
  reportID: string;
  fightID: number;
  guildName?: string;
  server?: string;
  region?: string;
}

export interface ESORankingsResponse {
  page: number;
  hasMorePages: boolean;
  count: number;
  total?: number;
  rankings: ESORankingItem[];
}

export interface GearItem {
  id: number;
  slot: number;
  quality: number;
  icon: string;
  name?: string;
  championPoints?: number;
  trait?: number;
  enchantType?: number;
  enchantQuality?: number;
  setID?: number;
  type?: number;
  setName?: string;
}

export interface TalentItem {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
  flags?: number;
}

export interface CombatantInfo {
  stats?: Record<string, any>;
  talents?: TalentItem[];
  gear?: GearItem[];
}

export interface PlayerDetail {
  name: string;
  id: number;
  guid: number;
  type: string; // Class name: e.g. "DragonKnight", "Arcanist", "Sorcerer", "Templar", "Nightblade", "Warden", "Necromancer"
  icon: string;
  specs: string[]; // e.g. ["Tank"], ["Healer"], ["Magicka DPS"], ["Stamina DPS"]
  combatantInfo?: CombatantInfo;
}

export interface FightSummaryResponse {
  totalTime?: number;
  itemLimit?: number;
  composition?: Array<{
    name: string;
    id: number;
    guid: number;
    type: string;
    specs: string[];
  }>;
  playerDetails?: {
    tanks?: PlayerDetail[];
    healers?: PlayerDetail[];
    dps?: PlayerDetail[];
  };
}

export interface BossReportsSummary {
  bossId: number;
  bossName?: string;
  zoneId?: number;
  zoneName?: string;
  totalReports: number;
  totalUniqueKills?: number;
  minDuration: number; // milliseconds
  maxDuration: number; // milliseconds
  reports: Array<{
    reportID: string;
    fightID: number;
    duration: number;
    startTime: number;
    guildName?: string;
  }>;
}

export interface ClassFrequency {
  className: string;
  count: number;
  percentage: number;
  averagePerRaid: number;
}

export interface RoleCompositionStats {
  role: 'tanks' | 'healers' | 'dps';
  totalRoleSlots: number;
  classes: ClassFrequency[];
}

export interface GearCombination {
  combinationKey: string; // e.g. "Perfected Lucent Echoes + Elemental Catalyst + Lord Warden"
  sets: string[];
  monsterSet?: string;
  mythic?: string;
  count: number;
  percentage: number;
  samplePlayers: string[];
}

export interface GearSetStat {
  setName: string;
  count: number;
  percentage: number;
}

export interface SkillStat {
  name: string;
  guid: number;
  abilityIcon: string;
  count: number;
  percentage: number;
}

export interface ClassRoleStats {
  classRoleKey: string; // e.g. "Arcanist - Tank"
  className: string;
  role: 'Tank' | 'Healer' | 'Damage Dealer';
  sampleCount: number;
  gearCombinations: GearCombination[];
  popularSets: GearSetStat[];
  popularSkills: SkillStat[];
}

export interface SupportFilter {
  tank1: string;
  tank2: string;
  healer1: string;
  healer2: string;
}

export interface AvailableSupportCombo {
  tank1: string;
  tank2: string;
  healer1: string;
  healer2: string;
  comboLabel: string;
  count: number;
  percentage: number;
}

export interface FourSupportTeamLoadout {
  tank1Class: string;
  tank1Gear: string;
  tank2Class: string;
  tank2Gear: string;
  healer1Class: string;
  healer1Gear: string;
  healer2Class: string;
  healer2Gear: string;
  count: number;
  percentage: number;
}

export interface FourSupportAnalysis {
  filter: SupportFilter;
  matchingLogsCount: number;
  totalLogsAnalyzed: number;
  availableCombos: AvailableSupportCombo[];
  supportGearSuggestions: {
    tank1: { className: string; popularCombos: GearCombination[]; topSets: GearSetStat[] };
    tank2: { className: string; popularCombos: GearCombination[]; topSets: GearSetStat[] };
    healer1: { className: string; popularCombos: GearCombination[]; topSets: GearSetStat[] };
    healer2: { className: string; popularCombos: GearCombination[]; topSets: GearSetStat[] };
  };
  teamLoadouts: FourSupportTeamLoadout[];
  recalculatedDps: {
    totalSlots: number;
    averagePerRaid: number;
    classes: ClassFrequency[];
    popularCombos: GearCombination[];
    popularSkills: SkillStat[];
  };
}

export interface AggregatedRosterData {
  bossId: number;
  reportsAnalyzed: number;
  filterDurationMin: number;
  filterDurationMax: number;
  composition: {
    tanks: RoleCompositionStats;
    healers: RoleCompositionStats;
    dps: RoleCompositionStats;
  };
  classRoles: ClassRoleStats[];
  availableSupportCombos?: AvailableSupportCombo[];
  fourSupportAnalysis?: FourSupportAnalysis;
}
