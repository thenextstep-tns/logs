'use client';

import React, { useState, useEffect } from 'react';
import { ESOZone } from '@/types/esologs';
import { TrialCard } from '@/components/TrialCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Search, ShieldAlert, Sparkles, Swords, Compass } from 'lucide-react';

export default function HomePage() {
  const [trials, setTrials] = useState<ESOZone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchTrials = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/zones');
      const data = await res.json();
      if (data.success && Array.isArray(data.trials)) {
        setTrials(data.trials);
      } else {
        setError(data.error || 'Failed to load ESO trial zones.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching trial zones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrials();
  }, []);

  const filteredTrials = trials.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesTrial = t.name.toLowerCase().includes(q);
    const matchesBoss = t.encounters?.some((b) => b.name.toLowerCase().includes(q));
    return matchesTrial || matchesBoss;
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-eso-card via-eso-cardHover to-eso-card rounded-2xl border border-eso-border/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-eso-gold/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eso-dark/80 border border-eso-gold/30 text-eso-gold text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Veteran Hard Mode Roster Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ESO Veteran Hard Mode Trials
            </h1>
            <p className="text-sm text-slate-300">
              Select any trial and boss encounter to fetch all Hard Mode kill reports, inspect kill durations, filter by speed, and analyze group compositions, full gear build combinations, and skill choices.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trial or boss..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-eso-dark border border-eso-border focus:border-eso-gold/60 focus:ring-1 focus:ring-eso-gold/40 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <LoadingState
          message="Loading Hard Mode Trial Zones..."
          subMessage="Fetching dynamic zone & encounter list from ESOlogs API"
        />
      ) : error ? (
        <ErrorState
          title="Failed to Load Trials"
          error={error}
          onRetry={fetchTrials}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>
              Showing {filteredTrials.length} of {trials.length} HM Trial Zones
            </span>
            <span>Difficulty: 122 (Veteran HM)</span>
          </div>

          {filteredTrials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrials.map((zone) => (
                <TrialCard key={zone.id} zone={zone} />
              ))}
            </div>
          ) : (
            <div className="bg-eso-card border border-eso-border rounded-xl p-12 text-center text-slate-400">
              No trials match &quot;{searchQuery}&quot;. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
