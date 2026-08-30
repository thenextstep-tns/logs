'use client';

import React from 'react';
import { GearCombination, GearSetStat } from '@/types/esologs';
import { ShieldCheck, PackageCheck, Sparkles, User, Tag } from 'lucide-react';

interface GearCombinationsViewProps {
  classRoleKey: string;
  sampleCount: number;
  gearCombinations: GearCombination[];
  popularSets: GearSetStat[];
}

export const GearCombinationsView: React.FC<GearCombinationsViewProps> = ({
  classRoleKey,
  sampleCount,
  gearCombinations,
  popularSets
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Full Build Combinations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-eso-gold" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Statistically Most Popular Full Gear Combinations
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Based on {sampleCount} player loadouts
          </span>
        </div>

        <div className="space-y-3">
          {gearCombinations.length > 0 ? (
            gearCombinations.slice(0, 10).map((combo, idx) => (
              <div
                key={idx}
                className="bg-eso-dark/70 rounded-xl border border-eso-border/80 hover:border-eso-gold/40 p-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-eso-card border border-eso-border flex items-center justify-center text-xs font-mono font-bold text-eso-gold">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-100 text-sm sm:text-base">
                      {combo.combinationKey}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs text-slate-400">
                      {combo.count} of {sampleCount} players
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-eso-card border border-eso-gold/30 text-eso-goldLight">
                      {combo.percentage}%
                    </span>
                  </div>
                </div>

                {/* Tags for individual components */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {combo.sets.map((set, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[11px] px-2 py-0.5 rounded bg-eso-card/90 text-slate-300 border border-eso-border flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5 text-eso-gold" />
                      {set}
                    </span>
                  ))}
                </div>

                {/* Sample Players */}
                {combo.samplePlayers && combo.samplePlayers.length > 0 && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1.5 border-t border-eso-border/30">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>Logged in clears by:</span>
                    <span className="font-mono text-slate-300">
                      {combo.samplePlayers.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic py-3 text-center">
              No gear combination data available.
            </p>
          )}
        </div>
      </div>

      {/* 2. Individual Set Pick Rates */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Individual Gear Set Pick Rates
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {popularSets.slice(0, 9).map((set, idx) => (
            <div
              key={idx}
              className="bg-eso-dark/50 rounded-lg border border-eso-border p-2.5 flex items-center justify-between text-xs"
            >
              <span className="font-medium text-slate-200 truncate pr-2">
                {set.setName}
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-slate-400 text-[10px]">({set.count})</span>
                <span className="font-bold text-sky-300 bg-eso-card px-1.5 py-0.5 rounded border border-eso-border">
                  {set.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
