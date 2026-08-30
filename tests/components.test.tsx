import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrialCard } from '../src/components/TrialCard';
import { KillTimeSlider } from '../src/components/KillTimeSlider';
import { CompositionSummary } from '../src/components/CompositionSummary';
import { ESOZone, AggregatedRosterData } from '../src/types/esologs';

describe('TrialCard Component', () => {
  const mockZone: ESOZone = {
    id: 18,
    name: 'Lucent Citadel',
    encounters: [
      { id: 58, name: 'Count Ryelaz and Zilyesset' },
      { id: 59, name: 'Cavot Agnan' },
      { id: 60, name: 'Orphic Shattered Shard' }
    ]
  };

  it('renders zone name, zone ID, and all bosses with unique boss IDs', () => {
    render(<TrialCard zone={mockZone} />);

    expect(screen.getByText('Lucent Citadel')).toBeInTheDocument();
    expect(screen.getByText(/Zone 18/i)).toBeInTheDocument();
    expect(screen.getByText('Count Ryelaz and Zilyesset')).toBeInTheDocument();
    expect(screen.getByText('ID: 58')).toBeInTheDocument();
    expect(screen.getByText('Cavot Agnan')).toBeInTheDocument();
    expect(screen.getByText('ID: 59')).toBeInTheDocument();
  });
});

describe('KillTimeSlider Component', () => {
  const mockReports = [
    { duration: 60000 },
    { duration: 120000 },
    { duration: 180000 }
  ];

  it('renders total reports, min and max kill times', () => {
    const onApply = vi.fn();
    render(
      <KillTimeSlider
        totalReports={3}
        totalUniqueKills={3}
        minDuration={60000}
        maxDuration={180000}
        reports={mockReports}
        onApplyFilter={onApply}
        isLoading={false}
      />
    );

    expect(screen.getByText('3 reports')).toBeInTheDocument();
    expect(screen.getByText('1m 00s')).toBeInTheDocument();
    expect(screen.getByText('3m 00s')).toBeInTheDocument();
  });

  it('triggers onApplyFilter with selected constraints when clicking compute', () => {
    const onApply = vi.fn();
    render(
      <KillTimeSlider
        totalReports={3}
        totalUniqueKills={3}
        minDuration={60000}
        maxDuration={180000}
        reports={mockReports}
        onApplyFilter={onApply}
        isLoading={false}
      />
    );

    const button = screen.getByRole('button', { name: /Compute Roster Analytics/i });
    fireEvent.click(button);
    expect(onApply).toHaveBeenCalledWith(60000, 180000);
  });
});

describe('CompositionSummary Component', () => {
  const mockComposition: AggregatedRosterData['composition'] = {
    tanks: {
      role: 'tanks',
      totalRoleSlots: 2,
      classes: [
        { className: 'Arcanist', count: 1, percentage: 50, averagePerRaid: 1 },
        { className: 'DragonKnight', count: 1, percentage: 50, averagePerRaid: 1 }
      ]
    },
    healers: {
      role: 'healers',
      totalRoleSlots: 2,
      classes: [
        { className: 'Warden', count: 2, percentage: 100, averagePerRaid: 2 }
      ]
    },
    dps: {
      role: 'dps',
      totalRoleSlots: 8,
      classes: [
        { className: 'Necromancer', count: 8, percentage: 100, averagePerRaid: 8 }
      ]
    }
  };

  it('renders role cards with class percentages and slot averages', () => {
    render(<CompositionSummary composition={mockComposition} reportsAnalyzed={1} />);

    expect(screen.getByRole('heading', { name: 'Tanks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Healers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Damage Dealers' })).toBeInTheDocument();
    expect(screen.getByText('Arcanist')).toBeInTheDocument();
    expect(screen.getByText('Warden')).toBeInTheDocument();
    expect(screen.getByText('Necromancer')).toBeInTheDocument();
  });
});
