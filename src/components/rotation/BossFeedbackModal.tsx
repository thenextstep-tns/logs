'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Swords
} from 'lucide-react';

interface BossFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  actorId: number;
  actorName: string;
  specName: string;
  specClass: string;
}

interface BossSummaryResponse {
  success: boolean;
  reportTitle: string;
  actorName: string;
  actorClass: string;
  specName: string;
  bossCount: number;
  totalCandidateBossFights: number;
  killsOnly: boolean;
  discordTextWithExplanations: string;
  discordTextWithoutExplanations: string;
  bossFightsList: Array<{
    id: number;
    name: string;
    kill?: boolean;
    durationSec: number;
  }>;
}

export const BossFeedbackModal: React.FC<BossFeedbackModalProps> = ({
  isOpen,
  onClose,
  reportId,
  actorId,
  actorName,
  specName,
  specClass
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BossSummaryResponse | null>(null);
  const [killsOnly, setKillsOnly] = useState<boolean>(true);
  const [includeExplanations, setIncludeExplanations] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchBossFeedback = async (isKillsOnly: boolean) => {
    if (!reportId || !actorId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rotation/boss-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          actorId,
          killsOnly: isKillsOnly
        })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to fetch boss feedback.');
      }

      setData(resData);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while analyzing bosses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBossFeedback(killsOnly);
    }
  }, [isOpen, reportId, actorId]);

  const handleToggleKillsOnly = (newKillsOnly: boolean) => {
    setKillsOnly(newKillsOnly);
    fetchBossFeedback(newKillsOnly);
  };

  const handleCopy = async () => {
    if (!data) return;
    const textToCopy = includeExplanations
      ? data.discordTextWithExplanations
      : data.discordTextWithoutExplanations;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (!isOpen) return null;

  const currentDiscordText = data
    ? includeExplanations
      ? data.discordTextWithExplanations
      : data.discordTextWithoutExplanations
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-eso-card border border-eso-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-eso-border/60 flex items-center justify-between bg-eso-dark/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-eso-gold/10 border border-eso-gold/30 text-eso-gold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Boss Feedback
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                  {specName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Discord-ready boss-by-boss summary for <span className="text-white font-medium">{actorName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-3.5 px-5 bg-black/40 border-b border-eso-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Filter Toggles */}
          <div className="flex items-center gap-2">
            <div className="bg-eso-dark border border-eso-border rounded-lg p-0.5 flex items-center text-[11px]">
              <button
                onClick={() => handleToggleKillsOnly(true)}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  killsOnly
                    ? 'bg-eso-gold text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Boss Kills Only
              </button>
              <button
                onClick={() => handleToggleKillsOnly(false)}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  !killsOnly
                    ? 'bg-eso-gold text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Boss Pulls
              </button>
            </div>

            {/* Explanation Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-[11px] ml-2">
              <input
                type="checkbox"
                checked={includeExplanations}
                onChange={e => setIncludeExplanations(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-eso-gold focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Include Overall Summary & Key Mechanics</span>
            </label>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={isLoading || !data}
            className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-eso-gold to-eso-goldDark hover:from-eso-goldLight hover:to-eso-gold text-slate-950'
            } disabled:opacity-40`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Discord Text
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
              <RefreshCw className="w-8 h-8 text-eso-gold animate-spin" />
              <div className="text-sm font-semibold text-white">Analyzing Boss Encounters...</div>
              <p className="text-xs text-slate-400 max-w-sm">
                Fetching cast, buff, and combat event streams across boss fights for {actorName}.
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">Failed to Generate Summary</div>
                <div className="text-xs text-rose-300/80 mt-1">{error}</div>
                <button
                  onClick={() => fetchBossFeedback(killsOnly)}
                  className="mt-3 px-3 py-1 rounded bg-rose-800/60 hover:bg-rose-700/60 text-xs font-semibold text-white transition"
                >
                  Retry Analysis
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && data && (
            <div className="space-y-3">
              {/* Encounter Badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">
                  {data.bossCount} Boss Encounter{data.bossCount === 1 ? '' : 's'} Analyzed:
                </span>
                {data.bossFightsList.map(b => (
                  <span
                    key={b.id}
                    className={`px-2 py-0.5 rounded border text-[10px] font-mono ${
                      b.kill
                        ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                        : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                    }`}
                  >
                    #{b.id} {b.name} ({b.kill ? 'Kill' : 'Wipe'}, {b.durationSec}s)
                  </span>
                ))}
              </div>

              {/* Formatted Markdown Box */}
              <div className="relative group">
                <pre className="p-4 rounded-xl bg-black/60 border border-eso-border/80 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                  {currentDiscordText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-eso-border/60 bg-eso-dark/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Formatted with Discord markdown headers & bullets. Ready to paste directly into Discord channels.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
