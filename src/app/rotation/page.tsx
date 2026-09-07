'use client';

import React, { useState } from 'react';
import { RotationAnalysisResult, PerformanceZone } from '@/types/rotation';
import { OptimalityChart } from '@/components/rotation/OptimalityChart';
import { PatternDistribution } from '@/components/rotation/PatternDistribution';
import { CycleInspector } from '@/components/rotation/CycleInspector';
import { CruxBeamChart } from '@/components/rotation/CruxBeamChart';
import { SorcCadenceCard } from '@/components/rotation/SorcCadenceCard';
import { DKCadenceCard } from '@/components/rotation/DKCadenceCard';
import { DoTUptimeTable } from '@/components/rotation/DoTUptimeTable';
import { BossFeedbackModal } from '@/components/rotation/BossFeedbackModal';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import {
  Search,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Flame,
  Clock,
  RefreshCw,
  AlertTriangle,
  Swords,
  User,
  Activity,
  Zap,
  MessageSquare
} from 'lucide-react';

interface ReportFight {
  id: number;
  name: string;
  kill?: boolean;
  boss?: number;
  start_time: number;
  end_time: number;
}

interface ReportFriendly {
  id: number;
  name: string;
  type: string;
  displayName?: string;
  fights?: Array<{ id: number }>;
}

