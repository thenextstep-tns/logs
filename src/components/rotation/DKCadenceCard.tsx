'use client';

import React, { useState } from 'react';
import { DKStats } from '@/types/rotation';
import {
  Flame,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  MessageSquare,
  Zap,
  Sword,
  Sparkles,
  Target
} from 'lucide-react';

interface DKCadenceCardProps {
  dkStats: DKStats;
  fightDurationSec: number;
  onOpenBossFeedback?: () => void;
}

export const DKCadenceCard: React.FC<DKCadenceCardProps> = ({
  dkStats,
  fightDurationSec,
  onOpenBossFeedback
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning'>('all');

  const filteredDetails = dkStats.details.filter(d => {
    if (filterSeverity === 'all') return true;
    return d.severity === filterSeverity;
  });

  const isTank = dkStats.specVariant === 'tank';
  const isZenkosh = dkStats.specVariant === 'zenkosh';

  // Heat shock styling
  const mf = dkStats.magmaFist;
  const heatShockColor =
    !mf
      ? 'text-slate-400'
      : mf.heatShockThreeStackUptimePct >= 75
      ? 'text-emerald-400'
      : mf.heatShockThreeStackUptimePct >= 50
      ? 'text-amber-400'
      : 'text-rose-400';

  // Whip styling
  const whip = dkStats.whipMiniGame;
  const isFlameLash = whip?.morph === 'flame_lash';
  const isMoltenWhip = whip?.morph === 'molten_whip';

  const moltenWhipColor =
    !whip || whip.seethingFuryThreeStackPct === undefined
      ? 'text-slate-400'
      : whip.seethingFuryThreeStackPct >= 80
      ? 'text-emerald-400'
      : whip.seethingFuryThreeStackPct >= 60
      ? 'text-amber-400'
      : 'text-rose-400';

  const lashReactionColor =
    !whip || whip.reactionDelayMs === undefined
      ? 'text-slate-400'
      : whip.reactionDelayMs <= 1200
      ? 'text-emerald-400'
      : whip.reactionDelayMs <= 2000
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="bg-eso-card border border-eso-border rounded-xl p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-eso-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            {isTank ? (
              <Shield className="w-4 h-4 text-amber-400" />
            ) : (
              <Flame className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Dragonknight {isTank ? 'Tank' : isZenkosh ? 'Zenkosh Support' : 'Parse DPS'} Engine
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-normal capitalize">
                {dkStats.specVariant}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTank
                ? 'Main boss debuffs (Taunt, Major Breach, Crusher, Maim), 3-stack Heat Shock maintenance & group buffs.'
                : 'Heat Shock 3-stack refresh cadence, Whip mini-games (Off-Balance reaction vs 3-Stack Seething Fury), and priority execution.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Chain Badges */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-black/40 px-2.5 py-1.5 rounded-lg border border-eso-border/60 overflow-x-auto">
            <span className="font-semibold text-amber-300">Prio:</span>
            {isTank ? (
              <>
                <span className="text-rose-400 font-bold">Taunt (100%)</span>
                <span>&gt;</span>
                <span className="text-amber-300 font-medium">Breach / Crusher</span>
                <span>&gt;</span>
                <span className="text-orange-300 font-medium">Heat Shock (3x)</span>
                <span>&gt;</span>
                <span>Igneous</span>
              </>
            ) : (
              <>
                <span className="text-amber-300 font-bold underline decoration-amber-400/50">Heat Shock (3x)</span>
                <span>&gt;</span>
                <span className="text-rose-300 font-medium">Knife (9s)</span>
                <span>&gt;</span>
                <span className="text-orange-300 font-medium">Core DoTs</span>
                <span>&gt;</span>
                <span className="text-red-400 font-medium">{isFlameLash ? 'Power Lash' : 'Molten Whip (3x)'}</span>
              </>
            )}
          </div>

          {onOpenBossFeedback && (
            <button
              onClick={onOpenBossFeedback}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0 cursor-pointer"
              title="Generate Discord-ready summary across all boss fights"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
              Boss Feedback
            </button>
          )}
        </div>
      </div>

      {/* Grid: Core Mechanics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* 1. Magma Fist & Heat Shock */}
        {mf ? (
          <div className="bg-black/30 border border-eso-border/80 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Heat Shock (Magma Fist)
              </span>
              <span className={`font-bold text-sm ${heatShockColor}`}>
                {mf.heatShockThreeStackUptimePct}% 3-Stack
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Total Boss Uptime:</span>
                <span className="text-white font-medium">{mf.heatShockUptimePct}%</span>
              </div>
              <div className="flex justify-between">
                <span>Refreshes (~1s early):</span>
                <span className="text-emerald-400 font-medium">{mf.optimalRefreshes} on-time</span>
              </div>
              <div className="flex justify-between">
                <span>Early / Dropped:</span>
                <span className="text-slate-300 font-medium">
                  {mf.earlyRefreshes} early •{' '}
                  <span className={mf.droppedRefreshes > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {mf.droppedRefreshes} dropped
                  </span>
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 border-t border-eso-border/40 pt-1.5">
              Avg interval: <span className="text-slate-300 font-medium">{mf.avgIntervalSec}s</span> (7s duration; refresh 5.5s–6.8s)
            </div>
          </div>
        ) : (
          <div className="bg-black/20 border border-eso-border/40 rounded-lg p-3.5 space-y-2 text-xs text-slate-500 flex flex-col justify-center items-center text-center">
            <Flame className="w-5 h-5 text-slate-600 mb-1" />
            <span>Magma Fist not cast in this fight</span>
          </div>
        )}

        {/* 2. Whip Mini-Game */}
        {isFlameLash ? (
          <div className="bg-black/30 border border-eso-border/80 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-red-400" />
                Flame Lash (Off-Balance)
              </span>
              <span className={`font-bold text-sm ${lashReactionColor}`}>
                {whip.reactionDelayMs !== undefined ? `${whip.reactionDelayMs}ms` : 'N/A'} delay
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Off-Balance Windows:</span>
                <span className="text-white font-medium">{whip.offBalanceWindowsCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Casts in Off-Balance:</span>
                <span className="text-emerald-400 font-medium">{whip.castsInOffBalance ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>DoTs Dropped during Lash:</span>
                <span className={(whip.expiredDotsDuringLash?.length ?? 0) > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {whip.expiredDotsDuringLash?.length ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Priority Violations:</span>
                <span className={(whip.priorityViolationsCount ?? 0) > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                  {whip.priorityViolationsCount ?? 0}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 border-t border-eso-border/40 pt-1.5">
              Spammable filler; burn Power Lash in OB without letting 3-stack Heat Shock or Knife drop.
            </div>
          </div>
        ) : isMoltenWhip ? (
          <div className="bg-black/30 border border-eso-border/80 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                Molten Whip (Seething Fury)
              </span>
              <span className={`font-bold text-sm ${moltenWhipColor}`}>
                {whip.seethingFuryThreeStackPct}% @ 3 Stacks
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Casts at 3 Stacks (+99%):</span>
                <span className="text-emerald-400 font-medium">{whip.castsAtThreeStacks}</span>
              </div>
              <div className="flex justify-between">
                <span>Casts &lt; 3 Stacks:</span>
                <span className={(whip.castsUnderThreeStacks ?? 0) > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {whip.castsUnderThreeStacks}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Whip Casts:</span>
                <span className="text-white font-medium">{whip.totalCasts}</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 border-t border-eso-border/40 pt-1.5">
              Weave Ardent Flame abilities to build 3 fury stacks before casting.
            </div>
          </div>
        ) : (
          <div className="bg-black/20 border border-eso-border/40 rounded-lg p-3.5 space-y-2 text-xs text-slate-500 flex flex-col justify-center items-center text-center">
            <Sword className="w-5 h-5 text-slate-600 mb-1" />
            <span>Neither Flame Lash nor Molten Whip detected</span>
          </div>
        )}

        {/* 3. Tank Debuffs (if Tank) OR Igneous Weapons & Standard */}
        {isTank && dkStats.tankDebuffs ? (
          <div className="bg-black/30 border border-eso-border/80 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Tank Debuffs (Main Boss)
              </span>
              <span className="font-bold text-sm text-emerald-400">
                {dkStats.tankDebuffs.tauntUptimePct}% Taunt
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Major Breach (Penetration):</span>
                <span className={dkStats.tankDebuffs.majorBreachUptimePct >= 90 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-bold'}>
                  {dkStats.tankDebuffs.majorBreachUptimePct}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Crusher (Weapon Enchant):</span>
                <span className={dkStats.tankDebuffs.crusherUptimePct >= 75 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-bold'}>
                  {dkStats.tankDebuffs.crusherUptimePct}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Minor / Major Maim:</span>
                <span className="text-slate-300 font-medium">{dkStats.tankDebuffs.maimUptimePct}%</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 border-t border-eso-border/40 pt-1.5">
              Maintain near 100% Taunt and Major Breach on the main boss.
            </div>
          </div>
        ) : dkStats.igneousWeapons ? (
          <div className="bg-black/30 border border-eso-border/80 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Igneous Weapons (Group Buff)
              </span>
              <span className={`font-bold text-sm ${dkStats.igneousWeapons.uptimePct >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {dkStats.igneousWeapons.uptimePct}% Uptime
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Total Casts:</span>
                <span className="text-white font-medium">{dkStats.igneousWeapons.totalCasts}</span>
              </div>
              <div className="flex justify-between">
                <span>Premature Recasts (&lt;45s):</span>
                <span className={dkStats.igneousWeapons.prematureRecasts > 2 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {dkStats.igneousWeapons.prematureRecasts}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Dropped Windows (&gt;60s):</span>
                <span className={dkStats.igneousWeapons.droppedWindows > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                  {dkStats.igneousWeapons.droppedWindows}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 border-t border-eso-border/40 pt-1.5">
              Lasts 60s; provides Major Brutality/Sorcery for the entire group.
            </div>
          </div>
        ) : (
          <div className="bg-black/20 border border-eso-border/40 rounded-lg p-3.5 space-y-2 text-xs text-slate-500 flex flex-col justify-center items-center text-center">
            <Sparkles className="w-5 h-5 text-slate-600 mb-1" />
            <span>Igneous Weapons not slotted</span>
          </div>
        )}
      </div>

      {/* Secondary Row: Standard of Might, Status Knife, Expired DoTs Visual Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Dragonknight Standard */}
        {dkStats.standard && (
          <div className="bg-black/25 border border-eso-border/60 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-red-400" />
                Dragonknight Standard
              </span>
              <span className="text-white font-bold">{dkStats.standard.totalCasts} cast(s)</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Time at 250+ Ult:</span>
                <span className="text-slate-300">{dkStats.standard.timeAt250PlusUltSec}s</span>
              </div>
              <div className="flex justify-between">
                <span>Phased Hold (Exempt):</span>
                <span className="text-emerald-400">{dkStats.standard.phasedHoldExemptSec}s</span>
              </div>
              <div className="flex justify-between">
                <span>Delayed Hold (Penalized):</span>
                <span className={dkStats.standard.penalizedHoldSec > 10 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {dkStats.standard.penalizedHoldSec}s
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Knife */}
        {dkStats.statusKnife && (
          <div className="bg-black/25 border border-eso-border/60 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Sword className="w-3.5 h-3.5 text-rose-400" />
                Status Knife (10s CD)
              </span>
              <span className="text-white font-bold">{dkStats.statusKnife.avgIntervalSec}s avg</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Optimal (~9s refresh):</span>
                <span className="text-emerald-400">{dkStats.statusKnife.optimalRefreshes} / {dkStats.statusKnife.totalCasts}</span>
              </div>
              <div className="flex justify-between">
                <span>Dropped / Early:</span>
                <span className="text-slate-300">
                  {dkStats.statusKnife.droppedRefreshes} dropped • {dkStats.statusKnife.prematureRefreshes} early
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Expired DoTs Breakdown during Flame Lash */}
        {isFlameLash && whip.expiredDotsDuringLash && whip.expiredDotsDuringLash.length > 0 && (
          <div className="bg-black/25 border border-eso-border/60 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                DoTs Dropped in Power Lash
              </span>
              <span className="text-amber-400 font-bold">{whip.expiredDotsDuringLash.length}</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1 max-h-20 overflow-y-auto">
              {whip.expiredDotsDuringLash.map((d, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-200"
                  title={`Expired at ${d.expiredAtSec}s while casting Lash at ${d.whipCastSec}s`}
                >
                  {d.name} ({d.expiredAtSec}s)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Diagnostic Timeline / Details */}
      {dkStats.details.length > 0 && (
        <div className="border-t border-eso-border/50 pt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Rotational Timeline Warnings ({filteredDetails.length})
            </span>
            <div className="flex gap-1.5">
              {(['all', 'error', 'warning'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    filterSeverity === sev
                      ? 'bg-amber-600/40 text-amber-200 border border-amber-500/50'
                      : 'bg-black/30 text-slate-400 border border-eso-border/40 hover:text-white'
                  }`}
                >
                  {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1) + 's'}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {filteredDetails.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-2 text-center">
                No events matching the selected filter.
              </p>
            ) : (
              filteredDetails.map((d, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 ${
                    d.severity === 'error'
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                      : d.severity === 'warning'
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      : 'bg-blue-950/20 border-blue-800/40 text-blue-200'
                  }`}
                >
                  {d.severity === 'error' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  ) : d.severity === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-snug">
                    <span className="font-mono text-[10px] text-slate-400 mr-1.5">
                      [{d.timeSec}s]
                    </span>
                    {d.description}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
