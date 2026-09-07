import { RotationSpec } from '@/types/rotation';

export const dkTank: RotationSpec = {
  id: 'dragonknight-tank',
  name: 'Dragonknight Tank',
  role: 'tank',
  class: 'Dragonknight',
  description:
    'Dragonknight main tanking rotation emphasizing 100% Taunt uptime, continuous Major Breach and Crusher application, Maim uptime, Igneous Weapons group buff coverage, and Magma Fist Heat Shock debuff upkeep.',
  authorNote:
    'Maintain Taunt on the primary boss at all times. Keep Crusher and Major Breach continuously active. Maintain Igneous Weapons (60s group buff) and cast Igneous Shield for group Major Mending and personal shield. If running Magma Fist, maintain 3 stacks of Heat Shock on the boss with ~6s refreshes.',
  keySkills: {
    anchorSkill: {
      name: 'Pierce Armor / Taunt',
      token: 'Taunt',
      aliases: ['Pierce Armor', 'Puncture', 'Ransack', 'Inner Fire', 'Inner Rage', 'Inner Beast', 'Frost Clench', 'Destructive Clench'],
      guids: [38254, 38257, 42056, 42057, 39475, 38989],
      cadenceTarget: 0
    },
    siphonSkills: {
      aliases: ['Igneous Shield', 'Fragmented Shield', 'Obsidian Shield'],
      guids: [29224, 29228]
    },
    spammableSkills: {
      aliases: [
        'Pierce Armor',
        'Puncture',
        'Ransack',
        'Inner Rage',
        'Frost Clench',
        'Magma Fist',
        'Chains of Devastation',
        'Chains of Dominance',
        'Unrelenting Grip',
        'Heroic Slash',
        'Deep Slash',
        'Low Slash'
      ],
      guids: [38254, 42056, 38989, 31816, 20496, 38411, 38414]
    },
    dotSkills: {
      aliases: [
        'Blockade of Frost',
        'Elemental Blockade',
        'Wall of Elements',
        'Choking Talons',
        'Dark Talons',
        'Burning Talons',
        'Cinder Storm',
        'Eruption',
        'Ash Cloud'
      ],
      guids: [39028, 39018, 20251, 20254, 32715, 32710]
    },
    ultimateSkills: {
      aliases: [
        'Magma Shell',
        'Magma Armor',
        'Corrosive Armor',
        'Standard of Might',
        'Shifting Standard',
        'Dragonknight Standard',
        'Aggressive Horn',
        'Sturdy Horn',
        'War Horn'
      ],
      guids: [32744, 32749, 32947, 32958, 40223, 40220]
    },
    mechanicSkills: {
      aliases: [
        'Igneous Weapons',
        'Molten Weapons',
        'Balance',
        'Equilibrium',
        'Spell Symmetry',
        'Blood of the Elder Dragon',
        'Green Dragon Blood',
        'Coagulating Blood',
        'Dragon Blood',
        'Resolving Vigor',
        'Echoing Vigor',
        'Vigor'
      ],
      guids: [31874, 40441, 32722, 32729, 61507, 61503]
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
