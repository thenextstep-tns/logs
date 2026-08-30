'use client';

import React from 'react';
import { AggregatedRosterData, RoleCompositionStats } from '@/types/esologs';
import { Shield, Heart, Flame, Users, Info } from 'lucide-react';

interface CompositionSummaryProps {
  composition: AggregatedRosterData['composition'];
  reportsAnalyzed: number;
}

const CLASS_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Arcanist: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', bar: 'bg-emerald-500' },
  DragonKnight: { bg: 'bg-orange-950/60', text: 'text-orange-300', bar: 'bg-orange-500' },
  Necromancer: { bg: 'bg-cyan-950/60', text: 'text-cyan-300', bar: 'bg-cyan-500' },
  Nightblade: { bg: 'bg-red-950/60', text: 'text-red-300', bar: 'bg-red-500' },
  Sorcerer: { bg: 'bg-purple-950/60', text: 'text-purple-300', bar: 'bg-purple-500' },
  Templar: { bg: 'bg-amber-950/60', text: 'text-amber-300', bar: 'bg-amber-500' },
  Warden: { bg: 'bg-teal-950/60', text: 'text-teal-300', bar: 'bg-teal-500' },
};

function getClassTheme(className: string) {
  return CLASS_COLORS[className] || { bg: 'bg-slate-800', text: 'text-slate-200', bar: 'bg-slate-500' };
}

export const CompositionSummary: React.FC<CompositionSummaryProps> = ({
  composition,
  reportsAnalyzed
}) => {
  const renderRoleCard = (
    title: string,
    roleStats: RoleCompositionStats,
    icon: React.ReactNode,
    accentBorder: string,
    roleTag: string
  ) => {
    return (
      <div className={`bg-eso-card rounded-xl border ${accentBorder} p-5 shadow-lg flex flex-col justify-between`}>
        <div>
          {/* Card Title */}
          <div className="flex items-center justify-between pb-3 border-b border-eso-border/60 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-eso-dark border border-eso-border">
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{title}</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {roleStats.totalRoleSlots} slots sampled ({reportsAnalyzed > 0 ? (roleStats.totalRoleSlots / reportsAnalyzed).toFixed(1) : 0}/raid)
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-eso-dark border border-eso-border text-slate-300">
              {roleTag}
            </span>
          </div>

          {/* Class List & Progress Bars */}
          <div className="space-y-3">
            {roleStats.classes.length > 0 ? (
              roleStats.classes.map((cls) => {
                const theme = getClassTheme(cls.className);
                return (
                  <div key={cls.className} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-semibold ${theme.text}`}>
                        {cls.className}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400 text-[11px]">
                          ~{cls.averagePerRaid} / raid
                        </span>
                        <span className="font-bold text-white bg-eso-dark px-1.5 py-0.5 rounded border border-eso-border">
                          {cls.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="w-full h-2 bg-eso-dark rounded-full overflow-hidden border border-eso-border/40">
                      <div
                        className={`h-full ${theme.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(cls.percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No class data recorded for this role.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-eso-gold" />
          <h2 className="text-xl font-bold text-white">
            1. Group Composition Popularity
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-eso-card px-2.5 py-1 rounded border border-eso-border">
          {reportsAnalyzed} Full Fights Analyzed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tanks */}
        {renderRoleCard(
          'Tanks',
          composition.tanks,
          <Shield className="w-5 h-5 text-eso-tank" />,
          'border-eso-tank/40',
          'Tanks'
        )}

        {/* Healers */}
        {renderRoleCard(
          'Healers',
          composition.healers,
          <Heart className="w-5 h-5 text-eso-healer" />,
          'border-eso-healer/40',
          'Healers'
        )}

        {/* Damage Dealers */}
        {renderRoleCard(
          'Damage Dealers',
          composition.dps,
          <Flame className="w-5 h-5 text-eso-dps" />,
          'border-eso-dps/40',
          'Damage Dealers'
        )}
      </div>
    </div>
  );
};
