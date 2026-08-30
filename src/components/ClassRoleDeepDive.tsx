'use client';

import React, { useState } from 'react';
import { ClassRoleStats } from '@/types/esologs';
import { GearCombinationsView } from './GearCombinationsView';
import { SkillsPopularityView } from './SkillsPopularityView';
import { Shield, Sparkles, Wand2, ShieldCheck, UserCheck, Layers } from 'lucide-react';

interface ClassRoleDeepDiveProps {
  classRoles: ClassRoleStats[];
}

export const ClassRoleDeepDive: React.FC<ClassRoleDeepDiveProps> = ({ classRoles }) => {
  const [selectedKey, setSelectedKey] = useState<string>(
    classRoles.length > 0 ? classRoles[0].classRoleKey : ''
  );
  const [activeTab, setActiveTab] = useState<'gear' | 'skills'>('gear');

  const selectedClassRole =
    classRoles.find((cr) => cr.classRoleKey === selectedKey) || classRoles[0];

  if (!classRoles || classRoles.length === 0) {
    return (
      <div className="bg-eso-card rounded-xl border border-eso-border p-8 text-center text-slate-400">
        No class-role data recorded in the selected kill time window.
      </div>
    );
  }

  // Group by role for easy navigation
  const tanks = classRoles.filter((cr) => cr.role === 'Tank');
  const healers = classRoles.filter((cr) => cr.role === 'Healer');
  const dps = classRoles.filter((cr) => cr.role === 'Damage Dealer');

  const renderPills = (list: ClassRoleStats[], roleLabel: string, colorClass: string) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {roleLabel} ({list.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {list.map((cr) => {
            const isSelected = cr.classRoleKey === selectedClassRole.classRoleKey;
            return (
              <button
                key={cr.classRoleKey}
                type="button"
                onClick={() => setSelectedKey(cr.classRoleKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? `bg-eso-gold text-eso-dark border-eso-gold shadow-md shadow-eso-gold/20 font-bold scale-[1.02]`
                    : `bg-eso-dark hover:bg-eso-cardHover text-slate-300 border-eso-border hover:border-eso-gold/40`
                }`}
              >
                <span>{cr.className}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-eso-dark/30 text-eso-dark' : 'bg-eso-card text-slate-400 border border-eso-border'
                  }`}
                >
                  {cr.sampleCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-eso-gold" />
          <h2 className="text-xl font-bold text-white">
            2. Build Loadouts (Gear Combos &amp; Skills)
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Select class &amp; role below
        </div>
      </div>

      {/* Class Role Selector Card */}
      <div className="bg-eso-card rounded-xl border border-eso-border p-5 space-y-4 shadow-lg">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-eso-gold" />
          <span>Active Class &amp; Role Selector</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {renderPills(tanks, 'Tanks', 'border-eso-tank/40')}
          {renderPills(healers, 'Healers', 'border-eso-healer/40')}
          {renderPills(dps, 'Damage Dealers', 'border-eso-dps/40')}
        </div>
      </div>

      {/* Selected Class-Role Detail Container */}
      {selectedClassRole && (
        <div className="bg-eso-card rounded-xl border border-eso-border overflow-hidden shadow-xl">
          {/* Sub Header & Tabs */}
          <div className="p-5 border-b border-eso-border/60 bg-gradient-to-r from-eso-card to-eso-cardHover flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-eso-border text-eso-gold border border-eso-gold/30">
                  {selectedClassRole.role}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedClassRole.sampleCount} player builds analyzed
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                {selectedClassRole.className} ({selectedClassRole.role})
              </h3>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center bg-eso-dark p-1 rounded-lg border border-eso-border">
              <button
                type="button"
                onClick={() => setActiveTab('gear')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'gear'
                    ? 'bg-eso-gold text-eso-dark shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Gear Combinations</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('skills')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'skills'
                    ? 'bg-eso-gold text-eso-dark shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Popular Skills</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {activeTab === 'gear' ? (
              <GearCombinationsView
                classRoleKey={selectedClassRole.classRoleKey}
                sampleCount={selectedClassRole.sampleCount}
                gearCombinations={selectedClassRole.gearCombinations}
                popularSets={selectedClassRole.popularSets}
              />
            ) : (
              <SkillsPopularityView
                skills={selectedClassRole.popularSkills}
                sampleCount={selectedClassRole.sampleCount}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
