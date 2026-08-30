import { describe, it, expect } from 'vitest';
import {
  extractAvailableSupportCombos,
  filterSummariesBySupport,
  computeFourSupportAnalysis,
  aggregateRosterData
} from '../src/lib/esologs/aggregator';
import { FightSummaryResponse } from '../src/types/esologs';

describe('4-Support Core Analysis & Recalculation', () => {
  const mockSummaries: FightSummaryResponse[] = [
    // Log 1: Sorc Tank + DK Tank, Arcanist Healer + Warden Healer, 8 Necro DPS
    {
      playerDetails: {
        tanks: [
          {
            name: 'TankSorc',
            id: 1,
            guid: 1,
            type: 'Sorcerer',
            icon: 'Sorc',
            specs: ['Tank'],
            combatantInfo: {
              gear: [
                { setName: 'Perfected Lucent Echoes' },
                { setName: 'Elemental Catalyst' },
                { setName: 'Lord Warden' }
              ]
            }
          },
          {
            name: 'TankDK',
            id: 2,
            guid: 2,
            type: 'DragonKnight',
            icon: 'DK',
            specs: ['Tank'],
            combatantInfo: {
              gear: [
                { setName: 'Turning Tide' },
                { setName: 'Nazaray' },
                { setName: 'Pearlescent Ward' }
              ]
            }
          }
        ],
        healers: [
          {
            name: 'HealerArc',
            id: 3,
            guid: 3,
            type: 'Arcanist',
            icon: 'Arc',
            specs: ['Healer'],
            combatantInfo: {
              gear: [
                { setName: 'Spell Power Cure' },
                { setName: 'Pillager Profit' },
                { setName: 'Symphony of Blades' }
              ]
            }
          },
          {
            name: 'HealerWarden',
            id: 4,
            guid: 4,
            type: 'Warden',
            icon: 'Warden',
            specs: ['Healer'],
            combatantInfo: {
              gear: [
                { setName: 'Roaring Opportunist' },
                { setName: 'Jorvuld Guidance' },
                { setName: 'Spaulder of Ruin' }
              ]
            }
          }
        ],
        dps: [
          {
            name: 'DPS1',
            id: 5,
            guid: 5,
            type: 'Necromancer',
            icon: 'Necro',
            specs: ['Stamina DPS'],
            combatantInfo: {
              gear: [{ setName: 'Corpseburster' }, { setName: 'Azureblight Reaper' }],
              talents: [{ name: 'Blighted Blastbones', guid: 11, type: 4, abilityIcon: 'icon1' }]
            }
          },
          {
            name: 'DPS2',
            id: 6,
            guid: 6,
            type: 'Necromancer',
            icon: 'Necro',
            specs: ['Stamina DPS'],
            combatantInfo: {
              gear: [{ setName: 'Corpseburster' }, { setName: 'Azureblight Reaper' }],
              talents: [{ name: 'Blighted Blastbones', guid: 11, type: 4, abilityIcon: 'icon1' }]
            }
          }
        ]
      }
    },
    // Log 2: Warden Tank + NB Tank, Templar Healer + Warden Healer, 2 Arcanist DPS
    {
      playerDetails: {
        tanks: [
          {
            name: 'TankWarden',
            id: 7,
            guid: 7,
            type: 'Warden',
            icon: 'Warden',
            specs: ['Tank'],
            combatantInfo: { gear: [{ setName: 'Pearlescent Ward' }] }
          },
          {
            name: 'TankNB',
            id: 8,
            guid: 8,
            type: 'Nightblade',
            icon: 'NB',
            specs: ['Tank'],
            combatantInfo: { gear: [{ setName: 'Turning Tide' }] }
          }
        ],
        healers: [
          {
            name: 'HealerTemplar',
            id: 9,
            guid: 9,
            type: 'Templar',
            icon: 'Templar',
            specs: ['Healer'],
            combatantInfo: { gear: [{ setName: 'Spell Power Cure' }] }
          },
          {
            name: 'HealerWarden2',
            id: 10,
            guid: 10,
            type: 'Warden',
            icon: 'Warden',
            specs: ['Healer'],
            combatantInfo: { gear: [{ setName: 'Pillager Profit' }] }
          }
        ],
        dps: [
          {
            name: 'DPS3',
            id: 11,
            guid: 11,
            type: 'Arcanist',
            icon: 'Arc',
            specs: ['Stamina DPS'],
            combatantInfo: {
              gear: [{ setName: 'Deadly Strike' }, { setName: 'Coral Riptide' }],
              talents: [{ name: 'Fatecarver', guid: 22, type: 4, abilityIcon: 'icon2' }]
            }
          }
        ]
      }
    }
  ];

  it('extracts all available 4-support combinations from logs', () => {
    const available = extractAvailableSupportCombos(mockSummaries);
    expect(available.length).toBe(2);
    expect(available[0].tank1).toBeDefined();
    expect(available[0].healer1).toBeDefined();
    expect(available[0].count).toBe(1);
  });

  it('filters logs accurately for specific 4 support classes regardless of order', () => {
    // Filter matching Log 1 (Sorc + DK tanks, Arcanist + Warden healers)
    const matching = filterSummariesBySupport(mockSummaries, {
      tank1: 'DragonKnight', // inverted order
      tank2: 'Sorcerer',
      healer1: 'Warden', // inverted order
      healer2: 'Arcanist'
    });

    expect(matching.length).toBe(1);
    expect(matching[0].playerDetails?.tanks?.[0].type).toBe('Sorcerer');
  });

  it('computes 4-player gear loadout suggestions and recalculates DD composition', () => {
    const analysis = computeFourSupportAnalysis(mockSummaries, {
      tank1: 'Sorcerer',
      tank2: 'DragonKnight',
      healer1: 'Arcanist',
      healer2: 'Warden'
    });

    expect(analysis.matchingLogsCount).toBe(1);
    expect(analysis.totalLogsAnalyzed).toBe(2);

    // Check 4 individual support gear suggestions
    expect(analysis.supportGearSuggestions.tank1.popularCombos[0].combinationKey).toContain('Perfected Lucent Echoes');
    expect(analysis.supportGearSuggestions.tank2.popularCombos[0].combinationKey).toContain('Turning Tide');
    expect(analysis.supportGearSuggestions.healer1.popularCombos[0].combinationKey).toContain('Spell Power Cure');
    expect(analysis.supportGearSuggestions.healer2.popularCombos[0].combinationKey).toContain('Roaring Opportunist');

    // Check recalculated DDs: In Log 1, 100% of DDs are Necromancer
    expect(analysis.recalculatedDps.totalSlots).toBe(2);
    expect(analysis.recalculatedDps.classes[0].className).toBe('Necromancer');
    expect(analysis.recalculatedDps.classes[0].percentage).toBe(100);
    expect(analysis.recalculatedDps.popularSkills[0].name).toBe('Blighted Blastbones');
  });

  it('handles 0 matching logs gracefully with zero hallucinations', () => {
    const analysis = computeFourSupportAnalysis(mockSummaries, {
      tank1: 'Templar',
      tank2: 'Templar',
      healer1: 'Nightblade',
      healer2: 'Nightblade'
    });

    expect(analysis.matchingLogsCount).toBe(0);
    expect(analysis.recalculatedDps.totalSlots).toBe(0);
    expect(analysis.teamLoadouts.length).toBe(0);
    expect(analysis.availableCombos.length).toBe(2);
  });
});
