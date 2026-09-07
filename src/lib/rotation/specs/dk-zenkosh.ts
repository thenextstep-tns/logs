import { RotationSpec } from '@/types/rotation';

export const dkZenkosh: RotationSpec = {
  id: 'dragonknight-zenkosh',
  name: "Zenkosh Dragonknight (Support DPS)",
  role: 'support_dps',
  class: 'Dragonknight',
  description:
    "Support DPS Dragonknight running Z'en's Redress and/or Roar of Alkosh. Focuses on sustaining 5 distinct DoTs, maintaining Magma Fist Heat Shock (3 stacks), refreshing Status Knife, keeping up Igneous Weapons, and timing Power Lash during Off-Balance.",
  authorNote:
    "Priority: Maintain Magma Fist 3 stacks (~6s refresh) & Status Knife (~9s refresh) > Align Flame Lash with Off-Balance phases (Power Lash) without letting core DoTs drop > Standard of Might on cooldown (or held for burn phases) > Igneous Weapons (60s).",
  keySkills: {
    anchorSkill: {
      name: 'Magma Fist (Heat Shock)',
      token: 'Fist',
      aliases: ['Magma Fist', 'Stonefist', 'Obsidian Shard'],
      guids: [31816, 258293],
      cadenceTarget: 0
    },
    siphonSkills: {
      aliases: ['Flame Lash', 'Power Lash', 'Molten Whip', 'Lava Whip'],
      guids: [20816, 20805, 20824]
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
        'Fiery Breath',
        'Flames of Oblivion',
        'Cauterize',
        "Hunter's Fire",
        'Stampede',
        'Carve',
        'Barbed Trap',
        'Degeneration',
        'Scalding Rune'
      ],
      guids: [
        20668, 20663, 20657, 20944, 20930, 20917, 32853, 38788, 38745,
        40382, 40465, 40414
      ]
    },
    ultimateSkills: {
      aliases: [
        'Standard of Might',
        'Shifting Standard',
        'Dragonknight Standard',
        'Flawless Dawnbreaker',
        'Dawnbreaker'
      ],
      guids: [32947, 32958, 32948, 40161]
    },
    mechanicSkills: {
      aliases: [
        'Igneous Weapons',
        'Molten Weapons',
        'Shatterspike Mantle',
        'Hardened Armor',
        'Volatile Armor',
        'Spiked Armor'
      ],
      guids: [31874, 20323, 20319]
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
