'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  error?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Encounter Error',
  error = 'An error occurred while fetching ESOlogs reports.',
  onRetry
}) => {
  return (
    <div className="bg-eso-card border border-red-900/50 rounded-xl p-8 text-center space-y-4 shadow-xl max-w-xl mx-auto">
      <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-red-300/80 font-mono bg-eso-dark p-3 rounded border border-red-900/40">
          {error}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-eso-border hover:bg-eso-cardHover text-xs font-semibold text-white border border-eso-border flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Query</span>
          </button>
        )}
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-eso-gold hover:bg-eso-goldLight text-xs font-bold text-eso-dark flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trial List</span>
        </Link>
      </div>
    </div>
  );
};
