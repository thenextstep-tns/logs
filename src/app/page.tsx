'use client';

import React, { useState, useEffect } from 'react';
import { ESOZone } from '@/types/esologs';
import { TrialCard } from '@/components/TrialCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Search } from 'lucide-react';

export default function HomePage() {
  const [trials, setTrials] = useState<ESOZone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchTrials = async () => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/zones', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `API returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.trials)) {
        setTrials(data.trials);
      } else {
        setError(data.error || 'Failed to load ESO trial zones.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please verify your connection or API credentials.');
      } else {
        setError(err.message || 'Network error fetching trial zones.');
      }
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
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm font-semibold text-slate-300">
          Trials ({filteredTrials.length})
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trial or boss..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-eso-dark border border-eso-border focus:border-eso-gold/60 focus:ring-1 focus:ring-eso-gold/40 text-xs text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <LoadingState
          message="Loading Trials..."
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
          {filteredTrials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrials.map((zone) => (
                <TrialCard key={zone.id} zone={zone} />
              ))}
            </div>
          ) : (
            <div className="bg-eso-card border border-eso-border rounded-xl p-8 text-center text-slate-400 text-xs">
              No trials match &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
