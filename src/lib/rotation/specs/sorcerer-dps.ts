import { RotationSpec } from '@/types/rotation';

export const sorcererDPS: RotationSpec = {
  id: 'sorcerer-dps',
  name: 'Sorcerer DPS (Dynamic Priority)',
  class: 'Sorcerer',
  description:
    'High-intensity Sorcerer DPS rotation based on dynamic priority: Crystal Fragments procs, Bound Armaments (4+/8 stacks), Status Knife maintenance, Haunting Curse explosions, and DoT upkeep.',
  authorNote:
    'Rotation Priority: Crystal Frag Proc > Stampede > Hurricane > Bound Armaments (4+/8 stacks) > Barbed Trap > Liquid Lightning > Haunting Curse > Status Knife. In raid, refresh Knife ~1s before 10s CD (8.5s - 9.8s). Haunting Curse explodes at 3.5s and 8.5s; never recast before the 2nd explosion (< 8.5s). If running Shattered Paths Signet mythic, Ultimate must never drop below 133, and Power Overload opener must deactivate before hitting 133.',
  keySkills: {
    anchorSkill: {
      name: 'Crystal Fragments (Proc)',
      token: 'Frags',
      aliases: ['Crystal Fragments', 'Crystal Weapon', 'Crystal Shard'],
      guids: [114716, 46324],
      cadenceTarget: 0
    },
    siphonSkills: {
      aliases: ['Bound Armaments', 'Bound Aegis', 'Bound Armor'],
      guids: [24165]
    },
    spammableSkills: {
      aliases: [
        'Crystal Fragments',
        'Crystal Weapon',
        'Bound Armaments',
        'Traveling Knife',
        'Sundering Knife',
        'Crushing Weapon',
        'Force Pulse',
        'Crushing Shock'
      ],
      guids: [114716, 46324, 24165, 217872]
    },
    dotSkills: {
      aliases: [
        'Haunting Curse',
        'Daedric Prey',
        'Daedric Tomb',
        'Daedric Mines',
        'Stampede',
        'Critical Charge',
        'Hurricane',
        'Thundering Presence',
        'Lightning Form',
        'Liquid Lightning',
        'Lightning Flood',
        'Barbed Trap',
        'Lightweight Beast Trap',
        'Trap Beast',
        'Quick Cloak',
        'Deadly Cloak',
        'Blade Cloak',
        'Carve',
        'Degeneration'
      ],
      guids: [
        24330, 24326, 24328, 38788, 38782, 23231, 23227, 23200, 23203,
        40382, 40385, 38901, 38940, 38745, 40465
      ]
    },
    ultimateSkills: {
      aliases: [
        'Power Overload',
        'Energy Overload',
        'Overload',
        'Greater Storm Atronach',
        'Summon Charged Atronach',
        'Storm Atronach',
        'Flawless Dawnbreaker'
      ],
      guids: [24785, 24788, 23634, 23635, 40161]
    },
    mechanicSkills: {
      aliases: [
        'Summon Volatile Familiar',
        'Summon Twilight Tormentor',
        'Dark Deal'
      ],
      guids: [23319, 24636, 24584]
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
