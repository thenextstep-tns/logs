'use client';

import React, { useState } from 'react';
import { SkillStat } from '@/types/esologs';
import { Wand2, Zap, Sparkles } from 'lucide-react';

interface SkillsPopularityViewProps {
  skills: SkillStat[];
  sampleCount: number;
}

export const SkillsPopularityView: React.FC<SkillsPopularityViewProps> = ({
  skills,
  sampleCount
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-eso-gold" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Statistically Most Popular Skills &amp; Ultimates
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Ranked across {sampleCount} players
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {skills.length > 0 ? (
          skills.slice(0, 16).map((skill, idx) => {
            const iconUrl = skill.abilityIcon
              ? `https://assets.rpglogs.com/img/eso/abilities/${skill.abilityIcon}.png`
              : null;

            return (
              <div
                key={skill.guid || idx}
                className="bg-eso-dark/70 rounded-xl border border-eso-border/80 hover:border-eso-gold/40 p-3 flex items-center justify-between gap-3 group transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Skill Icon */}
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-eso-card border border-eso-border/80 flex-shrink-0 flex items-center justify-center">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={skill.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          // Try jpg if png fails
                          const target = e.currentTarget;
                          if (target.src.endsWith('.png')) {
                            target.src = `https://assets.rpglogs.com/img/eso/abilities/${skill.abilityIcon}.jpg`;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                    ) : (
                      <Zap className="w-5 h-5 text-eso-gold" />
                    )}
                  </div>

                  {/* Skill Name */}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 group-hover:text-eso-goldLight transition-colors truncate">
                      {skill.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      GUID: {skill.guid}
                    </div>
                  </div>
                </div>

                {/* Percentage */}
                <div className="flex flex-col items-end flex-shrink-0 font-mono">
                  <span className="text-xs font-bold text-eso-gold bg-eso-card px-2 py-0.5 rounded border border-eso-border">
                    {skill.percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {skill.count} / {sampleCount}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-500 italic py-4 col-span-full text-center">
            No skill usage data recorded for this class and role.
          </p>
        )}
      </div>
    </div>
  );
};
