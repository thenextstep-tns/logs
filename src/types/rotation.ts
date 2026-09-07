export type GCDClassification =
  | 'BB'
  | 'Beam'
  | 'Frags'
  | 'Whip'
  | 'Taunt'
  | 'Fist'
  | 'Siphon'
  | 'Dot'
  | 'Skull'
  | 'Ult'
  | 'Mechanic'
  | 'Unknown';

export type PerformanceZone = 'green' | 'yellow' | 'orange' | 'red' | 'darkRed';

export interface PerformanceZoneInfo {
  zone: PerformanceZone;
  label: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface RawCastEvent {
  timestamp: number;
  type: string;
  sourceID: number;
  targetID?: number;
  ability: {
    name: string;
    guid: number;
    type?: number;
    abilityIcon?: string;
    flags?: number;
  };
  fight?: number;
  castTrackID?: number;
}

export interface NormalizedGCDCast {
  timestamp: number;
  timeSec: number;
  abilityName: string;
  abilityGuid: number;
  classification: GCDClassification;
  icon?: string;
  hasPrecedingLA?: boolean;
  laTimestamp?: number;
  weaveDelayMs?: number;
  isStandaloneLA?: boolean;
  laHit?: boolean; // Whether the paired or standalone LA actually dealt damage to a target
  followedByBarSwap?: boolean;
  gapToNextSkillMs?: number;
  idleTimeMs?: number;
  channelDurationMs?: number;
  cruxCount?: number;
}

export interface RotationPatternSpec {
  id: string;
  name: string;
  sequence: GCDClassification[];
  description: string;
}

export interface RotationSpec {
  id: string;
  name: string;
  role?: 'tank' | 'pure_dps' | 'support_dps' | 'healer';
  class: 'Necromancer' | 'Nightblade' | 'Dragonknight' | 'Sorcerer' | 'Templar' | 'Warden' | 'Arcanist' | string;
  description: string;
  authorNote?: string;
  isRecognized?: boolean;
  keySkills: {
    anchorSkill: {
      name: string;
      token: GCDClassification;
      aliases: string[];
      guids?: number[];
      cadenceTarget: number; // e.g. 3 (every 3rd skill)
    };
    siphonSkills: {
      aliases: string[];
      guids?: number[];
    };
    spammableSkills: {
      aliases: string[];
      guids?: number[];
    };
    dotSkills: {
      aliases: string[];
      guids?: number[];
    };
    ultimateSkills: {
      aliases: string[];
      guids?: number[];
    };
    mechanicSkills?: {
      aliases: string[];
      guids?: number[];
    };
  };
  patterns: RotationPatternSpec[];
  nonGCDSkills: string[];
}

export interface TripletCycle {
  cycleIndex: number;
  startTs: number;
  startSec: number;
  endTs: number;
  endSec: number;
  durationSec: number;
  idleTimeSec: number;
  casts: NormalizedGCDCast[];
  patternString: string;
  matchedPatternId: string | null;
  matchedPatternName: string;
  isOptimal: boolean;
  cadenceCount: number; // Number of casts between this anchor and the next
  cadenceScore: number; // 0 - 100%
  sequenceScore: number; // 0 - 100%
  cycleScore: number; // combined 0 - 100%
  zone: PerformanceZone;
  laWeaveCount: number;
  laWeavePct: number;
  diagnostics: string[];
}

export interface TimelineDataPoint {
  timestamp: number;
  timeSec: number;
  formattedTime: string;
  score: number; // 0 - 100
  zone: PerformanceZone;
  recentCasts: string[];
  activePattern: string;
  cycleIndex?: number;
  idleTimeSec?: number;
  notes?: string;
}

export interface ZoneDistribution {
  greenPct: number; // 90 - 100%
  yellowPct: number; // 75 - 90%
  orangePct: number; // 50 - 75%
  redPct: number; // 25 - 50%
  darkRedPct: number; // 0 - 25%
}

export interface PatternDistributionStat {
  id: string;
  name: string;
  observedCount: number;
  observedPct: number;
  description: string;
  isValidPattern: boolean;
}

export interface CadenceStats {
  averageInterval: number;
  targetInterval: number;
  perfectTripletsCount: number;
  perfectTripletsPct: number;
  delayedCadenceCount: number;
  prematureCadenceCount: number;
}

export interface IdleStats {
  totalIdleSec: number;
  totalActiveSec: number;
  idlePct: number;
  activeUptimePct: number;
  averageGapMs: number;
  totalLightAttacks: number;
  connectedLAsCount?: number; // LAs that actually landed and dealt damage
  emptyLAsCount?: number; // Empty / ghost LA casts that dealt 0 damage
  laHitRatePct?: number; // % of cast LAs that connected (connected / total)
  weavedLAsCount: number;
  standaloneLAsCount?: number;
  missedLAsCount?: number;
  laWeaveEfficiencyPct: number;
  avgWeaveDelayMs?: number;
  totalBarSwaps: number;
  barSwapCancelsCount?: number;
  isolatedUtilitiesCount?: number;
  topIdleGaps: Array<{
    fromSkill: string;
    toSkill: string;
    startSec: number;
    endSec: number;
    idleSec: number;
    reason?: string;
  }>;
}

export interface RawBuffEvent {
  timestamp: number;
  type: 'applybuff' | 'applybuffstack' | 'removebuff' | 'refreshbuff' | 'removebuffstack';
  sourceID: number;
  targetID: number;
  ability: {
    name: string;
    guid: number;
    type?: number;
    abilityIcon?: string;
  };
  stack?: number;
  fight?: number;
}

export interface RawDamageEvent {
  timestamp: number;
  type: string;
  sourceID: number;
  targetID: number;
  ability: {
    name: string;
    guid: number;
    type?: number;
    abilityIcon?: string;
  };
  amount?: number;
  castTrackID?: number;
}

export type SuboptimalBeamType = 'none' | 'under_crux' | 'interrupted' | 'under_crux_and_interrupted';

export interface CruxBeamEvent {
  beamIndex: number;
  startTs: number;
  startSec: number;
  endTs: number;
  endSec: number;
  channelDurationSec: number;
  cruxBefore: number; // 0, 1, 2, or 3
  isOptimal: boolean; // true if cruxBefore === 3 && !isInterrupted
  suboptimalType: SuboptimalBeamType;
  morphName: string; // 'Pragmatic Fatecarver' | 'Exhausting Fatecarver' | 'Fatecarver'
  expectedDurationSec: number;
  isInterrupted: boolean;
  interruptReason?: string;
  ticks: number;
  expectedTicks: number;
  lostTicks: number;
  totalDamage: number;
  estimatedDamageLost: number;
  castTrackID?: number;
}

export interface InterruptedBeamDetail {
  beamIndex: number;
  timeSec: number;
  cruxCount: number;
  actualDurationSec: number;
  expectedDurationSec: number;
  actualTicks: number;
  expectedTicks: number;
  lostTicks: number;
  estimatedDamageLost: number;
  reason: string;
  suboptimalType: 'interrupted' | 'under_crux_and_interrupted';
}

export interface CruxStats {
  totalBeams: number;
  optimalBeams: number; // 3 Crux AND completed without interruption
  optimalPct: number;
  threeCruxBeams: number;
  underCruxBeams: number; // < 3 Crux
  threeCruxPct: number;
  interruptedBeams: number;
  interruptedPct: number;
  totalBeamChannelSec: number;
  beamUptimePct: number; // % of fight spent channeling Fatecarver
  totalEstimatedDamageLost: number;
  avgDamageLostPerInterruptedBeam: number;
  avgTicksLostPerInterruptedBeam: number;
  beams: CruxBeamEvent[];
  underCruxList: Array<{
    beamIndex: number;
    timeSec: number;
    cruxCount: number;
    channelDurationSec: number;
  }>;
  interruptedList: InterruptedBeamDetail[];
}

export interface DoTUptimeStat {
  name: string;
  uptimeSec: number;
  uptimePct: number;
  ticks: number;
  casts: number;
  totalDamage: number;
  icon?: string;
}

export interface SorcStats {
  // 1. Crystal Fragments & Priority
  totalFragsCasts: number;
  procFragsCasts: number; // Instant procs (via buff 46327)
  hardcastFragsCasts: number; // Suboptimal hardcasts (0.8s cast time)
  fragProcEfficiencyPct: number; // % of frags that were instant procs
  totalFragProcsGained: number; // Total number of proc windows gained
  immediateFragProcsCount: number; // Cast immediately on next GCD (0 intervening skills)
  delayedFragProcsCount: number; // Cast with 1+ intervening skills (priority violation)
  expiredFragProcsCount: number; // Buff expired without casting Frags (wasted proc!)
  interveningSkillsDuringProcCount: number; // Total skills cast while Frag Proc was ready
  fragProcImmediateCastPct: number; // % of procs cast immediately without delay
  missedProcWindowsCount: number; // Casts of other abilities while frag proc was available

