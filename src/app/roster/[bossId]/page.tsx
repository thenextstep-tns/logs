'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BossReportsSummary,
  AggregatedRosterData,
  SupportFilter
} from '@/types/esologs';
import { KillTimeSlider } from '@/components/KillTimeSlider';
import { CompositionSummary } from '@/components/CompositionSummary';
import { SupportCoreSelector } from '@/components/SupportCoreSelector';
import { FourSupportMatrixView } from '@/components/FourSupportMatrixView';
import { ClassRoleDeepDive } from '@/components/ClassRoleDeepDive';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import {
  ArrowLeft,
  Flame,
  Shield,
  RefreshCw,
  Hash
} from 'lucide-react';

export default function BossRosterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const bossId = Number(params?.bossId);
  const zoneId = searchParams.get('zoneId');
  const bossName = searchParams.get('bossName');
  const trialName = searchParams.get('trialName');
  const initialDifficultyParam = searchParams.get('difficulty');

  // Step 1: Initial reports summary state
  const [reportsData, setReportsData] = useState<BossReportsSummary | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // Step 2: Active difficulty state
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | undefined>(
    initialDifficultyParam ? parseInt(initialDifficultyParam, 10) : undefined
  );

  // Step 3: Selected duration window state
  const [minTime, setMinTime] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(Infinity);

  // Step 4: Support Filter State (2 Tanks + 2 Healers)
  const [supportFilter, setSupportFilter] = useState<SupportFilter | null>(null);

  // Step 5: Aggregated roster state
  const [rosterData, setRosterData] = useState<AggregatedRosterData | null>(null);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Fetch initial report count, min, and max kill times for selected difficulty
  const fetchReportsSummary = async (diffToUse?: number) => {
    if (!bossId || isNaN(bossId)) return;
    setIsLoadingReports(true);
    setReportsError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const activeDiff = diffToUse !== undefined ? diffToUse : selectedDifficulty;

    try {
      const url = activeDiff
        ? `/api/reports?bossId=${bossId}&difficulty=${activeDiff}`
        : `/api/reports?bossId=${bossId}`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `API error (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setReportsData(data);
        setSelectedDifficulty(data.difficulty);
        setMinTime(data.minDuration);
        setMaxTime(data.maxDuration);

        // Fetch initial analytics for this difficulty
        fetchRosterAnalytics(data.minDuration, data.maxDuration, null, data.difficulty);
      } else {
        setReportsError(data.error || 'Failed to fetch reports.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setReportsError('Report summary request timed out. Please check your connection.');
      } else {
        setReportsError(err.message || 'Network error fetching reports.');
      }
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Fetch group composition, gear combos, and 4-support analysis within selected duration & difficulty
  const fetchRosterAnalytics = async (
    selectedMin: number,
    selectedMax: number,
    filterOverride?: SupportFilter | null,
    diffOverride?: number
  ) => {
    if (!bossId || isNaN(bossId)) return;
    setIsLoadingRoster(true);
    setRosterError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    const activeDiff = diffOverride !== undefined ? diffOverride : selectedDifficulty;

    try {
      const currentFilterToUse = filterOverride !== undefined ? filterOverride : supportFilter;

      const query = new URLSearchParams({
        bossId: String(bossId),
        minTime: String(selectedMin),
        maxTime: String(selectedMax)
      });

      if (activeDiff) {
        query.append('difficulty', String(activeDiff));
      }

      if (currentFilterToUse) {
        query.append('tank1', currentFilterToUse.tank1);
        query.append('tank2', currentFilterToUse.tank2);
        query.append('healer1', currentFilterToUse.healer1);
        query.append('healer2', currentFilterToUse.healer2);
      }

      const res = await fetch(`/api/roster?${query.toString()}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `API error (${res.status})`);
      }

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
          fetchRosterAnalytics(selectedMin, selectedMax, initialFilter, activeDiff);
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
    fetchReportsSummary(selectedDifficulty);
  }, [bossId]);

  const handleSelectDifficulty = (newDiff: number) => {
    if (newDiff === selectedDifficulty) return;
    setSelectedDifficulty(newDiff);
    setSupportFilter(null);
    fetchReportsSummary(newDiff);
  };

  const handleApplyTimeFilter = (newMin: number, newMax: number) => {
    setMinTime(newMin);
    setMaxTime(newMax);
    fetchRosterAnalytics(newMin, newMax, supportFilter, selectedDifficulty);
  };

  const handleApplySupportFilter = (newSupportFilter: SupportFilter) => {
    setSupportFilter(newSupportFilter);
    fetchRosterAnalytics(minTime, maxTime, newSupportFilter, selectedDifficulty);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-eso-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Trials</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-eso-card border border-eso-border text-slate-300">
            Boss ID: <strong className="text-eso-gold">{bossId}</strong>
          </span>
          {zoneId && (
            <span className="px-2.5 py-1 rounded bg-eso-card border border-eso-border text-slate-300">
              Zone: <strong className="text-eso-gold">{zoneId}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Main Boss Header Card with Difficulty Selector */}
      <div className="bg-eso-card rounded-xl border border-eso-border/80 p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-eso-border text-eso-gold border border-eso-gold/30">
                {trialName ? decodeURIComponent(trialName) : `Zone ${zoneId || ''}`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {bossName ? decodeURIComponent(bossName) : `Boss Encounter ${bossId}`}
            </h1>
          </div>

          {/* Difficulty Selector */}
          <div className="flex items-center gap-2">
            {reportsData?.availableDifficulties && reportsData.availableDifficulties.length > 1 ? (
              <div className="flex items-center gap-1.5 p-1 bg-eso-dark rounded-lg border border-eso-border">
                {reportsData.availableDifficulties.map((diffOpt) => {
                  const isActive = (selectedDifficulty || reportsData.difficulty) === diffOpt.id;
                  return (
                    <button
                      key={diffOpt.id}
                      onClick={() => handleSelectDifficulty(diffOpt.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                        isActive
                          ? diffOpt.isHardMode
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : 'bg-eso-gold text-eso-dark shadow-md shadow-eso-gold/20'
                          : 'text-slate-400 hover:text-white hover:bg-eso-card'
                      }`}
                    >
                      {diffOpt.isHardMode ? (
                        <Flame className="w-3.5 h-3.5" />
                      ) : (
                        <Shield className="w-3.5 h-3.5" />
                      )}
                      <span>{diffOpt.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-red-950/70 text-red-300 border border-red-800/40 font-mono">
                {reportsData?.difficultyLabel || rosterData?.difficultyLabel || 'Veteran'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reports Summary & Kill-Time Slider */}
      {isLoadingReports ? (
        <LoadingState
          message="Fetching Boss Reports..."
          subMessage="Retrieving speed rankings, kill counts, and duration range from ESOlogs"
        />
      ) : reportsError ? (
        <ErrorState
          title="Failed to Load Boss Reports"
          error={reportsError}
          onRetry={() => fetchReportsSummary(selectedDifficulty)}
        />
      ) : reportsData ? (
        <div className="space-y-6">
          {/* Step 1 & 2: Reports Fetched & Kill Time Range Constraint */}
          <KillTimeSlider
            totalReports={reportsData.totalReports}
            totalUniqueKills={reportsData.totalUniqueKills}
            minDuration={reportsData.minDuration}
            maxDuration={reportsData.maxDuration}
            onApplyFilter={handleApplyTimeFilter}
            reports={reportsData.reports}
            isLoading={isLoadingRoster}
          />

          {/* Step 3: Roster Analytics within Constraints */}
          {isLoadingRoster ? (
            <LoadingState
              message="Analyzing Combatant Gear, Skills & 4-Support Core..."
              subMessage="Parsing combatantInfo gear sets, ability slots, and DD compositions for this difficulty"
            />
          ) : rosterError ? (
            <ErrorState
              title="Roster Analytics Error"
              error={rosterError}
              onRetry={() => fetchRosterAnalytics(minTime, maxTime, supportFilter, selectedDifficulty)}
            />
          ) : rosterData ? (
            <div className="space-y-8">
              {/* Support Core Class Selector & Presets */}
              <SupportCoreSelector
                availableCombos={rosterData.availableSupportCombos || []}
                currentFilter={supportFilter || undefined}
                onApplySupportFilter={handleApplySupportFilter}
                isLoading={isLoadingRoster}
              />

              {/* 4-Player Support Gear Loadouts & Recalculated DD Roster */}
              <FourSupportMatrixView
                analysis={rosterData.fourSupportAnalysis}
              />

              {/* Overall Group Composition */}
              <CompositionSummary
                composition={rosterData.composition}
                reportsAnalyzed={rosterData.reportsAnalyzed}
              />

              {/* Deep-Dive: Gear Build Combinations & Ability Stats */}
              <ClassRoleDeepDive classRoles={rosterData.classRoles} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
