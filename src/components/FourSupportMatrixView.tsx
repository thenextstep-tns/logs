'use client';

import React from 'react';
import { FourSupportAnalysis } from '@/types/esologs';
import {
  Shield,
  Heart,
  Flame,
  Sparkles,
  Users,
  AlertCircle,
  Tag,
  Wand2,
  PackageCheck,
  CheckCircle2
} from 'lucide-react';

interface FourSupportMatrixViewProps {
  analysis?: FourSupportAnalysis;
}

export const FourSupportMatrixView: React.FC<FourSupportMatrixViewProps> = ({
  analysis
}) => {
  if (!analysis) return null;

  const {
    filter,
    matchingLogsCount,
    totalLogsAnalyzed,
    supportGearSuggestions,
    teamLoadouts,
    recalculatedDps
  } = analysis;

  if (matchingLogsCount === 0) {
    return (
      <div className="bg-eso-card rounded-xl border border-amber-800/50 p-8 text-center space-y-3 shadow-lg">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">
          No Logs Found for This Specific 4-Support Core
        </h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          No recorded clears in this kill-time window featured <strong className="text-slate-200">{filter.tank1} &amp; {filter.tank2} Tanks</strong> paired with <strong className="text-slate-200">{filter.healer1} &amp; {filter.healer2} Healers</strong> simultaneously.
        </p>
        <p className="text-xs text-eso-gold font-mono">
          Tip: Pick one of the meta support combinations suggested above or expand the kill time duration range.
        </p>
      </div>
    );
  }

  const renderSlotCard = (
    title: string,
    role: 'tank' | 'healer',
    data: { className: string; popularCombos: any[]; topSets: any[] },
    icon: React.ReactNode,
    borderClass: string
  ) => {
    const topCombo = data.popularCombos.length > 0 ? data.popularCombos[0] : null;

    return (
      <div className={`bg-eso-card rounded-xl border ${borderClass} p-4 shadow-lg flex flex-col justify-between space-y-4`}>
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-eso-border/60 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-eso-dark border border-eso-border">
                {icon}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {title}
                </span>
                <h4 className="text-sm font-bold text-white">{data.className}</h4>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-eso-dark border border-eso-border text-slate-300">
              {role === 'tank' ? 'Tank' : 'Healer'}
            </span>
          </div>

          {/* Top Suggested Combination */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-eso-gold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Suggested Gear Combination:</span>
            </div>

            {topCombo ? (
              <div className="bg-eso-dark/80 p-3 rounded-lg border border-eso-gold/30 space-y-2">
                <div className="text-xs font-bold text-slate-100">
                  {topCombo.combinationKey}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Worn by {topCombo.count} of {matchingLogsCount} players</span>
                  <span className="font-bold text-eso-goldLight bg-eso-card px-1.5 py-0.2 rounded border border-eso-border">
                    {topCombo.percentage}% Pick Rate
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No gear recorded.</p>
            )}
          </div>

          {/* Top Individual Sets in this Support Core */}
          <div className="space-y-1.5 pt-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Top Sets Equipped:
            </span>
            <div className="flex flex-wrap gap-1">
              {data.topSets.slice(0, 3).map((s, sIdx) => (
                <span
                  key={sIdx}
                  className="text-[10px] px-2 py-0.5 rounded bg-eso-dark text-slate-300 border border-eso-border flex items-center gap-1"
                >
                  <Tag className="w-2.5 h-2.5 text-eso-gold" />
                  {s.setName} ({s.percentage}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 4-Support Synergistic Gear Board */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-eso-gold" />
            <h3 className="text-lg font-bold text-white">
              Suggested Gear for All 4 Support Players
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-eso-card px-2.5 py-1 rounded border border-eso-border">
            Matching <strong className="text-white">{matchingLogsCount}</strong> of {totalLogsAnalyzed} clears (
            {((matchingLogsCount / totalLogsAnalyzed) * 100).toFixed(1)}%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tank 1 */}
          {renderSlotCard(
            'Tank 1',
            'tank',
            supportGearSuggestions.tank1,
            <Shield className="w-4 h-4 text-eso-tank" />,
            'border-eso-tank/40'
          )}

          {/* Tank 2 */}
          {renderSlotCard(
            'Tank 2',
            'tank',
            supportGearSuggestions.tank2,
            <Shield className="w-4 h-4 text-eso-tank" />,
            'border-eso-tank/40'
          )}

          {/* Healer 1 */}
          {renderSlotCard(
            'Healer 1',
            'healer',
            supportGearSuggestions.healer1,
            <Heart className="w-4 h-4 text-eso-healer" />,
            'border-eso-healer/40'
          )}

          {/* Healer 2 */}
          {renderSlotCard(
            'Healer 2',
            'healer',
            supportGearSuggestions.healer2,
            <Heart className="w-4 h-4 text-eso-healer" />,
            'border-eso-healer/40'
          )}
        </div>
      </div>

      {/* Recalculated Damage Dealer Composition */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-eso-dps" />
            <h3 className="text-lg font-bold text-white">
              Recalculated Damage Dealers for this 4-Support Core
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-eso-card px-2.5 py-1 rounded border border-eso-border">
            {recalculatedDps.totalSlots} DD Slots Analyzed (~{recalculatedDps.averagePerRaid} DDs/raid)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DD Class Popularity Breakdown */}
          <div className="bg-eso-card rounded-xl border border-eso-dps/40 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-eso-border/60">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                DD Class Breakdown
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                In this Support Setup
              </span>
            </div>

            <div className="space-y-3">
              {recalculatedDps.classes.length > 0 ? (
                recalculatedDps.classes.map((cls) => (
                  <div key={cls.className} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">
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
                    <div className="w-full h-2 bg-eso-dark rounded-full overflow-hidden border border-eso-border/40">
                      <div
                        className="h-full bg-eso-dps rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(cls.percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No DD classes recorded.</p>
              )}
            </div>
          </div>

          {/* DD Top Gear Combinations in this Support Core */}
          <div className="lg:col-span-2 bg-eso-card rounded-xl border border-eso-border p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-eso-border/60">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-eso-gold" />
                <span>Top DD Gear Combinations with this Support Setup</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Ranked by popularity
              </span>
            </div>

            <div className="space-y-2.5">
              {recalculatedDps.popularCombos.length > 0 ? (
                recalculatedDps.popularCombos.slice(0, 4).map((combo, idx) => (
                  <div
                    key={idx}
                    className="bg-eso-dark/70 rounded-lg border border-eso-border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-eso-card border border-eso-border flex items-center justify-center font-mono font-bold text-eso-gold text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-100">{combo.combinationKey}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400 text-[11px]">{combo.count} players</span>
                      <span className="font-bold text-eso-goldLight bg-eso-card px-2 py-0.5 rounded border border-eso-border">
                        {combo.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No DD gear combinations recorded.</p>
              )}
            </div>

            {/* Top DD Skills */}
            {recalculatedDps.popularSkills.length > 0 && (
              <div className="pt-2 border-t border-eso-border/40">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Key Damage Abilities Logged:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recalculatedDps.popularSkills.slice(0, 6).map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[11px] px-2.5 py-1 rounded bg-eso-dark text-slate-200 border border-eso-border flex items-center gap-1.5"
                    >
                      <Wand2 className="w-3 h-3 text-eso-gold" />
                      <span>{skill.name}</span>
                      <span className="font-mono text-eso-gold font-bold">
                        {skill.percentage}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