  // 2. Bound Armaments
  totalArmamentsCasts: number;
  optimalArmamentsCasts: number; // Cast at 4+ (or 8) stacks
  suboptimalArmamentsCasts: number; // Cast at < 4 stacks
  avgStacksAtCast: number;

  // 3. Status Knife (Traveling Knife / Sundering Knife with Assassin's Misery)
  totalKnifeCasts: number;
  avgKnifeIntervalSec: number;
  optimalKnifeRefreshes: number; // Refreshed ~1s before 10s CD (8.5s - 9.8s)
  droppedKnifeCount: number; // Expired > 10.5s before refresh
  prematureKnifeCount: number; // Refreshed < 8.0s

  // 4. Haunting Curse
  totalCurseCasts: number;
  avgCurseIntervalSec: number;
  recastBeforeSecondExplosionCount: number; // Recast before 2nd explosion (< 8.5s)
  optimalCurseRefreshes: number; // Recast after 2nd explosion (8.5s - 13s)

  // 5. Shattered Paths Signet & Power Overload
  hasShatteredPathsSignet: boolean;
  minUltimateValue?: number;
  ultimateBelow133Count?: number;
  timeBelow133Sec?: number;
  powerOverloadOpenedActive?: boolean;
  powerOverloadDeactivatedInTime?: boolean;

