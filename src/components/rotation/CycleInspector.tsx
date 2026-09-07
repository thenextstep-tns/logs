'use client';

import React, { useState } from 'react';
import { TripletCycle, PerformanceZone } from '@/types/rotation';
import { formatTimeSec } from '@/lib/rotation/analyzer';
import { Zap, Clock, ArrowRightLeft } from 'lucide-react';

interface CycleInspectorProps {
  cycles: TripletCycle[];
  selectedCycleIndex?: number | null;
  onSelectCycle?: (cycleIndex: number) => void;
}

export const CycleInspector: React.FC<CycleInspectorProps> = ({
  cycles,
  selectedCycleIndex,
  onSelectCycle
}) => {
  const [filterZone, setFilterZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCycles = cycles.filter(c => {
    if (filterZone !== 'all') {
      if (filterZone === 'red_all') {
        if (c.zone !== 'red' && c.zone !== 'darkRed') return false;
      } else if (c.zone !== filterZone) {
        return false;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchPattern = c.matchedPatternName.toLowerCase().includes(q);
      const matchSkills = c.casts.some(cast => cast.abilityName.toLowerCase().includes(q));
      if (!matchPattern && !matchSkills) return false;
    }

    return true;
  });

  const getZoneBadge = (zone: PerformanceZone) => {
    switch (zone) {
      case 'green':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'yellow':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'orange':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'red':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'darkRed':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/50';
    }
  };

  const getClassificationBadge = (cat: string) => {
    switch (cat) {
      case 'BB':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'Siphon':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'Dot':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'Skull':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'Ult':
        return 'bg-yellow-500/30 text-yellow-200 border-yellow-400/80';
      case 'Mechanic':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-eso-card border border-eso-border rounded-xl p-5 shadow-lg space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-eso-border/60 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Cycle Log
          </h3>
          <span className="text-xs font-mono text-slate-400">
            ({filteredCycles.length} / {cycles.length})
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setFilterZone('all')}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              filterZone === 'all'
                ? 'bg-eso-gold text-slate-950 border-eso-gold'
                : 'bg-eso-dark border-eso-border text-slate-300 hover:border-slate-600'
            }`}
          >
            All ({cycles.length})
          </button>
          <button
            onClick={() => setFilterZone('green')}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              filterZone === 'green'
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500'
                : 'bg-eso-dark border-eso-border text-slate-300 hover:border-slate-600'
            }`}
          >
            90-100% ({cycles.filter(c => c.zone === 'green').length})
          </button>
          <button
            onClick={() => setFilterZone('yellow')}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              filterZone === 'yellow'
                ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500'
                : 'bg-eso-dark border-eso-border text-slate-300 hover:border-slate-600'
            }`}
          >
            75-90% ({cycles.filter(c => c.zone === 'yellow').length})
          </button>
          <button
            onClick={() => setFilterZone('orange')}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              filterZone === 'orange'
                ? 'bg-orange-500/30 text-orange-300 border-orange-500'
                : 'bg-eso-dark border-eso-border text-slate-300 hover:border-slate-600'
            }`}
          >
            50-75% ({cycles.filter(c => c.zone === 'orange').length})
          </button>
          <button
            onClick={() => setFilterZone('red_all')}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              filterZone === 'red_all'
                ? 'bg-red-500/30 text-red-300 border-red-500'
                : 'bg-eso-dark border-eso-border text-slate-300 hover:border-slate-600'
            }`}
          >
            &lt;50% ({cycles.filter(c => c.zone === 'red' || c.zone === 'darkRed').length})
          </button>
        </div>
      </div>

      {/* Cycle List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filteredCycles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No cycles match filter.
          </div>
        ) : (
          filteredCycles.map(cycle => {
            const isSelected = selectedCycleIndex === cycle.cycleIndex;

            return (
              <div
                key={cycle.cycleIndex}
                onClick={() => onSelectCycle?.(cycle.cycleIndex)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-eso-dark border-eso-gold ring-1 ring-eso-gold/40 shadow-lg'
                    : 'bg-eso-dark/70 border-eso-border/70 hover:border-eso-border hover:bg-eso-dark/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      #{cycle.cycleIndex}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ⏱ {formatTimeSec(cycle.startSec)}–{formatTimeSec(cycle.endSec)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${getZoneBadge(cycle.zone)}`}
                    >
                      {cycle.cycleScore}%
                    </span>

                    {/* Idle Time Badge */}
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        cycle.idleTimeSec <= 0.8
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                          : cycle.idleTimeSec <= 2.0
                          ? 'bg-yellow-950/40 text-yellow-400 border-yellow-500/30'
                          : 'bg-orange-950/40 text-orange-400 border-orange-500/30'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {cycle.idleTimeSec}s idle
                    </span>

                    {/* LA Weave Badge */}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-slate-900 border-slate-700 text-slate-300 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-yellow-400" />
                      LA {cycle.laWeaveCount}/{cycle.casts.length}
                    </span>
                  </div>

                  {/* Cadence & Pattern */}
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded border ${
                        cycle.cadenceCount === 3
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                          : cycle.cadenceCount === 4
                          ? 'bg-yellow-950/40 text-yellow-400 border-yellow-500/30'
                          : 'bg-orange-950/40 text-orange-400 border-orange-500/30'
                      }`}
                    >
                      {cycle.cadenceCount} casts {cycle.cadenceCount !== 3 && `(+${cycle.cadenceCount - 3})`}
                    </span>
                    <span className="text-xs font-semibold text-white font-sans">
                      {cycle.matchedPatternName}
                    </span>
                  </div>
                </div>

                {/* Casts Sequence Pills */}
                <div className="flex flex-wrap items-center gap-1.5 my-1.5">
                  {cycle.casts.map((cast, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <div className="flex items-center gap-1 bg-slate-900/90 rounded border border-slate-700/80 p-0.5 px-1">
                        {cast.hasPrecedingLA ? (
                          <span className="px-1 py-0.2 rounded bg-yellow-950/80 text-yellow-400 text-[9px] font-mono font-bold border border-yellow-600/40">
                            LA
                          </span>
                        ) : (
                          <span className="px-1 py-0.2 rounded bg-slate-800/80 text-slate-500 text-[9px] font-mono font-bold">
                            --
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border font-medium ${getClassificationBadge(
                            cast.classification
                          )}`}
                        >
                          {cast.abilityName}
                        </span>

                        {cast.followedByBarSwap && (
                          <span className="px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 text-[9px] font-mono font-bold border border-cyan-600/40 flex items-center gap-0.5">
                            <ArrowRightLeft className="w-2.5 h-2.5" />
                            Swap
                          </span>
                        )}
                      </div>

                      {idx < cycle.casts.length - 1 && (
                        <span className="text-slate-500 text-xs font-bold">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
