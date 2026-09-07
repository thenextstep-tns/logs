'use client';

import React, { useState } from 'react';
import { SorcStats } from '@/types/rotation';
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Shield,
  Clock,
  Sparkles,
  Sword,
  XCircle,
  Info,
  MessageSquare
} from 'lucide-react';

interface SorcCadenceCardProps {
  sorcStats: SorcStats;
  fightDurationSec: number;
  onOpenBossFeedback?: () => void;
}

export const SorcCadenceCard: React.FC<SorcCadenceCardProps> = ({
  sorcStats,
  fightDurationSec,
  onOpenBossFeedback
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning'>('all');

  const filteredDetails = sorcStats.details.filter(d => {
    if (filterSeverity === 'all') return true;
    return d.severity === filterSeverity;
  });

  const fragColor =
    sorcStats.fragProcEfficiencyPct >= 95
      ? 'text-emerald-400'
      : sorcStats.fragProcEfficiencyPct >= 80
      ? 'text-amber-400'
      : 'text-rose-400';

  const immediateColor =
    (sorcStats.fragProcImmediateCastPct ?? 100) >= 80
      ? 'text-emerald-400'
      : (sorcStats.fragProcImmediateCastPct ?? 100) >= 50
      ? 'text-amber-400'
      : 'text-rose-400';

  const armamentsPct =
    sorcStats.totalArmamentsCasts > 0
      ? Math.round((sorcStats.optimalArmamentsCasts / sorcStats.totalArmamentsCasts) * 100)
      : 100;

  const armamentsColor =
    armamentsPct >= 90
      ? 'text-emerald-400'
      : armamentsPct >= 70
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="bg-eso-card border border-eso-border rounded-xl p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-eso-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Sorcerer Priority & Mechanics Engine
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-normal">
                Dynamic Priority
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant Crystal Frag procs (Absolute Priority), Bound Armaments (4+/8 stacks), Status Knife cadence, Haunting Curse explosions & Mythic tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Chain Badges */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-black/40 px-2.5 py-1.5 rounded-lg border border-eso-border/60 overflow-x-auto">
            <span className="font-semibold text-purple-300">Prio:</span>
            <span className="text-amber-300 font-medium font-bold underline decoration-amber-400/50">Frags (Proc #1)</span>
            <span>&gt;</span>
            <span>Stampede</span>
            <span>&gt;</span>
            <span>Hurricane</span>
            <span>&gt;</span>
            <span className="text-cyan-300 font-medium">Armaments</span>
            <span>&gt;</span>
            <span>Trap</span>
            <span>&gt;</span>
            <span>Liquid</span>
            <span>&gt;</span>
            <span className="text-blue-300 font-medium">Curse</span>
            <span>&gt;</span>
            <span className="text-rose-300 font-medium">Knife</span>
          </div>

          {onOpenBossFeedback && (
            <button
              onClick={onOpenBossFeedback}
              className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0 cursor-pointer"
              title="Generate Discord-ready summary across all boss fights"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
              Boss Feedback
            </button>
          )}
        </div>
      </div>

      {/* Mythic Banner: Shattered Paths Signet */}
      {sorcStats.hasShatteredPathsSignet && (
        <div
          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            sorcStats.ultimateBelow133Count && sorcStats.ultimateBelow133Count > 0
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                sorcStats.ultimateBelow133Count && sorcStats.ultimateBelow133Count > 0
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide flex items-center gap-2">
                <span>Shattered Paths Signet (Mythic)</span>
                {sorcStats.ultimateBelow133Count && sorcStats.ultimateBelow133Count > 0 ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-normal">
                    You let your ult drop below 133...
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-normal">
                    Optimal (&ge; 133 Ult Maintained)
                  </span>
                )}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Increases status effect damage up to 133% based on current Ultimate. Must never drop below 133.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="opacity-70 text-[10px] block uppercase">Min Ultimate</span>
              <span
                className={`font-bold text-sm ${
                  (sorcStats.minUltimateValue ?? 0) < 133 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {sorcStats.minUltimateValue ?? 'N/A'}
              </span>
            </div>
            {sorcStats.ultimateBelow133Count !== undefined && sorcStats.ultimateBelow133Count > 0 && (
              <div>
                <span className="opacity-70 text-[10px] block uppercase">Sub-133 Samples</span>
                <span className="font-bold text-sm text-rose-400">{sorcStats.ultimateBelow133Count}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Power Overload Opener Notice */}
      {sorcStats.powerOverloadOpenedActive !== undefined && (
        <div className="p-3 rounded-lg bg-black/30 border border-eso-border/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-slate-200">Power Overload Opener:</span>
            {sorcStats.powerOverloadOpenedActive ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Opened with Overload active
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Did not open with Overload active
              </span>
            )}
          </div>
          {sorcStats.powerOverloadDeactivatedInTime !== undefined && (
            <span className="text-[11px] text-slate-400">
              Deactivation:{' '}
              {sorcStats.powerOverloadDeactivatedInTime ? (
                <span className="text-emerald-400">Toggled off before &lt; 133 Ult</span>
              ) : (
                <span className="text-rose-400">Dropped below 133 before toggling off</span>
              )}
            </span>
          )}
        </div>
      )}

      {/* Key Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Crystal Fragments & Proc Priority */}
        <div className="p-3.5 rounded-lg bg-black/30 border border-eso-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Frag Procs (Prio #1)
            </span>
            <span className={`text-xs font-mono font-bold ${immediateColor}`} title="Percentage of procs cast immediately without delay">
              {sorcStats.fragProcImmediateCastPct ?? 100}% Immediate
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xl font-bold font-mono text-white">
                {sorcStats.procFragsCasts}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ {sorcStats.totalFragsCasts} procced</span>
            </div>
            {sorcStats.hardcastFragsCasts > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-300">
                {sorcStats.hardcastFragsCasts} hardcasts
              </span>
            )}
          </div>

          {/* Proc Timing Breakdown */}
          {sorcStats.totalFragProcsGained > 0 && (
            <div className="text-[11px] font-mono space-y-0.5 pt-1 border-t border-eso-border/40 text-slate-400">
              <div className="flex justify-between">
                <span>Immediate Casts:</span>
                <span className="text-emerald-400 font-bold">{sorcStats.immediateFragProcsCount} / {sorcStats.totalFragProcsGained}</span>
              </div>
              <div className="flex justify-between">
                <span>Delayed Procs:</span>
                <span className={sorcStats.delayedFragProcsCount > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>
                  {sorcStats.delayedFragProcsCount} ({sorcStats.interveningSkillsDuringProcCount} GCDs)
                </span>
              </div>
              {sorcStats.expiredFragProcsCount > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>Proc Expired:</span>
                  <span>{sorcStats.expiredFragProcsCount}</span>
                </div>
              )}
            </div>
          )}

          <div className="text-[11px] text-slate-400">
            Absolute priority: Cast instant procs immediately to avoid delaying burst damage or wasting proc rolls.
          </div>
        </div>

        {/* 2. Bound Armaments */}
        <div className="p-3.5 rounded-lg bg-black/30 border border-eso-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sword className="w-3.5 h-3.5 text-cyan-400" /> Bound Armaments
            </span>
            <span className={`text-xs font-mono font-bold ${armamentsColor}`}>
              {armamentsPct}% Optimal
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xl font-bold font-mono text-white">
                {sorcStats.optimalArmamentsCasts}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ {sorcStats.totalArmamentsCasts} at 4+</span>
            </div>
            <span className="text-xs font-mono text-slate-300">
              Avg: <span className="font-bold text-white">{sorcStats.avgStacksAtCast}</span> stacks
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Build stacks with Light Attacks; fire at 4+ or 8 stacks. Casts at &lt; 4 lose DPS.
          </div>
        </div>

        {/* 3. Status Knife */}
        <div className="p-3.5 rounded-lg bg-black/30 border border-eso-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" /> Status Knife
            </span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {sorcStats.avgKnifeIntervalSec}s avg
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xl font-bold font-mono text-white">
                {sorcStats.optimalKnifeRefreshes}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ {sorcStats.totalKnifeCasts} on-time</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              {sorcStats.droppedKnifeCount > 0 && (
                <span className="text-amber-400">{sorcStats.droppedKnifeCount} dropped</span>
              )}
              {sorcStats.prematureKnifeCount > 0 && (
                <span className="text-blue-400">{sorcStats.prematureKnifeCount} early</span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            10s duration; refresh ~1s before cooldown (8.5s - 9.8s) for maximum uptime.
          </div>
        </div>

        {/* 4. Haunting Curse */}
        <div className="p-3.5 rounded-lg bg-black/30 border border-eso-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-blue-400" /> Haunting Curse
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                sorcStats.recastBeforeSecondExplosionCount === 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {sorcStats.recastBeforeSecondExplosionCount === 0 ? '100% Intact' : `${sorcStats.recastBeforeSecondExplosionCount} Clipped`}
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xl font-bold font-mono text-white">
                {sorcStats.optimalCurseRefreshes}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ {sorcStats.totalCurseCasts} full</span>
            </div>
            <span className="text-xs font-mono text-slate-300">
              Avg: <span className="font-bold text-white">{sorcStats.avgCurseIntervalSec}</span>s
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Explodes at 3.5s and 8.5s. Never recast before 8.5s to avoid clipping the 2nd blast!
          </div>
        </div>
      </div>

      {/* Incident / Diagnostic Feed */}
      {sorcStats.details.length > 0 && (
        <div className="space-y-2.5 pt-1 border-t border-eso-border/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" /> Diagnostic Rotation Feedback ({sorcStats.details.length})
            </h4>
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2 py-0.5 rounded transition ${
                  filterSeverity === 'all'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSeverity('error')}
                className={`px-2 py-0.5 rounded transition ${
                  filterSeverity === 'error'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Errors
              </button>
              <button
                onClick={() => setFilterSeverity('warning')}
                className={`px-2 py-0.5 rounded transition ${
                  filterSeverity === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Warnings
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
            {filteredDetails.map((detail, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded border flex items-start justify-between gap-3 ${
                  detail.severity === 'error'
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    : detail.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-black/30 border-eso-border/60 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {detail.severity === 'error' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                  ) : detail.severity === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  )}
                  <span className="font-sans text-[12px]">{detail.description}</span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {detail.timeSec > 0 ? `${detail.timeSec}s` : 'Fight Start'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
