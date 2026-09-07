'use client';

import React, { useState } from 'react';
import { CruxStats, CruxBeamEvent } from '@/types/rotation';
import { Zap, AlertTriangle, CheckCircle2, Flame, Scissors } from 'lucide-react';

interface CruxBeamChartProps {
  cruxStats: CruxStats;
  fightDurationSec: number;
}

export const CruxBeamChart: React.FC<CruxBeamChartProps> = ({
  cruxStats,
  fightDurationSec
}) => {
  const [hoveredBeam, setHoveredBeam] = useState<CruxBeamEvent | null>(null);
  const [selectedBeam, setSelectedBeam] = useState<CruxBeamEvent | null>(null);

  const duration = Math.max(1, fightDurationSec);
  const activeBeam = selectedBeam || hoveredBeam;

  // Crux count breakdown counts
  const threeCruxCount = cruxStats.beams.filter(b => b.cruxBefore === 3).length;
  const twoCruxCount = cruxStats.beams.filter(b => b.cruxBefore === 2).length;
  const oneCruxCount = cruxStats.beams.filter(b => b.cruxBefore === 1).length;
  const zeroCruxCount = cruxStats.beams.filter(b => b.cruxBefore === 0).length;

  const getBeamStyle = (b: CruxBeamEvent) => {
    if (b.isOptimal) {
      return {
        bg: 'bg-emerald-500',
        border: 'border-emerald-400',
        text: 'text-emerald-400',
        label: 'Optimal (3 Crux & Completed)'
      };
    }
    if (b.suboptimalType === 'interrupted') {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300 border-dashed',
        text: 'text-amber-400',
        label: 'Suboptimal (Interrupted Channel)'
      };
    }
    if (b.suboptimalType === 'under_crux_and_interrupted') {
      return {
        bg: 'bg-rose-600',
        border: 'border-rose-400 border-dashed',
        text: 'text-rose-400',
        label: `Suboptimal (${b.cruxBefore} Crux & Interrupted)`
      };
    }
    if (b.cruxBefore === 2) {
      return {
        bg: 'bg-amber-600',
        border: 'border-amber-500',
        text: 'text-amber-400',
        label: 'Suboptimal (2 Crux -33% dmg)'
      };
    }
    if (b.cruxBefore === 1) {
      return {
        bg: 'bg-red-500',
        border: 'border-red-400',
        text: 'text-red-400',
        label: 'Suboptimal (1 Crux -66% dmg)'
      };
    }
    return {
      bg: 'bg-rose-700',
      border: 'border-rose-500',
      text: 'text-rose-400',
      label: 'Suboptimal (0 Crux -100% bonus)'
    };
  };

  const getCruxColor = (crux: number) => {
    if (crux === 3) return { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-400', label: '3 Crux' };
    if (crux === 2) return { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-400', label: '2 Crux' };
    if (crux === 1) return { bg: 'bg-red-500', border: 'border-red-400', text: 'text-red-400', label: '1 Crux' };
    return { bg: 'bg-rose-700', border: 'border-rose-500', text: 'text-rose-400', label: '0 Crux' };
  };

  // Generate interval timestamps for timeline axis
  const timeMarks: number[] = [];
  const step = duration > 180 ? 30 : 15;
  for (let s = 0; s <= duration; s += step) {
    timeMarks.push(s);
  }

  return (
    <div className="bg-eso-card border border-eso-border rounded-xl p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-eso-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Fatecarver Beams &amp; Channel Execution
            </h3>
            <div className="text-[11px] text-slate-400">
              Crux stack prior to activation, channel completion vs early clips, and unticked damage loss
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold border ${
              cruxStats.optimalPct >= 80
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                : cruxStats.optimalPct >= 60
                ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                : 'bg-red-950/80 text-red-400 border-red-500/40'
            }`}
          >
            {cruxStats.optimalPct}% Optimal ({cruxStats.optimalBeams} / {cruxStats.totalBeams})
          </span>
          <span className="px-2.5 py-1 rounded text-xs font-bold border bg-slate-900 text-slate-300 border-slate-700">
            {cruxStats.threeCruxPct}% 3-Crux Casts
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-eso-dark/70 border border-eso-border/80 rounded-lg p-3 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Beams
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {cruxStats.totalBeams}
          </div>
          <div className="text-[10px] text-slate-400">
            Fatecarver casts
          </div>
        </div>

        <div className="bg-eso-dark/70 border border-eso-border/80 rounded-lg p-3 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Optimal Beams
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {cruxStats.optimalBeams} <span className="text-xs text-slate-400 font-sans font-normal">({cruxStats.optimalPct}%)</span>
          </div>
          <div className="text-[10px] text-slate-400">
            3 Crux &amp; completed
          </div>
        </div>

        <div className="bg-eso-dark/70 border border-eso-border/80 rounded-lg p-3 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Interrupted Beams
          </div>
          <div className={`text-xl font-bold font-mono ${cruxStats.interruptedBeams > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {cruxStats.interruptedBeams} <span className="text-xs text-slate-400 font-sans font-normal">({cruxStats.interruptedPct}%)</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {cruxStats.avgTicksLostPerInterruptedBeam} avg lost ticks / cut
          </div>
        </div>

        <div className="bg-eso-dark/70 border border-eso-border/80 rounded-lg p-3 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Unticked Dmg Lost
          </div>
          <div className={`text-xl font-bold font-mono ${cruxStats.totalEstimatedDamageLost > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {cruxStats.totalEstimatedDamageLost > 0 ? `~${Math.round(cruxStats.totalEstimatedDamageLost / 1000)}k` : '0'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {cruxStats.avgDamageLostPerInterruptedBeam > 0
              ? `~${Math.round(cruxStats.avgDamageLostPerInterruptedBeam / 1000)}k avg / cut`
              : 'Completed channels'}
          </div>
        </div>

        <div className="bg-eso-dark/70 border border-eso-border/80 rounded-lg p-3 space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Channel Uptime
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono">
            {cruxStats.beamUptimePct}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {cruxStats.totalBeamChannelSec}s channeling
          </div>
        </div>
      </div>

      {/* Crux Stack Distribution Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold">Crux Stack Breakdown:</span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              3 Crux: {threeCruxCount} ({cruxStats.totalBeams > 0 ? Math.round((threeCruxCount / cruxStats.totalBeams) * 100) : 0}%)
            </span>
            {twoCruxCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                2 Crux: {twoCruxCount} ({Math.round((twoCruxCount / cruxStats.totalBeams) * 100)}%)
              </span>
            )}
            {oneCruxCount > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                1 Crux: {oneCruxCount} ({Math.round((oneCruxCount / cruxStats.totalBeams) * 100)}%)
              </span>
            )}
            {zeroCruxCount > 0 && (
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-700" />
                0 Crux: {zeroCruxCount} ({Math.round((zeroCruxCount / cruxStats.totalBeams) * 100)}%)
              </span>
            )}
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
          <div
            style={{ width: `${cruxStats.totalBeams > 0 ? (threeCruxCount / cruxStats.totalBeams) * 100 : 0}%` }}
            className="bg-emerald-500 transition-all"
            title={`3 Crux: ${threeCruxCount}`}
          />
          <div
            style={{ width: `${cruxStats.totalBeams > 0 ? (twoCruxCount / cruxStats.totalBeams) * 100 : 0}%` }}
            className="bg-amber-500 transition-all"
            title={`2 Crux: ${twoCruxCount}`}
          />
          <div
            style={{ width: `${cruxStats.totalBeams > 0 ? (oneCruxCount / cruxStats.totalBeams) * 100 : 0}%` }}
            className="bg-red-500 transition-all"
            title={`1 Crux: ${oneCruxCount}`}
          />
          <div
            style={{ width: `${cruxStats.totalBeams > 0 ? (zeroCruxCount / cruxStats.totalBeams) * 100 : 0}%` }}
            className="bg-rose-700 transition-all"
            title={`0 Crux: ${zeroCruxCount}`}
          />
        </div>
      </div>

      {/* Horizontal Beam Timeline Strip */}
      <div className="space-y-2 bg-eso-dark/90 border border-eso-border/80 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-eso-gold" />
            Fight Timeline (Beams Plotted by Timestamp &amp; Channel Duration)
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded bg-emerald-500" /> Optimal (3 Crux &amp; Full)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded bg-amber-500 border border-amber-300 border-dashed" /> Interrupted
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded bg-red-500" /> &lt; 3 Crux
            </span>
          </div>
        </div>

        {/* Timeline Canvas Container */}
        <div className="relative w-full h-14 bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden my-2 flex items-center px-1">
          {/* Background gridlines */}
          {timeMarks.map(t => {
            const leftPct = (t / duration) * 100;
            return (
              <div
                key={t}
                className="absolute top-0 bottom-0 border-l border-slate-800/60 pointer-events-none"
                style={{ left: `${leftPct}%` }}
              />
            );
          })}

          {/* Render Beam Segments */}
          {cruxStats.beams.map(b => {
            const leftPct = (b.startSec / duration) * 100;
            const widthPct = Math.max(1.2, (b.channelDurationSec / duration) * 100);
            const style = getBeamStyle(b);
            const isSelected = selectedBeam?.beamIndex === b.beamIndex;

            return (
              <button
                key={b.beamIndex}
                onClick={() => setSelectedBeam(isSelected ? null : b)}
                onMouseEnter={() => setHoveredBeam(b)}
                onMouseLeave={() => setHoveredBeam(null)}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`
                }}
                className={`absolute top-2 bottom-2 rounded transition-all cursor-pointer border ${style.bg} ${style.border} ${
                  isSelected
                    ? 'ring-2 ring-white scale-y-110 z-20 brightness-125'
                    : 'hover:brightness-125 hover:z-10 opacity-90 hover:opacity-100'
                } ${b.cruxBefore < 3 || b.isInterrupted ? 'animate-pulse' : ''}`}
                title={`Beam #${b.beamIndex} [${b.startSec}s]: ${b.cruxBefore} Crux (${b.channelDurationSec}s / ${b.expectedDurationSec}s)${b.isInterrupted ? ' [INTERRUPTED]' : ''}`}
              />
            );
          })}
        </div>

        {/* Time axis labels */}
        <div className="relative w-full h-4 text-[10px] font-mono text-slate-500">
          {timeMarks.map(t => {
            const leftPct = (t / duration) * 100;
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60);
            const label = `${m}:${s.toString().padStart(2, '0')}`;
            return (
              <span
                key={t}
                className="absolute -translate-x-1/2"
                style={{ left: `${leftPct}%` }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Beam Detail Inspector (Sticky card on hover or click) */}
      {activeBeam && (
        <div className="bg-eso-dark border border-eso-gold/60 rounded-xl p-3.5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold font-mono ${getBeamStyle(activeBeam).bg}/20 ${getBeamStyle(activeBeam).border} ${getBeamStyle(activeBeam).text}`}
            >
              Beam #{activeBeam.beamIndex}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>⏱ {activeBeam.startSec}s – {activeBeam.endSec}s</span>
                <span className={`text-[11px] font-semibold ${getBeamStyle(activeBeam).text}`}>
                  {getBeamStyle(activeBeam).label}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({activeBeam.morphName})
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Channel Duration:{' '}
                <span className="text-white font-bold">
                  {activeBeam.channelDurationSec}s / {activeBeam.expectedDurationSec}s
                </span>{' '}
                • Ticks:{' '}
                <span className="text-white font-bold">
                  {activeBeam.ticks} / {activeBeam.expectedTicks}
                </span>
                {activeBeam.isInterrupted && activeBeam.lostTicks > 0 && (
                  <span className="text-amber-400 ml-1">(-{activeBeam.lostTicks} unticked)</span>
                )}
                {activeBeam.estimatedDamageLost > 0 && (
                  <span className="text-rose-400 ml-2 font-bold">
                    • ~{Math.round(activeBeam.estimatedDamageLost / 1000)}k dmg lost
                  </span>
                )}
              </div>
              {activeBeam.interruptReason && (
                <div className="text-[11px] text-amber-300/90 font-sans mt-0.5 flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-amber-400" />
                  {activeBeam.interruptReason}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {activeBeam.isOptimal ? (
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Channel
              </span>
            ) : activeBeam.suboptimalType === 'interrupted' ? (
              <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-400 border border-amber-800/60 font-medium flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" /> Suboptimal (Interrupted)
              </span>
            ) : activeBeam.suboptimalType === 'under_crux_and_interrupted' ? (
              <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-400 border border-rose-800/60 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Under-Crux &amp; Interrupted
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-400 border border-amber-800/60 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Suboptimal ({activeBeam.cruxBefore} Crux)
              </span>
            )}
            {selectedBeam && (
              <button
                onClick={() => setSelectedBeam(null)}
                className="text-[10px] text-slate-400 hover:text-white underline ml-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interrupted Beams Breakdown Table */}
      {cruxStats.interruptedBeams > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-eso-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-amber-400" />
              Interrupted Fatecarver Channels (Unticked Damage Loss)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {cruxStats.interruptedBeams} interrupted beam{cruxStats.interruptedBeams > 1 ? 's' : ''} • ~{Math.round(cruxStats.totalEstimatedDamageLost / 1000)}k total lost damage
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-eso-border/80 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2 px-3">Beam</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Crux</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Ticks</th>
                  <th className="py-2 px-3">Est. Damage Lost</th>
                  <th className="py-2 px-3">Interruption Cause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-eso-border/40 font-mono">
                {cruxStats.interruptedList.map(item => (
                  <tr
                    key={item.beamIndex}
                    onClick={() => {
                      const matched = cruxStats.beams.find(b => b.beamIndex === item.beamIndex);
                      if (matched) setSelectedBeam(matched);
                    }}
                    className="hover:bg-eso-dark/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 font-bold text-white">
                      #{item.beamIndex}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {item.timeSec}s
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.cruxCount === 3
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {item.cruxCount} Crux
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      <span className="text-amber-400 font-bold">{item.actualDurationSec}s</span> / {item.expectedDurationSec}s
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {item.actualTicks} / {item.expectedTicks}{' '}
                      <span className="text-rose-400">(-{item.lostTicks})</span>
                    </td>
                    <td className="py-2 px-3 font-bold text-rose-400">
                      {item.estimatedDamageLost > 0
                        ? `~${Math.round(item.estimatedDamageLost / 1000)}k`
                        : 'Minimal'}
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-sans text-[11px]">
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Under-Crux Table (Listing all beams cast with < 3 Crux) */}
      {cruxStats.underCruxBeams > 0 ? (
        <div className="space-y-2.5 pt-2 border-t border-eso-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Under-Crux Activations (&lt; 3 Crux)
            </span>
            <span className="text-[11px] font-mono text-amber-400">
              {cruxStats.underCruxBeams} suboptimal cast{cruxStats.underCruxBeams > 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-eso-border/80 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2 px-3">Beam</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Crux Stack</th>
                  <th className="py-2 px-3">Channel Duration</th>
                  <th className="py-2 px-3">DPS Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-eso-border/40 font-mono">
                {cruxStats.underCruxList.map(u => {
                  const impact =
                    u.cruxCount === 2
                      ? '-33% beam damage bonus & slower tick rate'
                      : u.cruxCount === 1
                      ? '-66% beam damage bonus & slower tick rate'
                      : 'Zero Crux bonus (-100% bonus damage)';

                  return (
                    <tr
                      key={u.beamIndex}
                      onClick={() => {
                        const matched = cruxStats.beams.find(b => b.beamIndex === u.beamIndex);
                        if (matched) setSelectedBeam(matched);
                      }}
                      className="hover:bg-eso-dark/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-3 font-bold text-white">
                        #{u.beamIndex}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {u.timeSec}s
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-red-950/80 text-red-400 border-red-500/40">
                          {u.cruxCount} Crux
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {u.channelDurationSec}s
                      </td>
                      <td className="py-2 px-3 text-amber-400/90 font-sans text-[11px]">
                        {impact}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>100% of Fatecarver beams were cast with full 3 Crux.</span>
        </div>
      )}
    </div>
  );
};
