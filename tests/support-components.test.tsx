import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SupportCoreSelector } from '../src/components/SupportCoreSelector';
import { FourSupportMatrixView } from '../src/components/FourSupportMatrixView';
import { AvailableSupportCombo, FourSupportAnalysis } from '../src/types/esologs';

describe('SupportCoreSelector Component', () => {
  const mockCombos: AvailableSupportCombo[] = [
    {
      tank1: 'Sorcerer',
      tank2: 'DragonKnight',
      healer1: 'Arcanist',
      healer2: 'Warden',
      comboLabel: 'Sorcerer & DragonKnight Tanks + Arcanist & Warden Healers',
      count: 14,
      percentage: 63.6
    }
  ];

  it('renders 4 support selectors and preset meta buttons', () => {
    const onApply = vi.fn();
    render(
      <SupportCoreSelector
        availableCombos={mockCombos}
        onApplySupportFilter={onApply}
        isLoading={false}
      />
    );

    expect(screen.getByText(/Select 2 Tanks & 2 Healers/i)).toBeInTheDocument();
    expect(screen.getByText(/Tank 1 Class/i)).toBeInTheDocument();
    expect(screen.getByText(/Tank 2 Class/i)).toBeInTheDocument();
    expect(screen.getByText(/Healer 1 Class/i)).toBeInTheDocument();
    expect(screen.getByText(/Healer 2 Class/i)).toBeInTheDocument();
    expect(screen.getByText(/14 logs/i)).toBeInTheDocument();
  });

  it('calls onApplySupportFilter when clicking the apply button', () => {
    const onApply = vi.fn();
    render(
      <SupportCoreSelector
        availableCombos={mockCombos}
        onApplySupportFilter={onApply}
        isLoading={false}
      />
    );

    const applyBtn = screen.getByRole('button', { name: /Apply 4-Support Filter/i });
    fireEvent.click(applyBtn);
    expect(onApply).toHaveBeenCalled();
  });
});

describe('FourSupportMatrixView Component', () => {
  const mockAnalysis: FourSupportAnalysis = {
    filter: {
      tank1: 'Sorcerer',
      tank2: 'DragonKnight',
      healer1: 'Arcanist',
      healer2: 'Warden'
    },
    matchingLogsCount: 14,
    totalLogsAnalyzed: 22,
    availableCombos: [],
    supportGearSuggestions: {
      tank1: {
        className: 'Sorcerer',
        popularCombos: [
          {
            combinationKey: 'Perfected Lucent Echoes (5) + Elemental Catalyst (5) + Lord Warden (2)',
            sets: ['Perfected Lucent Echoes', 'Elemental Catalyst', 'Lord Warden'],
            count: 12,
            percentage: 85.7,
            samplePlayers: ['TankSorc']
          }
        ],
        topSets: [{ setName: 'Perfected Lucent Echoes', count: 12, percentage: 85.7 }]
      },
      tank2: {
        className: 'DragonKnight',
        popularCombos: [
          {
            combinationKey: 'Turning Tide (5) + Nazaray (2) + Pearlescent Ward (5)',
            sets: ['Turning Tide', 'Nazaray', 'Pearlescent Ward'],
            count: 10,
            percentage: 71.4,
            samplePlayers: ['TankDK']
          }
        ],
        topSets: [{ setName: 'Turning Tide', count: 10, percentage: 71.4 }]
      },
      healer1: {
        className: 'Arcanist',
        popularCombos: [
          {
            combinationKey: 'Spell Power Cure (5) + Pillager Profit (5) + Symphony of Blades (2)',
            sets: ['Spell Power Cure', 'Pillager Profit', 'Symphony of Blades'],
            count: 11,
            percentage: 78.6,
            samplePlayers: ['HealerArc']
          }
        ],
        topSets: [{ setName: 'Spell Power Cure', count: 11, percentage: 78.6 }]
      },
      healer2: {
        className: 'Warden',
        popularCombos: [
          {
            combinationKey: 'Roaring Opportunist (5) + Jorvuld Guidance (5) + Spaulder of Ruin (1)',
            sets: ['Roaring Opportunist', 'Jorvuld Guidance', 'Spaulder of Ruin'],
            count: 9,
            percentage: 64.3,
            samplePlayers: ['HealerWarden']
          }
        ],
        topSets: [{ setName: 'Roaring Opportunist', count: 9, percentage: 64.3 }]
      }
    },
    teamLoadouts: [],
    recalculatedDps: {
      totalSlots: 112,
      averagePerRaid: 8,
      classes: [
        { className: 'Necromancer', count: 80, percentage: 71.4, averagePerRaid: 5.7 },
        { className: 'DragonKnight', count: 32, percentage: 28.6, averagePerRaid: 2.3 }
      ],
      popularCombos: [
        {
          combinationKey: 'Corpseburster (5) + Azureblight Reaper (5) + Slimecraw (1)',
          sets: ['Corpseburster', 'Azureblight Reaper', 'Slimecraw'],
          count: 60,
          percentage: 53.6,
          samplePlayers: ['DPS1']
        }
      ],
      popularSkills: [{ name: 'Blighted Blastbones', guid: 11, abilityIcon: 'icon', count: 80, percentage: 71.4 }]
    }
  };

  it('renders all 4 support gear suggestion cards and recalculated DD section', () => {
    render(<FourSupportMatrixView analysis={mockAnalysis} />);

    expect(screen.getByText(/Suggested Gear for All 4 Support Players/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Perfected Lucent Echoes/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Turning Tide/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Spell Power Cure/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Roaring Opportunist/i)[0]).toBeInTheDocument();

    expect(screen.getByText(/Recalculated Damage Dealers for this 4-Support Core/i)).toBeInTheDocument();
    expect(screen.getByText(/112 DD Slots Analyzed/i)).toBeInTheDocument();
    expect(screen.getByText('Necromancer')).toBeInTheDocument();
    expect(screen.getAllByText(/71.4%/i).length).toBeGreaterThan(0);
  });
});
