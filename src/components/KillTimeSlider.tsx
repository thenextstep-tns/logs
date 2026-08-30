'use client';

import React, { useState, useEffect } from 'react';
import { formatDuration } from '@/lib/esologs/aggregator';
import { Clock, Filter, Zap, RefreshCw, Layers } from 'lucide-react';

interface KillTimeSliderProps {
  totalReports: number;
  totalUniqueKills: number;
  minDuration: number; // in ms
  maxDuration: number; // in ms
  reports: Array<{ duration: number }>;
  onApplyFilter: (min: number, max: number) => void;
  isLoading: boolean;
}

export const KillTimeSlider: React.FC<KillTimeSliderProps> = ({
  totalReports,
  totalUniqueKills,
  minDuration,
  maxDuration,
  reports,
  onApplyFilter,
  isLoading
}) => {
  const [currentMin, setCurrentMin] = useState<number>(minDuration || 0);
  const [currentMax, setCurrentMax] = useState<number>(maxDuration || 0);

  useEffect(() => {
    if (minDuration && maxDuration) {
      setCurrentMin(minDuration);
      setCurrentMax(maxDuration);
    }
  }, [minDuration, maxDuration]);

  // Calculate matching reports in current window
  const matchingCount = reports.filter(
    r => r.duration >= currentMin && r.duration <= currentMax
  ).length;

  const handleApply = () => {
    onApplyFilter(currentMin, currentMax);
  };

  const setPreset = (type: 'all' | 'top10' | 'top25' | 'median') => {
    if (!minDuration || !maxDuration) return;
    const diff = maxDuration - minDuration;
    if (type === 'all') {
      setCurrentMin(minDuration);
      setCurrentMax(maxDuration);
    } else if (type === 'top10') {
      setCurrentMin(minDuration);
      setCurrentMax(Math.round(minDuration + diff * 0.1));
    } else if (type === 'top25') {
      setCurrentMin(minDuration);
      setCurrentMax(Math.round(minDuration + diff * 0.25));
    } else if (type === 'median') {
      setCurrentMin(Math.round(minDuration + diff * 0.25));
      setCurrentMax(Math.round(minDuration + diff * 0.75));
    }
  };

  return (
    <div className="bg-eso-card rounded-xl border border-eso-border p-6 shadow-xl space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-eso-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-eso-gold mb-1">
            <Layers className="w-4 h-4" />
            <span>Kill Time Window &amp; Report Sample</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Constraint Selector
          </h2>
        </div>

        {/* Global Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-eso-dark/80 px-3.5 py-2 rounded-lg border border-eso-border text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Total Fetched</div>
            <div className="text-base font-bold text-slate-100 font-mono">{totalReports} reports</div>
          </div>
          <div className="bg-eso-dark/80 px-3.5 py-2 rounded-lg border border-eso-border text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Fastest Kill</div>
            <div className="text-base font-bold text-emerald-400 font-mono">{formatDuration(minDuration)}</div>
          </div>
          <div className="bg-eso-dark/80 px-3.5 py-2 rounded-lg border border-eso-border text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Slowest Kill</div>
            <div className="text-base font-bold text-amber-400 font-mono">{formatDuration(maxDuration)}</div>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-eso-gold" /> Quick Presets:
        </span>
        <button
          type="button"
          onClick={() => setPreset('all')}
          className="text-xs px-3 py-1 rounded-md bg-eso-dark hover:bg-eso-cardHover border border-eso-border hover:border-eso-gold/40 text-slate-300 transition-colors"
        >
          All Available Kills
        </button>
        <button
          type="button"
          onClick={() => setPreset('top10')}
          className="text-xs px-3 py-1 rounded-md bg-eso-dark hover:bg-eso-cardHover border border-eso-border hover:border-eso-gold/40 text-emerald-300 transition-colors"
        >
          ⚡ Top 10% Fastest
        </button>
        <button
          type="button"
          onClick={() => setPreset('top25')}
          className="text-xs px-3 py-1 rounded-md bg-eso-dark hover:bg-eso-cardHover border border-eso-border hover:border-eso-gold/40 text-sky-300 transition-colors"
        >
          Top 25% Speed
        </button>
        <button
          type="button"
          onClick={() => setPreset('median')}
          className="text-xs px-3 py-1 rounded-md bg-eso-dark hover:bg-eso-cardHover border border-eso-border hover:border-eso-gold/40 text-amber-300 transition-colors"
        >
          Standard / Median Range
        </button>
      </div>

      {/* Interactive Range Sliders */}
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Min Duration Slider */}
          <div className="space-y-2 bg-eso-dark/40 p-3.5 rounded-lg border border-eso-border/40">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-eso-gold" /> Min Kill Time:
              </span>
              <span className="font-mono text-sm font-bold text-eso-goldLight">
                {formatDuration(currentMin)} ({Math.round(currentMin / 1000)}s)
              </span>
            </div>
            <input
              type="range"
              min={minDuration || 0}
              max={currentMax || maxDuration || 1000}
              step={1000}
              value={currentMin}
              onChange={(e) => setCurrentMin(Math.min(Number(e.target.value), currentMax))}
              className="w-full"
            />
          </div>

          {/* Max Duration Slider */}
          <div className="space-y-2 bg-eso-dark/40 p-3.5 rounded-lg border border-eso-border/40">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-eso-gold" /> Max Kill Time:
              </span>
              <span className="font-mono text-sm font-bold text-eso-goldLight">
                {formatDuration(currentMax)} ({Math.round(currentMax / 1000)}s)
              </span>
            </div>
            <input
              type="range"
              min={currentMin || minDuration || 0}
              max={maxDuration || 1000}
              step={1000}
              value={currentMax}
              onChange={(e) => setCurrentMax(Math.max(Number(e.target.value), currentMin))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-eso-border/40">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <Filter className="w-4 h-4 text-eso-gold" />
          <span>
            Selected window contains <strong className="text-white font-mono">{matchingCount}</strong> of <span className="font-mono">{totalReports}</span> reports
          </span>
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={isLoading || matchingCount === 0}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-eso-gold to-eso-goldDark hover:from-eso-goldLight hover:to-eso-gold text-eso-dark font-bold text-sm shadow-lg shadow-eso-gold/10 hover:shadow-eso-gold/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Fetching &amp; Computing Roster...</span>
            </>
          ) : (
            <>
              <Filter className="w-4 h-4" />
              <span>Compute Roster Analytics</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
