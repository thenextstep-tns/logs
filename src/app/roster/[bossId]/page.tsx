'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BossReportsSummary, AggregatedRosterData, SupportFilter } from '@/types/esologs';
import { formatDuration } from '@/lib/esologs/aggregator';
import { KillTimeSlider } from '@/components/KillTimeSlider';
import { CompositionSummary } from '@/components/CompositionSummary';
import { ClassRoleDeepDive } from '@/components/ClassRoleDeepDive';
import { SupportCoreSelector } from '@/components/SupportCoreSelector';
import { FourSupportMatrixView } from '@/components/FourSupportMatrixView';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import {
  ArrowLeft,
  Skull,
  Shield,
  Clock,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  Hash
} from 'lucide-react';

export default function BossRosterPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bossId = Number(params?.bossId);
  const zoneId = searchParams.get('zoneId');
  const bossName = searchParams.get('bossName');
  const trialName = searchParams.get('trialName');

  // Step 1: Initial reports summary state
  const [reportsData, setReportsData] = useState<BossReportsSummary | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // Step 2: Selected duration window state
  const [minTime, setMinTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(Infinity);

  // Step 3: Support Filter State (2 Tanks + 2 Healers)
  const [supportFilter, setSupportFilter] = useState<SupportFilter | null>(null);

  // Step 4: Aggregated roster state
  const [rosterData, setRosterData] = useState<AggregatedRosterData | null>(null);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Fetch initial report count, min, and max kill times
  const fetchReportsSummary = async () => {
    if (!bossId || isNaN(bossId)) return;
    setIsLoadingReports(true);
    setReportsError(null);
    try {
      const res = await fetch(`/api/reports?bossId=${bossId}`);
      const data = await res.json();
      if (data.success) {
        setReportsData(data);
        setMinTime(data.minDuration);
        setMaxTime(data.maxDuration);

        // Fetch initial analytics
        fetchRosterAnalytics(data.minDuration, data.maxDuration);
      } else {
        setReportsError(data.error || 'Failed to fetch reports.');
      }
    } catch (err: any) {
      setReportsError(err.message || 'Network error fetching reports.');
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Fetch group composition, gear combos, and 4-support analysis within selected duration
  const fetchRosterAnalytics = async (
    selectedMin: number,
    selectedMax: number,
    filterOverride?: SupportFilter | null
  ) => {
    if (!bossId || isNaN(bossId)) return;
    setIsLoadingRoster(true);
    setRosterError(null);
    try {
      const currentFilterToUse = filterOverride !== undefined ? filterOverride : supportFilter;

      const query = new URLSearchParams({
        bossId: String(bossId),
        minTime: String(selectedMin),
        maxTime: String(selectedMax)
      });

      if (currentFilterToUse) {
        query.append('tank1', currentFilterToUse.tank1);
        query.append('tank2', currentFilterToUse.tank2);
        query.append('healer1', currentFilterToUse.healer1);
        query.append('healer2', currentFilterToUse.healer2);
      }

      const res = await fetch(`/api/roster?${query.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setRosterData(data.data);

        // Auto-select first available support combo if not already selected
        if (!currentFilterToUse && data.data.availableSupportCombos && data.data.availableSupportCombos.length > 0) {
          const top = data.data.availableSupportCombos[0];
          const initialFilter = {
            tank1: top.tank1,
            tank2: top.tank2,
            healer1: top.healer1,
            healer2: top.healer2
          };
          setSupportFilter(initialFilter);
          // Re-fetch with this initial filter
          fetchRosterAnalytics(selectedMin, selectedMax, initialFilter);
        }
      } else {
        setRosterError(data.error || 'Failed to calculate roster statistics.');
      }
    } catch (err: any) {
      setRosterError(err.message || 'Network error fetching roster analytics.');
    } finally {
      setIsLoadingRoster(false);
    }
  };

  useEffect(() => {
    fetchReportsSummary();
  }, [bossId]);

  const handleApplyTimeFilter = (newMin: number, newMax: number) => {
    setMinTime(newMin);
    setMaxTime(newMax);
    fetchRosterAnalytics(newMin, newMax, supportFilter);
  };

  const handleApplySupportFilter = (newSupportFilter: SupportFilter) => {
    setSupportFilter(newSupportFilter);
    fetchRosterAnalytics(minTime, maxTime, newSupportFilter);
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-eso-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All HM Trials</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-eso-card border border-eso-border text-slate-300">
            Encounter Boss ID: <strong className="text-eso-gold">{bossId}</strong>
          </span>
          {zoneId && (
            <span className="px-2.5 py-1 rounded bg-eso-card border border-eso-border text-slate-300">
              Zone ID: <strong className="text-eso-gold">{zoneId}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Main Boss Header Card */}
      <div className="bg-gradient-to-r from-eso-card via-eso-cardHover to-eso-card rounded-2xl border border-eso-border/80 p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-eso-border text-eso-gold border border-eso-gold/30">
                {trialName ? decodeURIComponent(trialName) : `Zone ${zoneId || ''}`}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-800/40">
                Veteran Hard Mode (Diff 122)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {bossName ? decodeURIComponent(bossName) : `Boss Encounter ${bossId}`}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-eso-dark border border-eso-border flex items-center gap-3">
              <Skull className="w-6 h-6 text-eso-gold" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                  Encounter Type
                </div>
                <div className="text-xs font-bold text-white">12-Player Hard Mode</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Summary & Constraint Filter */}
      {isLoadingReports ? (
        <LoadingState
          message="Fetching Boss Kill Reports..."
          subMessage={`Querying ESOlogs for Boss ID ${bossId} with difficulty=122 (Veteran HM)`}
        />
      ) : reportsError ? (
        <ErrorState
          title="Failed to Fetch Boss Reports"
          error={reportsError}
          onRetry={fetchReportsSummary}
        />
      ) : reportsData && reportsData.totalReports === 0 ? (
        <div className="bg-eso-card rounded-xl border border-eso-border p-12 text-center space-y-3">
          <Info className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Hard Mode Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            ESOlogs does not have any recorded Veteran Hard Mode (diff 122) kills for this boss.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-eso-gold text-eso-dark font-bold text-xs"
          >
            Select Another Trial Boss
          </Link>
        </div>
      ) : reportsData ? (
        <div className="space-y-8">
          {/* 1. Kill Time Constraint Slider */}
          <KillTimeSlider
            totalReports={reportsData.totalReports}
            totalUniqueKills={reportsData.totalUniqueKills || reportsData.totalReports}
            minDuration={reportsData.minDuration}
            maxDuration={reportsData.maxDuration}
            reports={reportsData.reports}
            onApplyFilter={handleApplyTimeFilter}
            isLoading={isLoadingRoster}
          />

          {/* 2. 2-Tanks + 2-Healers Support Core Selector */}
          {rosterData?.availableSupportCombos && (
            <SupportCoreSelector
              availableCombos={rosterData.availableSupportCombos}
              currentFilter={supportFilter || undefined}
              onApplySupportFilter={handleApplySupportFilter}
              isLoading={isLoadingRoster}
            />
          )}

          {/* Analytics Results */}
          {isLoadingRoster ? (
            <LoadingState
              message="Analyzing 4-Support Core, Synergistic Gear &amp; DD Roster..."
              subMessage={`Aggregating logs in window ${formatDuration(minTime)} – ${formatDuration(maxTime)}`}
            />
          ) : rosterError ? (
            <ErrorState
              title="Roster Analytics Error"
              error={rosterError}
              onRetry={() => fetchRosterAnalytics(minTime, maxTime, supportFilter)}
            />
          ) : rosterData ? (
            <div className="space-y-10">
              {/* 4-Support Synergistic Gear & Recalculated DDs */}
              {rosterData.fourSupportAnalysis && (
                <FourSupportMatrixView analysis={rosterData.fourSupportAnalysis} />
              )}

              {/* Overall Group Composition */}
              <CompositionSummary
                composition={rosterData.composition}
                reportsAnalyzed={rosterData.reportsAnalyzed}
              />

              {/* General Class + Role Deep Dive */}
              <ClassRoleDeepDive classRoles={rosterData.classRoles} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
