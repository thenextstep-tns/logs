import { RotationSpec } from '@/types/rotation';

export const arcanistDPS: RotationSpec = {
  id: 'arcanist-dps',
  name: 'Arcanist DPS (Fatecarver)',
  class: 'Arcanist',
  description:
    'Arcanist rotation built around generating 3 Crux with Cephaliarch\'s Flail or Runeblades, then unleashing a full channeled Fatecarver beam while maintaining DoTs.',
  authorNote:
    'Core rule: Always generate 3 Crux before casting Fatecarver. Fatecarver is a channeled beam (4.5s full cast: 0.5s initial windup + 4.0s of damage ticks = 12 pulses; Exhausting morph scales with Crux to 4.8s at 1 Crux, 5.2s at 2 Crux, and 5.5s at 3 Crux, in each case with 0.5s windup). Skills cannot cancel Fatecarver and are queued in the buffer; only Bash, Block, Roll Dodge, or Break Free interrupt the channel early.',
  keySkills: {
    anchorSkill: {
      name: 'Pragmatic Fatecarver',
      token: 'Beam',
      aliases: [],
      guids: [],
      cadenceTarget: 0
    },
    siphonSkills: {
      // Crux builder
      aliases: [
        "Cephaliarch's Flail",
        'Tentacular Dread',
        'Abyssal Impact'
      ],
      guids: [183006, 185805, 182976]
    },
    spammableSkills: {
      aliases: [
        'Writhing Runeblades',
        'Escalating Runeblades',
        'Runeblades'
      ],
      guids: [183122, 185808]
    },
    dotSkills: {
      aliases: [
        'Fulminating Rune',
        'Rune of Uncanny Adoration',
        'Rune of Displacement',
        'Runespite Ward',
        'Inspired Scholarship',
        'Cruxweaver Armor',
        'Barbed Trap',
        'Lightweight Beast Trap',
        'Trap Beast',
        'Stampede',
        'Critical Charge',
        'Quick Cloak',
        'Deadly Cloak',
        'Blade Cloak',
        'Anti-Cavalry Caltrops',
        'Razor Caltrops',
        'Caltrops',
        'Degeneration',
        'Carve'
      ],
      guids: [
        182988, 185842, 185908, 40382, 40385, 38788, 38782, 38901,
        38940, 40255, 40259, 40465, 38745
      ]
    },
    ultimateSkills: {
      aliases: [
        'The Languid Eye',
        'Tide King\'s Gaze',
        'The Unblinking Eye',
        'Gibbering Shelter',
        'Sanctum of the Abyssal Sea'
      ],
      guids: [189867, 185848, 182985, 185860]
    },
    mechanicSkills: {
      aliases: [
        'Mirror'
      ],
      guids: [213069]
    }
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
