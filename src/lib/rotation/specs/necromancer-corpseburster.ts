import { RotationSpec } from '@/types/rotation';

export const shootingStarCorpsebursterNecro: RotationSpec = {
  id: 'shooting-star-corpseburster-necro',
  name: 'Shooting Star Corpseburster Necromancer',
  class: 'Necromancer',
  description:
    'A high-damage Corpseburster Necromancer build built around maintaining a strict Blastbones every 3rd cast cadence while weaving Detonating Siphon corpse detonations, DoTs, and Venom Skull filler.',
  authorNote:
    'Crucial rotation rules: Never delay Blastbones past the 3rd cast. Weave Detonating Siphon for Corpseburster procs whenever corpses are available, refresh expiring DoTs on time, and fill with Venom Skull. Fights are dynamic: execute whichever of the 4 valid patterns fits the current encounter state.',
  keySkills: {
    anchorSkill: {
      name: 'Blastbones',
      token: 'BB',
      aliases: [
        'Blighted Blastbones',
        'Stalking Blastbones',
        'Blastbones'
      ],
      guids: [117690, 114884, 114881],
      cadenceTarget: 3 // Cast every 3rd skill (BB -> Skill -> Skill -> BB)
    },
    siphonSkills: {
      aliases: [
        'Detonating Siphon',
        'Mystic Siphon',
        'Shocking Siphon'
      ],
      guids: [118763, 118764, 118758]
    },
    spammableSkills: {
      aliases: [
        'Venom Skull',
        'Ricochet Skull',
        'Flame Skull'
      ],
      guids: [123704, 123699, 123707]
    },
    dotSkills: {
      aliases: [
        'Unnerving Boneyard',
        'Avid Boneyard',
        'Boneyard',
        'Graveyard',
        'Stampede',
        'Critical Charge',
        'Skeletal Archer',
        'Skeletal Arcanist',
        'Skeletal Mage',
        'Sundering Burst',
        'Anti-Cavalry Caltrops',
        'Razor Caltrops',
        'Caltrops',
        'Proximity Terror',
        'Proxy Det',
        'Proximity Detonation',
        'Deadly Cloak',
        'Quick Cloak',
        'Blade Cloak',
        'Radiate',
        'Barb Trap',
        'Lightweight Beast Trap',
        'Trap Beast',
        'Degeneration',
        'Structured Entropy',
        'Entropy',
        'Carve',
        'Brawler',
        'Twisting Path'
      ],
      guids: [
        117805, 117804, 117797, 38788, 38782, 118680, 118681, 118677,
        217465, 40255, 40259, 40242, 61503, 38940, 38937, 41838, 40382,
        40385, 40372, 40465, 38745
      ]
    },
    ultimateSkills: {
      aliases: [
        'Shooting Star',
        'Meteor',
        'Ice Comet',
        'Pestilent Colossus',
        'Glacial Colossus',
        'Frozen Colossus',
        'Ravenous Goliath',
        'Pummeling Goliath'
      ],
      guids: [40493, 40489, 40490, 122174, 122388, 122177]
    },
    mechanicSkills: {
      aliases: [
        'Mirror' // Lucent Citadel mirror mechanic
      ],
      guids: [213069]
    }
  },
  patterns: [
    {
      id: 'bb-siphon-dot',
      name: 'BB - Siphon - Dot',
      sequence: ['BB', 'Siphon', 'Dot'],
      description:
        'Main sequence: Used when one DoT is expiring and a corpse is ready for Siphon detonation.'
    },
    {
      id: 'bb-dot-dot',
      name: 'BB - Dot - Dot',
      sequence: ['BB', 'Dot', 'Dot'],
      description:
        'Dual DoT refresh: Used when two DoTs expire simultaneously, skipping Siphon temporarily while keeping BB on every 3rd cast.'
    },
    {
      id: 'bb-siphon-siphon',
      name: 'BB - Siphon - Siphon',
      sequence: ['BB', 'Siphon', 'Siphon'],
      description:
        'Corpse explosion spammable: All DoTs running with abundant corpses to detonate for max Corpseburster damage.'
    },
    {
      id: 'bb-siphon-skull',
      name: 'BB - Siphon - Skulls',
      sequence: ['BB', 'Siphon', 'Skull'],
      description:
        'Corpse starve filler: Used when a previous ability consumed the corpse (e.g. Graveyard) and no DoTs need refreshing, filling with Venom Skull.'
    }
  ],
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
    'Healing Combustion',
    'Soul Siphon',
    'Charged Synergy',
    'Bone Wall Synergy'
  ]
};