export default function RotationAnalyzerPage() {
  const [logUrl, setLogUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RotationAnalysisResult | null>(null);
  const [selectedCycleIndex, setSelectedCycleIndex] = useState<number | null>(null);

  // Report metadata and selectors
  const [reportTitle, setReportTitle] = useState<string | null>(null);
  const [fights, setFights] = useState<ReportFight[]>([]);
  const [friendlies, setFriendlies] = useState<ReportFriendly[]>([]);
  const [selectedFightId, setSelectedFightId] = useState<number | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [isBossFeedbackOpen, setIsBossFeedbackOpen] = useState<boolean>(false);

  const runAnalysis = async (
    overrideUrl?: string,
    overrideFightId?: number,
    overrideSourceId?: number
  ) => {
    const urlToUse = (overrideUrl !== undefined ? overrideUrl : logUrl).trim();
    if (!urlToUse) {
      setError('Please paste a valid ESO Logs URL or Report ID.');
      return;
    }

    setIsLoading(true);
    setError(null);
    if (overrideFightId === undefined && overrideSourceId === undefined) {
      setAnalysis(null);
    }

    try {
      const res = await fetch('/api/rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToUse,
          fightId: overrideFightId !== undefined ? overrideFightId : selectedFightId,
          sourceId: overrideSourceId !== undefined ? overrideSourceId : selectedSourceId
        })
      });

      const data = await res.json();

      if (data.fights) setFights(data.fights);
      if (data.friendlies) setFriendlies(data.friendlies);
      if (data.reportTitle) setReportTitle(data.reportTitle);
      if (data.selectedFightId !== undefined) setSelectedFightId(data.selectedFightId);
      if (data.selectedSourceId !== undefined) setSelectedSourceId(data.selectedSourceId);

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}: Failed to analyze rotation.`);
      }

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Failed to process rotation analysis.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFightChange = (fightIdNum: number) => {
    setSelectedFightId(fightIdNum);
    const playersInFight = friendlies.filter(
      p => !p.fights || p.fights.length === 0 || p.fights.some(f => f.id === fightIdNum)
    );
    let newSourceId = selectedSourceId;
    if (!playersInFight.some(p => p.id === selectedSourceId)) {
      newSourceId = playersInFight[0]?.id || selectedSourceId;
      setSelectedSourceId(newSourceId);
    }
    runAnalysis(logUrl, fightIdNum, newSourceId ?? undefined);
  };

  const handlePlayerChange = (sourceIdNum: number) => {
    setSelectedSourceId(sourceIdNum);
    runAnalysis(logUrl, selectedFightId ?? undefined, sourceIdNum);
  };

  const getZoneBadgeDetails = (zone: PerformanceZone) => {
    switch (zone) {
      case 'green':
        return { label: 'Green', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' };
      case 'yellow':
        return { label: 'Yellow', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40' };
      case 'orange':
        return { label: 'Orange', color: 'text-orange-400 bg-orange-500/20 border-orange-500/40' };
      case 'red':
        return { label: 'Red', color: 'text-red-400 bg-red-500/20 border-red-500/40' };
      case 'darkRed':
        return { label: 'Dark Red', color: 'text-rose-300 bg-rose-950/80 border-rose-800/50' };
    }
  };

  // Filter players participating in the currently selected fight
  const availablePlayers = selectedFightId
    ? friendlies.filter(
        p => !p.fights || p.fights.length === 0 || p.fights.some(f => f.id === selectedFightId)
      )
    : friendlies;
  const displayPlayers = availablePlayers.length > 0 ? availablePlayers : friendlies;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-eso-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-eso-gold" />
            Rotation Analyser
          </h1>
          {reportTitle && (
            <p className="text-xs text-slate-400 mt-1">
              Log: <span className="text-eso-goldLight font-medium">{reportTitle}</span>
            </p>
          )}
        </div>
      </div>

      {/* Input URL Bar */}
      <div className="bg-eso-card border border-eso-border rounded-xl p-3.5 shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Paste ESO Logs URL (e.g. https://www.esologs.com/reports/7LKMqfRc3ZdCzGJx)..."
              value={logUrl}
              onChange={e => setLogUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && logUrl.trim() && runAnalysis(logUrl)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-eso-dark border border-eso-border focus:border-eso-gold/60 focus:ring-1 focus:ring-eso-gold/40 text-xs text-white placeholder:text-slate-500 outline-none transition-all font-mono"
            />
          </div>

          <button
            onClick={() => runAnalysis(logUrl)}
            disabled={isLoading || !logUrl.trim()}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-gradient-to-r from-eso-gold to-eso-goldDark hover:from-eso-goldLight hover:to-eso-gold text-slate-950 text-xs font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Log'}
          </button>
        </div>
      </div>

      {/* Fight & Player Dropdown Selectors */}
      {fights.length > 0 && (
        <div className="bg-eso-card border border-eso-border rounded-xl p-3.5 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Fight Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
                <Swords className="w-3.5 h-3.5 text-eso-gold" />
                Fight:
              </span>
              <select
                value={selectedFightId ?? ''}
                onChange={e => handleFightChange(Number(e.target.value))}
                className="w-full bg-eso-dark border border-eso-border rounded-lg px-3 py-2 text-xs text-white font-medium focus:border-eso-gold/60 outline-none transition-colors"
              >
                {fights.map(f => (
                  <option key={f.id} value={f.id}>
                    #{f.id}: {f.name} {f.kill ? '(KILL)' : '(Wipe)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Player Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
                <User className="w-3.5 h-3.5 text-eso-gold" />
                Player:
              </span>
              <select
                value={selectedSourceId ?? ''}
                onChange={e => handlePlayerChange(Number(e.target.value))}
                className="w-full bg-eso-dark border border-eso-border rounded-lg px-3 py-2 text-xs text-white font-medium focus:border-eso-gold/60 outline-none transition-colors"
              >
                {displayPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type}{p.displayName ? ` - ${p.displayName}` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-detected spec indicator */}
          {analysis?.spec && (
            <div className="shrink-0 flex items-center gap-2 border-t md:border-t-0 md:border-l border-eso-border/60 pt-2 md:pt-0 md:pl-3">
              <span className="text-[11px] text-slate-400">Detected:</span>
              {analysis.spec.isRecognized ? (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                    {analysis.spec.name}
                  </span>
                  <button
                    onClick={() => setIsBossFeedbackOpen(true)}
                    className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                    title="Generate Discord-ready summary across all boss fights for this spec"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Boss Feedback
                  </button>
                </div>
              ) : (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  {analysis.spec.class} (Standard)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading & Error States */}
      {isLoading && (
        <LoadingState
          message="Analyzing Casts & Buffs..."
          subMessage="Fetching combat log events from ESO Logs"
        />
      )}

      {error && (
        <ErrorState
          title="Analysis Failed"
          error={error}
          onRetry={() => runAnalysis()}
        />
      )}

      {/* Unrecognized Spec Warning Banner */}
      {!isLoading && analysis && !analysis.spec?.isRecognized && (
        <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-4 flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-300">
              Unrecognized Spec: {analysis.spec.class} ({analysis.fightMeta.actorName})
            </div>
            <p className="text-xs text-amber-200/80 mt-1">
              {analysis.unrecognizedWarning ||
                `No specialized rotation combo model is configured for ${analysis.spec.class} yet. Evaluating active GCD uptime, idle downtime, inactivity windows, and light attack weaving.`}
            </p>
          </div>
        </div>
      )}

      {/* Main Analysis Dashboard */}
      {!isLoading && !error && analysis && (
        <div className="space-y-5">
          {/* Fight Metadata & Global Stats Banner */}
          <div className="bg-eso-card border border-eso-border rounded-xl p-4 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {analysis.fightMeta.actorName}
                </h2>
                {analysis.fightMeta.actorDisplayName && (
                  <span className="text-xs font-mono text-slate-400">
                    ({analysis.fightMeta.actorDisplayName})
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                  {analysis.spec.name}
                </span>
                {analysis.spec.isRecognized && (
                  <button
                    onClick={() => setIsBossFeedbackOpen(true)}
                    className="px-2.5 py-1 rounded-md bg-eso-gold/15 hover:bg-eso-gold/25 border border-eso-gold/40 text-eso-goldLight text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Generate Discord-ready summary across all boss fights"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-eso-gold" />
                    Boss Feedback
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>{analysis.fightMeta.fightName} (#{analysis.fightMeta.fightId})</span>
                <span>•</span>
                <span>{analysis.fightMeta.durationSec}s</span>
                <span>•</span>
                <a
                  href={`https://www.esologs.com/reports/${analysis.fightMeta.reportId}?fight=${analysis.fightMeta.fightId}&type=casts&source=${analysis.fightMeta.actorId}&view=events`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-eso-gold hover:underline inline-flex items-center gap-1"
                >
                  ESO Logs <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-4 bg-eso-dark/80 border border-eso-border/80 rounded-xl p-3 px-4">
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Score
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {analysis.overallScore}%
                </div>
              </div>

              <div className="h-10 w-[1px] bg-eso-border/60" />

              <div>
                <div
                  className={`px-2.5 py-0.5 rounded text-xs font-bold border inline-block ${
                    getZoneBadgeDetails(analysis.overallZone).color
                  }`}
                >
                  {getZoneBadgeDetails(analysis.overallZone).label}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  {analysis.sorcStats
                    ? `${analysis.sorcStats.fragProcEfficiencyPct}% Frag Procs • ${analysis.idleStats.laHitRatePct ?? 0}% LA Hit Rate`
                    : analysis.dkStats
                    ? `${analysis.dkStats.magmaFist ? `${analysis.dkStats.magmaFist.heatShockThreeStackUptimePct}% Heat Shock • ` : ''}${analysis.idleStats.laHitRatePct ?? 0}% LA Hit Rate`
                    : analysis.cruxStats && analysis.cruxStats.totalBeams > 0
                    ? `${analysis.cruxStats.threeCruxPct}% 3-Crux Beams (${analysis.cruxStats.threeCruxBeams}/${analysis.cruxStats.totalBeams})`
                    : analysis.spec.isRecognized
                    ? `${analysis.cadenceStats.perfectTripletsPct}% Perfect Cadence`
                    : `${analysis.idleStats.activeUptimePct}% Active Uptime`}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Zone Breakdown */}
            <div className="bg-eso-card border border-eso-border rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Zone Breakdown
              </span>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                <div style={{ width: `${analysis.zoneDistribution.greenPct}%` }} className="bg-emerald-500" />
                <div style={{ width: `${analysis.zoneDistribution.yellowPct}%` }} className="bg-yellow-500" />
                <div style={{ width: `${analysis.zoneDistribution.orangePct}%` }} className="bg-orange-500" />
                <div style={{ width: `${analysis.zoneDistribution.redPct}%` }} className="bg-red-500" />
                <div style={{ width: `${analysis.zoneDistribution.darkRedPct}%` }} className="bg-rose-950" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span className="text-emerald-400">{analysis.zoneDistribution.greenPct}%</span>
                <span className="text-yellow-400">{analysis.zoneDistribution.yellowPct}%</span>
                <span className="text-orange-400">{analysis.zoneDistribution.orangePct}%</span>
                <span className="text-red-400">{analysis.zoneDistribution.redPct}%</span>
                <span className="text-rose-400">{analysis.zoneDistribution.darkRedPct}%</span>
              </div>
            </div>

            {/* Active GCD Uptime & Idle Time */}
            <div className="bg-eso-card border border-eso-border rounded-xl p-4 space-y-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Active Uptime & Idle
              </span>
              <div className="text-xl font-bold text-white font-mono flex items-baseline gap-2">
                <span>{analysis.idleStats.activeUptimePct}%</span>
                <span className="text-xs font-normal text-slate-400 font-sans">uptime</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {analysis.idleStats.totalActiveSec}s active • <span className="text-orange-400">{analysis.idleStats.totalIdleSec}s idle</span>
              </div>
            </div>

            {/* Light Attack Weaving, Cancels & Damage Hits */}
            <div className="bg-eso-card border border-eso-border rounded-xl p-4 space-y-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                LA Weaving & Swaps
              </span>
              <div className="text-xl font-bold text-white font-mono flex items-baseline gap-2">
                <span>{analysis.idleStats.laWeaveEfficiencyPct}%</span>
                <span className="text-xs font-normal text-slate-400 font-sans">weaved</span>
                {analysis.idleStats.avgWeaveDelayMs !== undefined && (
                  <span
                    className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
                      analysis.idleStats.avgWeaveDelayMs <= 100
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                        : analysis.idleStats.avgWeaveDelayMs <= 200
                        ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-800/50'
                        : 'bg-orange-950/60 text-orange-400 border border-orange-800/50'
                    }`}
                    title="Average time between light attack and skill cast (< 100ms parse standard)"
                  >
                    {analysis.idleStats.avgWeaveDelayMs}ms delay
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {analysis.idleStats.weavedLAsCount}/{analysis.totalGCDCasts} LAs
                {analysis.idleStats.standaloneLAsCount ? ` (${analysis.idleStats.standaloneLAsCount} solo)` : ''} •{' '}
                {analysis.idleStats.totalBarSwaps} swaps
              </div>
              {analysis.idleStats.laHitRatePct !== undefined && (
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-eso-border/40 mt-1">
                  <span>
                    Connected: <strong className={analysis.idleStats.laHitRatePct >= 85 ? 'text-emerald-400' : analysis.idleStats.laHitRatePct >= 70 ? 'text-yellow-400' : 'text-rose-400'}>{analysis.idleStats.laHitRatePct}%</strong>
                  </span>
                  <span>
                    {analysis.idleStats.connectedLAsCount} hit / {analysis.idleStats.emptyLAsCount} empty
                  </span>
                </div>
              )}
            </div>

            {/* Sorcerer Priority, Arcanist Fatecarver, Blastbones, or General GCD Pacing */}
            {analysis.sorcStats ? (
              <div className="bg-eso-card border border-eso-border rounded-xl p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Sorc Priority Engine
                </span>
                <div className="text-xl font-bold text-purple-400 font-mono flex items-baseline gap-2">
                  <span>{analysis.sorcStats.fragProcEfficiencyPct}%</span>
                  <span className="text-xs font-normal text-slate-400 font-sans">proc efficiency</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {analysis.sorcStats.procFragsCasts}/{analysis.sorcStats.totalFragsCasts} procs •{' '}
                  {analysis.sorcStats.optimalArmamentsCasts}/{analysis.sorcStats.totalArmamentsCasts} armaments @ 4+
                </div>
              </div>
            ) : analysis.dkStats ? (
              <div className="bg-eso-card border border-eso-border rounded-xl p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  DK Cadence Engine
                </span>
                <div className="text-xl font-bold text-amber-400 font-mono flex items-baseline gap-2">
                  <span>
                    {analysis.dkStats.specVariant === 'tank' && analysis.dkStats.tankDebuffs
                      ? `${analysis.dkStats.tankDebuffs.tauntUptimePct}%`
                      : analysis.dkStats.magmaFist
                      ? `${analysis.dkStats.magmaFist.heatShockThreeStackUptimePct}%`
                      : `${analysis.idleStats.activeUptimePct}%`}
                  </span>
                  <span className="text-xs font-normal text-slate-400 font-sans">
                    {analysis.dkStats.specVariant === 'tank'
                      ? 'taunt uptime'
                      : analysis.dkStats.magmaFist
                      ? '3-stack Heat Shock'
                      : 'active uptime'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {analysis.dkStats.whipMiniGame?.morph === 'flame_lash'
                    ? `${analysis.dkStats.whipMiniGame.castsInOffBalance} Lash in OB • ${analysis.dkStats.whipMiniGame.reactionDelayMs ?? 0}ms delay`
                    : analysis.dkStats.whipMiniGame?.morph === 'molten_whip'
                    ? `${analysis.dkStats.whipMiniGame.seethingFuryThreeStackPct}% Whip @ 3 stacks`
                    : `${analysis.idleStats.laHitRatePct ?? 0}% LA hit rate`}
                </div>
              </div>
            ) : analysis.cruxStats && analysis.cruxStats.totalBeams > 0 ? (
              <div className="bg-eso-card border border-eso-border rounded-xl p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Fatecarver Execution
                </span>
                <div className="text-xl font-bold text-emerald-400 font-mono flex items-baseline gap-2">
                  <span>{analysis.cruxStats.optimalPct}%</span>
                  <span className="text-xs font-normal text-slate-400 font-sans">optimal</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {analysis.cruxStats.optimalBeams}/{analysis.cruxStats.totalBeams} optimal •{' '}
                  {analysis.cruxStats.interruptedBeams > 0 ? (
                    <span className="text-amber-400 font-semibold">{analysis.cruxStats.interruptedBeams} interrupted</span>
                  ) : (
                    <span className="text-emerald-400">0 cut</span>
                  )}
                </div>
              </div>
            ) : analysis.spec.isRecognized && analysis.spec.class.toLowerCase() === 'necromancer' ? (
              <div className="bg-eso-card border border-eso-border rounded-xl p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-eso-gold" />
                  Blastbones Cadence
                </span>
                <div className="text-xl font-bold text-white font-mono">
                  {analysis.cadenceStats.averageInterval} skills
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {analysis.cadenceStats.perfectTripletsCount}/{analysis.totalCycles} perfect {analysis.cadenceStats.targetInterval}-cast
                </div>
              </div>
            ) : (
              <div className="bg-eso-card border border-eso-border rounded-xl p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  GCD Pacing & APM
                </span>
                <div className="text-xl font-bold text-white font-mono">
                  {Math.round(
                    (analysis.totalGCDCasts / Math.max(1, analysis.fightMeta.durationSec)) * 60
                  )}{' '}
                  <span className="text-xs font-normal text-slate-400 font-sans">casts/min</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {analysis.totalGCDCasts} skills • {analysis.idleStats.averageGapMs}ms avg gap
                </div>
              </div>
            )}
          </div>

          {/* Inactivity Windows */}
          {analysis.idleStats.topIdleGaps.length > 0 && (
            <div className="bg-eso-card border border-eso-border rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-eso-border/60 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Inactivity Windows (&gt;1.5s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {analysis.idleStats.topIdleGaps.map((gap, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-2.5 rounded-lg bg-eso-dark/80 border border-eso-border/80 flex flex-col justify-between text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[11px] text-slate-400">
                        ⏱ {gap.startSec}s – {gap.endSec}s
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-400 border border-orange-800/40 text-[10px] font-bold">
                        +{gap.idleSec}s idle
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-200">
                      <span className="text-slate-400">{gap.fromSkill}</span>
                      <span className="text-eso-gold mx-1 font-bold">→</span>
                      <span className="text-white font-medium">{gap.toSkill}</span>
                    </div>

                    {gap.reason && (
                      <div className="text-[10px] text-slate-400 italic pt-0.5">
                        {gap.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sorcerer Cadence & Priority Card */}
          {analysis.sorcStats && (
            <SorcCadenceCard
              sorcStats={analysis.sorcStats}
              fightDurationSec={analysis.fightMeta.durationSec}
              onOpenBossFeedback={() => setIsBossFeedbackOpen(true)}
            />
          )}

          {/* Dragonknight Cadence & Mechanics Card */}
          {analysis.dkStats && (
            <DKCadenceCard
              dkStats={analysis.dkStats}
              fightDurationSec={analysis.fightMeta.durationSec}
              onOpenBossFeedback={() => setIsBossFeedbackOpen(true)}
            />
          )}

          {/* Arcanist Crux & Fatecarver Beam Graph */}
          {analysis.cruxStats && analysis.cruxStats.totalBeams > 0 && (
            <CruxBeamChart
              cruxStats={analysis.cruxStats}
              fightDurationSec={analysis.fightMeta.durationSec}
            />
          )}

          {/* Dynamic Damage Over Time (DoT) Uptimes Table */}
          {analysis.dotUptimes && analysis.dotUptimes.length > 0 && (
            <DoTUptimeTable
              dotUptimes={analysis.dotUptimes}
              fightDurationSec={analysis.fightMeta.durationSec}
            />
          )}

          {/* Interactive Optimality Chart */}
          <OptimalityChart
            timeline={analysis.timeline}
            selectedCycleIndex={selectedCycleIndex}
            onSelectCycle={idx => setSelectedCycleIndex(idx)}
          />

          {/* Pattern Distribution Comparison (Only for specs with rigid anchor patterns like Necro Blastbones) */}
          {analysis.spec.class.toLowerCase() !== 'arcanist' &&
            analysis.patternStats &&
            analysis.patternStats.length > 0 && (
              <PatternDistribution
                patterns={analysis.patternStats}
                totalCycles={analysis.totalCycles}
                nonStandardCount={analysis.nonStandardCyclesCount}
              />
            )}

          {/* Cycle Inspector List (Only for specs with rigid anchor patterns like Necro Blastbones) */}
          {analysis.spec.class.toLowerCase() !== 'arcanist' &&
            analysis.cycles &&
            analysis.cycles.length > 0 && (
              <CycleInspector
                cycles={analysis.cycles}
                selectedCycleIndex={selectedCycleIndex}
                onSelectCycle={idx => setSelectedCycleIndex(idx)}
              />
            )}
        </div>
      )}

      {/* Boss Feedback Modal across all known specs */}
      {analysis && (
        <BossFeedbackModal
          isOpen={isBossFeedbackOpen}
          onClose={() => setIsBossFeedbackOpen(false)}
          reportId={analysis.fightMeta.reportId}
          actorId={analysis.fightMeta.actorId}
          actorName={analysis.fightMeta.actorName}
          specName={analysis.spec.name}
          specClass={analysis.spec.class}
        />
      )}
    </div>
  );
}
