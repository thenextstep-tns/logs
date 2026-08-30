'use client';

import React, { useState, useEffect } from 'react';
import { SupportFilter, AvailableSupportCombo } from '@/types/esologs';
import { Shield, Heart, Filter, Layers } from 'lucide-react';

interface SupportCoreSelectorProps {
  availableCombos: AvailableSupportCombo[];
  currentFilter?: SupportFilter;
  onApplySupportFilter: (filter: SupportFilter) => void;
  isLoading?: boolean;
}

const ESO_CLASSES = [
  'Arcanist',
  'DragonKnight',
  'Necromancer',
  'Nightblade',
  'Sorcerer',
  'Templar',
  'Warden'
];

export const SupportCoreSelector: React.FC<SupportCoreSelectorProps> = ({
  availableCombos,
  currentFilter,
  onApplySupportFilter,
  isLoading
}) => {
  // Default to top available combo if not set
  const defaultCombo = availableCombos.length > 0 ? availableCombos[0] : null;

  const [tank1, setTank1] = useState<string>(
    currentFilter?.tank1 || defaultCombo?.tank1 || 'Sorcerer'
  );
  const [tank2, setTank2] = useState<string>(
    currentFilter?.tank2 || defaultCombo?.tank2 || 'DragonKnight'
  );
  const [healer1, setHealer1] = useState<string>(
    currentFilter?.healer1 || defaultCombo?.healer1 || 'Arcanist'
  );
  const [healer2, setHealer2] = useState<string>(
    currentFilter?.healer2 || defaultCombo?.healer2 || 'Warden'
  );

  useEffect(() => {
    if (currentFilter) {
      setTank1(currentFilter.tank1);
      setTank2(currentFilter.tank2);
      setHealer1(currentFilter.healer1);
      setHealer2(currentFilter.healer2);
    } else if (defaultCombo) {
      setTank1(defaultCombo.tank1);
      setTank2(defaultCombo.tank2);
      setHealer1(defaultCombo.healer1);
      setHealer2(defaultCombo.healer2);
    }
  }, [currentFilter, availableCombos]);

  const handleApply = () => {
    onApplySupportFilter({ tank1, tank2, healer1, healer2 });
  };

  const handleSelectPredefined = (combo: AvailableSupportCombo) => {
    setTank1(combo.tank1);
    setTank2(combo.tank2);
    setHealer1(combo.healer1);
    setHealer2(combo.healer2);
    onApplySupportFilter({
      tank1: combo.tank1,
      tank2: combo.tank2,
      healer1: combo.healer1,
      healer2: combo.healer2
    });
  };

  const isCurrentFilterMatched = (combo: AvailableSupportCombo) => {
    const tMatch =
      (combo.tank1.toLowerCase() === tank1.toLowerCase() && combo.tank2.toLowerCase() === tank2.toLowerCase()) ||
      (combo.tank1.toLowerCase() === tank2.toLowerCase() && combo.tank2.toLowerCase() === tank1.toLowerCase());
    const hMatch =
      (combo.healer1.toLowerCase() === healer1.toLowerCase() && combo.healer2.toLowerCase() === healer2.toLowerCase()) ||
      (combo.healer1.toLowerCase() === healer2.toLowerCase() && combo.healer2.toLowerCase() === healer1.toLowerCase());
    return tMatch && hMatch;
  };

  return (
    <div className="bg-eso-card rounded-xl border border-eso-border p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-eso-border/60">
        <div>
          <h2 className="text-xl font-bold text-white">
            Select 2 Tanks &amp; 2 Healers
          </h2>
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-eso-gold to-eso-goldDark hover:from-eso-goldLight hover:to-eso-gold text-eso-dark font-bold text-xs shadow-lg shadow-eso-gold/10 hover:shadow-eso-gold/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Apply 4-Support Filter</span>
        </button>
      </div>

      {/* Discovered Support Setups in Logs (1-Click Meta Presets) */}
      {availableCombos.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {availableCombos.slice(0, 5).map((combo, idx) => {
              const active = isCurrentFilterMatched(combo);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPredefined(combo)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-eso-gold text-eso-dark border-eso-gold font-bold shadow-md shadow-eso-gold/10'
                      : 'bg-eso-dark/80 hover:bg-eso-cardHover border-eso-border text-slate-300 hover:border-eso-gold/40'
                  }`}
                >
                  <span>{combo.comboLabel}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      active ? 'bg-eso-dark/30 text-eso-dark' : 'bg-eso-card text-slate-400 border border-eso-border'
                    }`}
                  >
                    {combo.count} logs ({combo.percentage}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Picker Title / Prompt */}
      <div className="pt-2 text-xs font-semibold text-slate-300 flex items-center gap-2">
        <Layers className="w-4 h-4 text-eso-gold flex-shrink-0" />
        <span>If the suggested classes don&apos;t work for you, pick your combination, and we&apos;ll see if logs like these exist</span>
      </div>

      {/* Custom 4 Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tank 1 */}
        <div className="bg-eso-dark/60 p-3.5 rounded-xl border border-eso-tank/40 space-y-2">
          <label className="text-xs font-bold text-eso-tank flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Tank 1 Class
          </label>
          <select
            value={tank1}
            onChange={(e) => setTank1(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-eso-card border border-eso-border text-xs text-white outline-none focus:border-eso-gold"
          >
            {ESO_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Tank 2 */}
        <div className="bg-eso-dark/60 p-3.5 rounded-xl border border-eso-tank/40 space-y-2">
          <label className="text-xs font-bold text-eso-tank flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Tank 2 Class
          </label>
          <select
            value={tank2}
            onChange={(e) => setTank2(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-eso-card border border-eso-border text-xs text-white outline-none focus:border-eso-gold"
          >
            {ESO_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Healer 1 */}
        <div className="bg-eso-dark/60 p-3.5 rounded-xl border border-eso-healer/40 space-y-2">
          <label className="text-xs font-bold text-eso-healer flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Healer 1 Class
          </label>
          <select
            value={healer1}
            onChange={(e) => setHealer1(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-eso-card border border-eso-border text-xs text-white outline-none focus:border-eso-gold"
          >
            {ESO_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Healer 2 */}
        <div className="bg-eso-dark/60 p-3.5 rounded-xl border border-eso-healer/40 space-y-2">
          <label className="text-xs font-bold text-eso-healer flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Healer 2 Class
          </label>
          <select
            value={healer2}
            onChange={(e) => setHealer2(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-eso-card border border-eso-border text-xs text-white outline-none focus:border-eso-gold"
          >
            {ESO_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
