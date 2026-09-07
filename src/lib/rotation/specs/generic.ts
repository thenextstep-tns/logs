import { RotationSpec } from '@/types/rotation';

/**
 * Fallback generic rotation tracker for specs that do not yet have a specialized pattern model.
 * Analyzes global cooldown pacing (1000ms GCD), Light Attack weaving efficiency,
 * animation cancelling (Bar Swaps), idle downtime, and inactivity windows without failing.
 */
export function createGenericSpec(className: string): RotationSpec {
  const normalizedClass = className.trim();
  return {
    id: `generic-${normalizedClass.toLowerCase().replace(/\s+/g, '-')}`,
    name: `${normalizedClass} (Standard Tracker)`,
    class: normalizedClass,
    description: `Global cooldown, LA weaving, and active uptime tracker for ${normalizedClass}.`,
    authorNote: `No custom rotation pattern model is registered for ${normalizedClass} yet. Evaluating global cooldown cadence, light attack weaving, animation cancels, and inactive windows.`,
    isRecognized: false,
    keySkills: {
      anchorSkill: {
        name: 'Active Skill',
        token: 'BB',
        aliases: [],
        guids: [],
        cadenceTarget: 1
      },
      siphonSkills: { aliases: [], guids: [] },
      spammableSkills: { aliases: [], guids: [] },
      dotSkills: { aliases: [], guids: [] },
      ultimateSkills: { aliases: [], guids: [] },
      mechanicSkills: { aliases: ['Mirror'], guids: [213069] }
    },
    patterns: [],
    nonGCDSkills: [
      'Swap Weapons',
      'Break Free',
      'Purify',
      'Grave Robber',
      'Harvest',
      'Blood Feast',
      'Runebreak',
      'Shackle',
      'Restore Health',
      'Healing Combustion'
    ]
  };
}
