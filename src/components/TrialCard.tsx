'use client';

import React from 'react';
import Link from 'next/link';
import { ESOZone } from '@/types/esologs';
import { ChevronRight, Hash } from 'lucide-react';

interface TrialCardProps {
  zone: ESOZone;
}

export const TrialCard: React.FC<TrialCardProps> = ({ zone }) => {
  return (
    <div className="bg-eso-card/90 rounded-xl border border-eso-border hover:border-eso-gold/50 transition-all duration-300 shadow-lg hover:shadow-eso-gold/5 flex flex-col justify-between overflow-hidden group">
      {/* Header */}
      <div className="p-4 border-b border-eso-border/60 bg-gradient-to-r from-eso-card to-eso-cardHover flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-white group-hover:text-eso-goldLight transition-colors">
          {zone.name}
        </h3>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-eso-border/80 text-eso-gold border border-eso-gold/30 flex-shrink-0">
          <Hash className="w-3 h-3" /> Zone {zone.id}
        </span>
      </div>

      {/* Boss list */}
      <div className="p-4 flex-1">
        <div className="grid grid-cols-1 gap-1.5">
          {zone.encounters && zone.encounters.length > 0 ? (
            zone.encounters.map((boss) => (
              <Link
                key={boss.id}
                href={`/roster/${boss.id}?zoneId=${zone.id}&bossName=${encodeURIComponent(boss.name)}&trialName=${encodeURIComponent(zone.name)}`}
                className="group/boss flex items-center justify-between p-2 rounded-lg bg-eso-dark/60 hover:bg-eso-gold/10 border border-eso-border/60 hover:border-eso-gold/40 transition-all text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 group-hover/boss:text-eso-gold bg-eso-card px-1.5 py-0.5 rounded border border-eso-border">
                    ID: {boss.id}
                  </span>
                  <span className="font-medium text-slate-200 group-hover/boss:text-white transition-colors">
                    {boss.name}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/boss:text-eso-gold group-hover/boss:translate-x-0.5 transition-all" />
              </Link>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic py-2">No encounters found for this zone.</p>
          )}
        </div>
      </div>
    </div>
  );
};
