'use client';

import React from 'react';
import { PatternDistributionStat } from '@/types/rotation';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface PatternDistributionProps {
  patterns: PatternDistributionStat[];
  totalCycles: number;
  nonStandardCount: number;
}

export const PatternDistribution: React.FC<PatternDistributionProps> = ({
  patterns,
  totalCycles,
  nonStandardCount
}) => {
  const nonStandardPct = totalCycles > 0 ? Math.round((nonStandardCount / totalCycles) * 100) : 0;
  const validCyclesCount = totalCycles - nonStandardCount;
  const validCyclesPct = totalCycles > 0 ? Math.round((validCyclesCount / totalCycles) * 100) : 100;

  return (
    <div className="bg-eso-card border border-eso-border rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-eso-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Pattern Distribution
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            {validCyclesPct}% Adherence
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Cycles: <span className="text-eso-goldLight font-bold">{totalCycles}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {patterns.map(p => (
          <div
            key={p.id}
            className="bg-eso-dark/70 border border-eso-border/80 rounded-lg p-3 space-y-2 hover:border-eso-gold/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-xs text-white">
                  {p.name}
                </span>
              </div>
              <span className="text-xs font-mono text-eso-goldLight font-bold">
                {p.observedCount} ({p.observedPct}%)
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${Math.min(100, p.observedPct)}%` }}
              />
            </div>
          </div>
        ))}

        {/* Non-standard cycles */}
        {nonStandardCount > 0 && (
          <div className="bg-eso-dark/70 border border-orange-500/30 rounded-lg p-3 space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-orange-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                Other / Non-Standard
              </span>
              <span className="text-xs font-mono text-orange-300 font-bold">
                {nonStandardCount} ({nonStandardPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${Math.min(100, nonStandardPct)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
