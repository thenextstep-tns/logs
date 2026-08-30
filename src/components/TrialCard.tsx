'use client';

import React from 'react';
import Link from 'next/link';
import { ESOZone } from '@/types/esologs';
import { Skull, Swords, ChevronRight, Hash, Shield } from 'lucide-react';

interface TrialCardProps {
  zone: ESOZone;
}

export const TrialCard: React.FC<TrialCardProps> = ({ zone }) => {
  return (
    <div className="bg-eso-card/90 rounded-xl border border-eso-border hover:border-eso-gold/50 transition-all duration-300 shadow-lg hover:shadow-eso-gold/5 flex flex-col justify-between overflow-hidden group">
      {/* Top Header */}
      <div className="p-5 border-b border-eso-border/60 bg-gradient-to-r from-eso-card to-eso-cardHover flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-eso-border/80 text-eso-gold border border-eso-gold/30">
              <Hash className="w-3 h-3" /> Zone {zone.id}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40 flex items-center gap-1">
              <Shield className="w-3 h-3" /> 12-Player Trial
            </span>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-eso-goldLight transition-colors">
            {zone.name}
          </h3>
        </div>
        <div className="w-9 h-9 rounded-lg bg-eso-dark/80 border border-eso-border flex items-center justify-center text-slate-400 group-hover:text-eso-gold group-hover:border-eso-gold/30 transition-colors">
          <Swords className="w-4 h-4" />
        </div>
      </div>

      {/* Boss list */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Skull className="w-3.5 h-3.5 text-eso-gold" />
            <span>Select Boss Encounter ({zone.encounters?.length || 0})</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {zone.encounters && zone.encounters.length > 0 ? (
              zone.encounters.map((boss) => (
                <Link
                  key={boss.id}
                  href={`/roster/${boss.id}?zoneId=${zone.id}&bossName=${encodeURIComponent(boss.name)}&trialName=${encodeURIComponent(zone.name)}`}
                  className="group/boss flex items-center justify-between p-2.5 rounded-lg bg-eso-dark/60 hover:bg-eso-gold/10 border border-eso-border/60 hover:border-eso-gold/40 transition-all text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono text-slate-400 group-hover/boss:text-eso-gold bg-eso-card px-1.5 py-0.5 rounded border border-eso-border">
                      ID: {boss.id}
                    </span>
                    <span className="font-medium text-slate-200 group-hover/boss:text-white transition-colors">
                      {boss.name}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover/boss:text-eso-gold group-hover/boss:translate-x-0.5 transition-all" />
                </Link>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No encounters found for this zone.</p>
            )}
          </div>
        </div>

        {/* Quick select first boss footer */}
        {zone.encounters && zone.encounters.length > 0 && (
          <div className="pt-2 border-t border-eso-border/40">
            <Link
              href={`/roster/${zone.encounters[0].id}?zoneId=${zone.id}&bossName=${encodeURIComponent(zone.encounters[0].name)}&trialName=${encodeURIComponent(zone.name)}`}
              className="w-full text-center text-xs font-semibold py-2 px-3 rounded-lg bg-eso-border/40 hover:bg-eso-gold hover:text-eso-dark text-slate-300 transition-all block"
            >
              Analyze Trial HM Roster
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
