import { RotationSpec } from '@/types/rotation';

export const dkParse: RotationSpec = {
  id: 'dragonknight-parse',
  name: 'Parse Dragonknight (Pure DPS)',
  role: 'pure_dps',
  class: 'Dragonknight',
  description:
    'Max-output Dragonknight DPS optimizing the dual whip mini-games: Flame Lash burst during Off-Balance (Power Lash) or Molten Whip at 3 stacks of Seething Fury, combined with Magma Fist (Heat Shock 3 stacks), Status Knife, and timed Standard usage.',
  authorNote:
    'If running Flame Lash: hit the boss as early as possible in Off-Balance for Power Lash without losing DoTs. If running Molten Whip: unleash at 3 stacks of Seething Fury. Magma Fist (3 stacks) and Status Knife take priority over whip casts when refreshing is required. Both whips are valid spammables when DoTs are ticking.',
  keySkills: {
    anchorSkill: {
      name: 'Flame Lash / Molten Whip',
      token: 'Whip',
      aliases: ['Flame Lash', 'Power Lash', 'Molten Whip', 'Lava Whip'],
      guids: [20816, 20805, 20824],
      cadenceTarget: 0
    },
    siphonSkills: {
      aliases: ['Magma Fist', 'Stonefist'],
      guids: [31816, 258293]
    },
    spammableSkills: {
      aliases: [
        'Flame Lash',
        'Power Lash',
        'Molten Whip',
        'Lava Whip',
        'Magma Fist',
        'Traveling Knife',
        'Sundering Knife',
        'Shattering Knife'
      ],
      guids: [20816, 20805, 31816, 217872, 217353]
    },
    dotSkills: {
      aliases: [
        'Searing Claw',
        'Burning Embers',
        'Venomous Claw',
        'Disintegrating Dragonfire',
        'Engulfing Flames',
        'Noxious Breath',
        'Flames of Oblivion',
        'Stampede',
        'Carve',
        'Barbed Trap'
      ],
      guids: [20668, 20663, 20944, 20930, 32853, 38788, 38745, 40382]
    },
    ultimateSkills: {
      aliases: [
        'Standard of Might',
        'Shifting Standard',
        'Dragonknight Standard',
        'Flawless Dawnbreaker'
      ],
      guids: [32947, 32958, 40161]
    },
    mechanicSkills: {
      aliases: ['Igneous Weapons', 'Shatterspike Mantle'],
      guids: [31874, 20323]
    }
  },
  patterns: [],
  nonGCDSkills: [
    'Swap Weapons',
    'Break Free',
    'Purify',
    'Synergy',
    'Block',
    'Bash'
  ]
};