  // Diagnostic feedback details
  details: Array<{
    timeSec: number;
    description: string;
    severity: 'warning' | 'error' | 'info';
  }>;
}

export interface MagmaFistStats {
  hasMagmaFist: boolean;
  totalCasts: number;
  avgIntervalSec: number;
  optimalRefreshes: number; // 5.5s - 6.8s (keeping 3 stacks)
  earlyRefreshes: number;   // < 5.0s
  droppedRefreshes: number; // > 7.2s
  heatShockUptimePct: number; // Total uptime on main boss
  heatShockThreeStackUptimePct: number; // 3-stack uptime on main boss
}

export interface IgneousWeaponsStats {
  hasIgneousWeapons: boolean;
  totalCasts: number;
  uptimePct: number; // Major Brutality/Sorcery group buff
  prematureRecasts: number; // < 45s
  droppedWindows: number; // Expired > 60s
}

export interface WhipMiniGameStats {
  morph: 'flame_lash' | 'molten_whip' | 'none';
  totalCasts: number;
  // Flame Lash specific:
  reactionDelayMs?: number; // Time from Off-Balance onset to 1st Lash
  castsInOffBalance?: number;
  powerLashCasts?: number;
  offBalanceWindowsCount?: number;
  expiredDotsDuringLash?: Array<{
    name: string;
    expiredAtSec: number;
    whipCastSec: number;
  }>;
  priorityViolationsCount?: number; // Cast Lash while Magma Fist (<1s) or Knife dropped
  // Molten Whip specific:
  castsAtThreeStacks?: number;
  castsUnderThreeStacks?: number;
  seethingFuryThreeStackPct?: number;
}

export interface StandardStats {
  hasStandard: boolean;
  totalCasts: number;
  timeAt250PlusUltSec: number;
  phasedHoldExemptSec: number; // Combat phases where holding is valid
  penalizedHoldSec: number;
}

export interface TankDebuffStats {
  isTank: boolean;
  tauntUptimePct: number;       // Pierce Armor / Frost Clench (target: 100%)
  majorBreachUptimePct: number; // Pierce Armor / elemental (target: 100%)
  crusherUptimePct: number;     // Glyph of Crushing (target: ~80-100%)
  maimUptimePct: number;        // Minor/Major Maim
}

export interface DKStats {
  specVariant: 'tank' | 'zenkosh' | 'parse';
  magmaFist?: MagmaFistStats;
  igneousWeapons?: IgneousWeaponsStats;
  whipMiniGame?: WhipMiniGameStats;
  standard?: StandardStats;
  tankDebuffs?: TankDebuffStats;
  statusKnife?: {
    totalCasts: number;
    avgIntervalSec: number;
    optimalRefreshes: number;
    droppedRefreshes: number;
    prematureRefreshes: number;
  };
  details: Array<{
    timeSec: number;
    description: string;
    severity: 'warning' | 'error' | 'info';
  }>;
}

export interface RotationAnalysisResult {
  spec: {
    id: string;
    name: string;
    class: string;
    isRecognized?: boolean;
  };
  unrecognizedWarning?: string;
  fightMeta: {
    reportId: string;
    fightId: number;
    fightName: string;
    durationSec: number;
    startTime?: number;
    endTime?: number;
    actorId: number;
    actorName: string;
    actorDisplayName?: string;
    actorClass: string;
  };
  overallScore: number;
  overallZone: PerformanceZone;
  zoneDistribution: ZoneDistribution;
  cadenceStats: CadenceStats;
  idleStats: IdleStats;
  patternStats: PatternDistributionStat[];
  cruxStats?: CruxStats;
  sorcStats?: SorcStats;
  dkStats?: DKStats;
  dotUptimes?: DoTUptimeStat[];
  nonStandardCyclesCount: number;
  totalCycles: number;
  totalGCDCasts: number;
  timeline: TimelineDataPoint[];
  cycles: TripletCycle[];
  topFeedback: string[];
}


