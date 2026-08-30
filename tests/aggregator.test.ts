import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  calculateMinMaxKillTimes,
  extractGearCombination,
  aggregateRosterData
} from '../src/lib/esologs/aggregator';
import { ESORankingItem, FightSummaryResponse } from '../src/types/esologs';

describe('Aggregator - formatDuration', () => {
  it('formats milliseconds into human readable minutes and seconds', () => {
    expect(formatDuration(64248)).toBe('1m 04s');
    expect(formatDuration(286500)).toBe('4m 47s');
    expect(formatDuration(45000)).toBe('45s');
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('Aggregator - calculateMinMaxKillTimes', () => {
  it('calculates exact min and max durations and unique kills', () => {
    const mockRankings: ESORankingItem[] = [
      {
        name: 'Player1',
        class: 1,
        spec: 1,
        total: 1000,
        duration: 120000, // 2m
        startTime: 1000,
        reportID: 'REP1',
        fightID: 1
      },
      {
        name: 'Player2',
        class: 2,
        spec: 2,
        total: 2000,
        duration: 65000, // 1m 05s
        startTime: 1000,
        reportID: 'REP2',
        fightID: 3
      },
      {
        name: 'Player3',
        class: 3,
        spec: 3,
        total: 3000,
        duration: 210000, // 3m 30s
        startTime: 1000,
        reportID: 'REP3',
        fightID: 5
      },
      {
        name: 'Player4',
        class: 1,
        spec: 1,
        total: 4000,
        duration: 120000,
        startTime: 1000,
        reportID: 'REP1', // Same kill as Player1
        fightID: 1
      }
    ];

    const result = calculateMinMaxKillTimes(mockRankings);
    expect(result.minDuration).toBe(65000);
    expect(result.maxDuration).toBe(210000);
    expect(result.totalUniqueKills).toBe(3);
  });

  it('handles empty rankings gracefully without hallucinations', () => {
    const result = calculateMinMaxKillTimes([]);
    expect(result.minDuration).toBe(0);
    expect(result.maxDuration).toBe(0);
    expect(result.totalUniqueKills).toBe(0);
  });
});

describe('Aggregator - extractGearCombination', () => {
  it('identifies gear sets and piece counts accurately', () => {
    const mockGear = [
      { slot: 0, setName: 'Lord Warden' },
      { slot: 1, setName: 'Perfected Lucent Echoes' },
      { slot: 2, setName: 'Lord Warden' },
      { slot: 3, setName: 'Perfected Lucent Echoes' },
      { slot: 4, setName: 'Perfected Lucent Echoes' },
      { slot: 5, setName: 'Perfected Lucent Echoes' },
      { slot: 6, setName: 'Perfected Lucent Echoes' },
      { slot: 7, setName: 'Elemental Catalyst' },
      { slot: 8, setName: 'Elemental Catalyst' },
      { slot: 9, setName: 'Elemental Catalyst' },
      { slot: 10, setName: 'Elemental Catalyst' },
      { slot: 12, setName: 'Elemental Catalyst' }
    ];

    const result = extractGearCombination(mockGear);
    expect(result.identifiedSets).toContain('Perfected Lucent Echoes');
    expect(result.identifiedSets).toContain('Elemental Catalyst');
    expect(result.identifiedSets).toContain('Lord Warden');
    expect(result.setCounts['Perfected Lucent Echoes']).toBe(5);
    expect(result.setCounts['Elemental Catalyst']).toBe(5);
    expect(result.setCounts['Lord Warden']).toBe(2);
    expect(result.combinationKey).toContain('Perfected Lucent Echoes (5)');
    expect(result.combinationKey).toContain('Elemental Catalyst (5)');
    expect(result.combinationKey).toContain('Lord Warden (2)');
  });
});

describe('Aggregator - aggregateRosterData', () => {
  it('accurately compiles composition, gear combos, and skill rankings', () => {
    const mockSummaries: FightSummaryResponse[] = [
      {
        playerDetails: {
          tanks: [
            {
              name: 'TankMain',
              id: 1,
              guid: 101,
              type: 'Arcanist',
              icon: 'Arcanist',
              specs: ['Tank'],
              combatantInfo: {
                gear: [
                  { setName: 'Perfected Lucent Echoes' },
                  { setName: 'Perfected Lucent Echoes' },
                  { setName: 'Perfected Lucent Echoes' },
                  { setName: 'Perfected Lucent Echoes' },
                  { setName: 'Perfected Lucent Echoes' },
                  { setName: 'Lord Warden' },
                  { setName: 'Lord Warden' }
                ],
                talents: [
                  { name: 'Runic Jolt', guid: 111, type: 4, abilityIcon: 'icon1' },
                  { name: 'Cruxweaver Armor', guid: 112, type: 4, abilityIcon: 'icon2' }
                ]
              }
            },
            {
              name: 'TankOff',
              id: 2,
              guid: 102,
              type: 'DragonKnight',
              icon: 'DK',
              specs: ['Tank'],
              combatantInfo: {
                gear: [
                  { setName: 'Turning Tide' },
                  { setName: 'Turning Tide' },
                  { setName: 'Turning Tide' },
                  { setName: 'Turning Tide' },
                  { setName: 'Turning Tide' },
                  { setName: 'Nazaray' },
                  { setName: 'Nazaray' }
                ],
                talents: [
                  { name: 'Pierce Armor', guid: 201, type: 4, abilityIcon: 'icon3' }
                ]
              }
            }
          ],
          healers: [
            {
              name: 'HealerMain',
              id: 3,
              guid: 103,
              type: 'Warden',
              icon: 'Warden',
              specs: ['Healer'],
              combatantInfo: {
                gear: [{ setName: 'Spell Power Cure' }, { setName: 'Spell Power Cure' }],
                talents: [{ name: 'Combat Pray', guid: 301, type: 4, abilityIcon: 'icon4' }]
              }
            },
            {
              name: 'HealerOff',
              id: 4,
              guid: 104,
              type: 'Arcanist',
              icon: 'Arcanist',
              specs: ['Healer'],
              combatantInfo: {
                gear: [{ setName: 'Pillager Profit' }, { setName: 'Pillager Profit' }],
                talents: [{ name: 'Cascading Souls', guid: 302, type: 4, abilityIcon: 'icon5' }]
              }
            }
          ],
          dps: [
            {
              name: 'DPS1',
              id: 5,
              guid: 105,
              type: 'Sorcerer',
              icon: 'Sorc',
              specs: ['Stamina DPS'],
              combatantInfo: {
                gear: [{ setName: 'Ansuul' }, { setName: 'Ansuul' }],
                talents: [{ name: 'Crystal Fragments', guid: 401, type: 4, abilityIcon: 'icon6' }]
              }
            }
          ]
        }
      }
    ];

    const result = aggregateRosterData(58, mockSummaries, 60000, 180000);

    expect(result.reportsAnalyzed).toBe(1);
    expect(result.composition.tanks.classes.length).toBe(2);
    expect(result.composition.tanks.classes[0].percentage).toBe(50);
    expect(result.composition.healers.classes.length).toBe(2);
    expect(result.composition.dps.classes[0].className).toBe('Sorcerer');

    const arcanistTank = result.classRoles.find(cr => cr.classRoleKey === 'Arcanist - Tank');
    expect(arcanistTank).toBeDefined();
    expect(arcanistTank?.gearCombinations.length).toBeGreaterThan(0);
    expect(arcanistTank?.popularSkills.map(s => s.name)).toContain('Runic Jolt');
    expect(arcanistTank?.popularSkills.map(s => s.name)).toContain('Cruxweaver Armor');
  });
});
