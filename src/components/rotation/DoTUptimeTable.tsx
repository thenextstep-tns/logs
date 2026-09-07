'use client';

import React from 'react';
import { DoTUptimeStat } from '@/types/rotation';
import { Timer, Flame, Layers } from 'lucide-react';

interface DoTUptimeTableProps {
  dotUptimes: DoTUptimeStat[];
  fightDurationSec: number;
}

export const DoTUptimeTable: React.FC<DoTUptimeTableProps> = ({
  dotUptimes,
  fightDurationSec
}) => {
  if (!dotUptimes || dotUptimes.length === 0) {
    return null;
  }

  const getUptimeColor = (pct: number) => {
    if (pct >= 70) return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
    if (pct >= 50) return { bar: 'bg-yellow-500', text: 'text-yellow-400' };
    if (pct >= 25) return { bar: 'bg-orange-500', text: 'text-orange-400' };
    return { bar: 'bg-rose-500', text: 'text-rose-400' };
  };

  return (
    <div className="bg-eso-card border border-eso-border rounded-xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-eso-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-eso-gold/10 border border-eso-gold/30">
            <Timer className="w-4 h-4 text-eso-gold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Damage Over Time (DoT) Uptimes
            </h3>
            <p className="text-[11px] text-slate-400">
              Active duration and maintenance across fight ({fightDurationSec}s)
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-md bg-eso-dark border border-eso-border text-xs font-mono text-eso-goldLight font-semibold self-start sm:self-auto">
          {dotUptimes.length} Active Effects
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-eso-border/60 text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              <th className="py-2.5 px-3">Ability</th>
              <th className="py-2.5 px-3 min-w-[200px]">Uptime</th>
              <th className="py-2.5 px-3 text-right">Active Time</th>
              <th className="py-2.5 px-3 text-right">Casts</th>
              <th className="py-2.5 px-3 text-right">Ticks</th>
              <th className="py-2.5 px-3 text-right">Total Damage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-eso-border/30">
            {dotUptimes.map((dot, idx) => {
              const { bar, text } = getUptimeColor(dot.uptimePct);
              return (
                <tr
                  key={idx}
                  className="hover:bg-eso-dark/40 transition-colors font-mono text-slate-300"
                >
                  {/* Name */}
                  <td className="py-2.5 px-3 font-sans font-medium text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-eso-gold shrink-0" />
                    <span>{dot.name}</span>
                  </td>

                  {/* Uptime Progress Bar */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${bar}`}
                          style={{ width: `${Math.min(100, dot.uptimePct)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-12 text-right ${text}`}>
                        {dot.uptimePct}%
                      </span>
                    </div>
                  </td>

                  {/* Active Duration */}
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {dot.uptimeSec}s
                  </td>

                  {/* Casts */}
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {dot.casts > 0 ? dot.casts : '—'}
                  </td>

                  {/* Ticks */}
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {dot.ticks > 0 ? dot.ticks : '—'}
                  </td>

                  {/* Total Damage */}
                  <td className="py-2.5 px-3 text-right font-semibold text-eso-goldLight">
                    {dot.totalDamage > 0
                      ? Number(dot.totalDamage).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
