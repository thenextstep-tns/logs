'use client';

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Fetching live Hard Mode data from ESOlogs...',
  subMessage = 'Querying reports, durations, and encounter details'
}) => {
  return (
    <div className="bg-eso-card/80 border border-eso-border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-2 border-eso-border flex items-center justify-center bg-eso-dark">
          <Loader2 className="w-7 h-7 text-eso-gold animate-spin" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-eso-gold rounded-full shadow-lg">
          <Sparkles className="w-3 h-3 text-eso-dark" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-white tracking-wide">{message}</h3>
        <p className="text-xs text-slate-400 font-mono">{subMessage}</p>
      </div>
    </div>
  );
};
