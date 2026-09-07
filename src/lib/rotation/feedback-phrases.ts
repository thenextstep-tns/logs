/**
 * Canned human-sounding coaching phrases tailored for ESO rotation review across different performance thresholds.
 * Contains ~70 ready phrases covering general assessment, Sorcerer, Arcanist, Necromancer, Light Attacks, Uptime, and Bar Swaps.
 */

// --- 1. OVERALL ASSESSMENTS ---
export const OVERALL_PHRASES = {
  CLEAN: [
    "Clean parsing overall across the board. Your core priorities and weaving discipline were on point.",
    "Overall solid performance throughout the trial with consistent rotation fundamentals.",
    "Really crisp execution across these fights — ability queues were tight and key mechanic windows were handled smoothly.",
    "Great rotational discipline throughout the trial, keeping downtime low and maintaining steady priority flow.",
    "Impression-worthy consistency here: your weaving cadence was sharp and abilities followed the ideal priority order.",
    "Strong parse mechanics overall. You stayed composed through mechanics with very few missed windows or wasted casts."
  ],
  MIXED: [
    "Solid rotation baseline overall, but there are a couple specific priority leaks costing you free DPS.",
    "Good foundation across these fights, though priority collisions and mistimed refreshes are holding your parse back.",
    "You have a very dependable rhythm going, but tightening up a few skill-priority decisions will yield an immediate damage boost.",
    "Promising consistency overall — addressing a couple of recurring cadence slips and stack timings will lift your numbers noticeably.",
    "The core rotation is definitely there, though a few awkward refresh windows and delayed procs caused friction.",
    "Decent fight execution overall; smoothing out your priority handoffs will make the rotation feel much more effortless."
  ],
  ROUGH: [
    "The rotation was pretty turbulent across these fights. Multiple skill priorities are colliding and causing downtime.",
    "Noticeable rotational leaks across the trial — tightening up your ability priority will yield an immediate damage boost.",
    "Rotational pacing had significant gaps across the trial. Stabilizing your core sequence and avoiding early recasts will make a huge difference.",
    "A fair amount of rotational friction was detected across these fights. Taking a moment to align your core ability sequence will quickly stabilize your parse.",
    "Rotational priorities were frequently out of sync across these pulls, leading to dropped debuffs and idle gaps.",
    "Several competing skill priorities disrupted your rhythm throughout the trial. Focusing on the foundational priorities below will bring rapid improvement."
  ]
};

// --- 2. SORCERER PHRASES ---
export const SORC_PHRASES = {
  // Crystal Fragments Procs
  FRAGS_IMMEDIATE_HIGH: [
    "Instant Frag proc reactions were razor-sharp. You snapped them off immediately without stalling your rotation.",
    "Great discipline on Frag procs — instant casts were prioritized right away on proc."
  ],
  FRAGS_IMMEDIATE_MID: [
    "You're holding onto Frag procs a bit too long ({delayed} delayed). Instant procs are absolute #1 priority; even if a DoT is about to expire, casting the instant Frag on your very next GCD is almost always a damage gain before refreshing that DoT.",
    "Frag proc reactions were delayed on several casts ({delayed} delayed for {gcds} GCDs). When the proc lights up, fire it on the very next GCD to avoid wasting proc rolls."
  ],
  FRAGS_IMMEDIATE_LOW: [
    "Major damage leak on Frag procs: only {pct}% cast immediately, with {delayed} delayed and {expired} expired unused. Instant Frags hit harder than anything else on your bar; cast them right away.",
    "Frag procs are being heavily deprioritized ({delayed} procs delayed for {gcds} GCDs, {expired} expired). Cast instant procs on the immediate next GCD without delay."
  ],
  FRAGS_HARDCAST: [
    "Avoid hardcasting Crystal Fragments ({count} hardcast(s)). If it hasn't procced instantly, stick to your standard rotation rather than eating the 0.8s cast time.",
    "You hardcasted Crystal Fragments without a proc active ({count} time(s)). Watch your proc buff closely; hardcasting is a severe DPS and sustain loss."
  ],

  // Bound Armaments
  ARMAMENTS_HIGH: [
    "Bound Armaments stack management was spot on — consistently waiting for 4 to 8 daggers before releasing.",
    "Great dagger discipline with Bound Armaments, letting light attacks stack up nicely before firing."
  ],
  ARMAMENTS_MID: [
    "Bound Armaments was frequently fired a bit prematurely (averaging {avg} stacks). Try to hold until you have at least 4 daggers up for max burst.",
    "A few Bound Armaments casts went out too early with under 4 stacks, missing out on the full dagger damage."
  ],
  ARMAMENTS_LOW: [
    "You're firing Bound Armaments at low stacks (averaging {avg} daggers; only {pct}% at 4+). Always let your light attacks build to 4+ (or even 8) stacks before pressing it. If tracking stacks during mechanics is tricky, aiming for after every 4th light attack is a safe rule of thumb.",
    "Significant DPS loss on Bound Armaments from premature firing ({suboptimal} casts under 4 stacks). Treat 4 stacks as your hard minimum before releasing."
  ],

  // Shattered Paths Signet (Mythic)
  SHATTERED_PATHS_HIGH: [
    "Flawless Shattered Paths management — your Ultimate never dropped below 133, keeping maximum status effect scaling active all fight.",
    "Shattered Paths retention was perfect; you stayed above the 133 Ultimate threshold across every single boss."
  ],
  SHATTERED_PATHS_MID: [
    "Your Ultimate dipped below 133 during combat on {count} boss(es), temporarily lowering your Shattered Paths status damage bonus. Watch your ult pool before dropping an ultimate.",
    "Keep an eye on the 133 Ultimate floor with Shattered Paths. A couple dips during combat cost you status effect damage scaling."
  ],
  SHATTERED_PATHS_LOW: [
    "Major Shattered Paths leak: you dropped below 133 Ultimate on {count} bosses during active combat. This drains your status effect damage; never cast your ultimate unless you stay comfortably above 133.",
    "You're repeatedly draining your Ultimate below 133 with Shattered Paths equipped. Unless the boss is dying in under 5 seconds, keep that pool banked."
  ],

  // Status Knife
  KNIFE_HIGH: [
    "Status Knife cadence was excellent — refreshed right around the 9-second mark without dropping debuff uptime.",
    "Great timing on Status Knife, consistently refreshing ~1 second before the 10-second cooldown."
  ],
  KNIFE_PREMATURE: [
    "You're recasting Status Knife too early ({early} early casts, averaging {avg}s). It has a 10-second duration; let it tick down to ~1s before refreshing so you don't burn wasted GCDs.",
    "Status Knife is being refreshed prematurely. Reapplying it early wastes valuable GCDs that should go towards your procs or filler."
  ],
  KNIFE_DROPPED: [
    "Status Knife dropped frequently between casts ({dropped} dropped, averaging {avg}s). Remember to refresh it ~1s before cooldown to keep status pressure up.",
    "Debuff uptime on Status Knife had noticeable gaps. Keep the 9-second rhythm in mind so the status effect doesn't fall off."
  ],

  // Haunting Curse
  CURSE_HIGH: [
    "Haunting Curse execution was flawless — you let both the 3.5s and 8.5s explosions detonate on every cast.",
    "Clean Curse tracking; zero clipped explosions, maximizing the double-burst damage."
  ],
  CURSE_CLIPPED: [
    "Haunting Curse was recast early {count} time(s), clipping the second 8.5s explosion. Always wait for the second pop before refreshing; clipping forfeits your biggest burst window.",
    "Be careful not to refresh Haunting Curse before the second explosion at 8.5s; clipping it cancels the bigger burst."
  ],
  CURSE_NEGLECTED: [
    "Haunting Curse uptime had noticeable gaps (averaging {avg}s). Once the second explosion goes off at 8.5s, refresh it promptly.",
    "Curse refreshes were delayed on several pulls. Recast it promptly after the second pop to maintain steady AoE pressure."
  ]
};

// --- 3. ARCANIST PHRASES ---
export const ARCANIST_PHRASES = {
  BEAM_FULL_HIGH: [
    "Fatecarver beam discipline was outstanding — riding out full 4.5-second channels with minimal early cancels.",
    "Excellent beam channels throughout; you consistently protected your Fatecarver casts from being cut short."
  ],
  BEAM_INTERRUPTED_MID: [
    "Several Fatecarver beams ({cut} cut early) were canceled before the full 4.5s channel finished, losing out on high-damage end ticks.",
    "Watch out for premature beam cancels. Cutting a beam early forfeits your heaviest damage ticks."
  ],
  BEAM_INTERRUPTED_LOW: [
    "Major beam leakage: over half your Fatecarvers were cut short early ({cut} cut early). Let the full 4.5s channel finish before pressing your next ability.",
    "High number of interrupted beams ({cut} cut short). Early cancels severely gimp Arcanist DPS; ride out the full channel."
  ],
  BEAM_INTERRUPTED_ACTION: [
    "Fatecarver channels were repeatedly cut short early by {action} ({count} time(s)). Beams lose their heaviest damage pulses at the end of the channel — check corresponding casts and avoid triggering {action} while channeling.",
    "Clear cancellation pattern detected: {count} Fatecarver beam(s) were interrupted by {action}. Make sure you aren't reflexively pressing {action} during the 4.5s channel."
  ],
  CRUX_UNDER_CRUX: [
    "Fatecarver was cast with under 3 Crux {count} time(s). Always build all 3 Crux before beaming (under-crux beams lose up to 66% damage and channel length) — installing the Crux Counter addon is strongly recommended to keep your stacks clearly visible on-screen so you never beam at 1 or 2 Crux.",
    "Avoid beaming at 1 or 2 Crux ({count} under-crux cast(s)). We recommend installing the Crux Counter addon to make tracking stacks effortless and ensure every Fatecarver fires at full 3 Crux."
  ],
  CRUX_EXCELLENT: [
    "Crux generation discipline was top tier — every single Fatecarver was cast at full 3 Crux.",
    "Perfect 3-Crux beam habits with zero under-crux casts."
  ],
  BEAM_UPTIME_LOW: [
    "Beam channel uptime was a bit low ({pct}% of fight). Aim to spend around 50%+ of combat actively channeling Fatecarver by trimming excess filler.",
    "Try to enter your beam loops faster; spending too much time on filler skills drags down total Fatecarver uptime."
  ]
};

// --- 4. NECROMANCER PHRASES ---
export const NECRO_PHRASES = {
  NECRO_CADENCE_HIGH: [
    "Corpseburster cadence was clockwork — strictly adhering to the 1-in-3 Blastbones rhythm.",
    "Great rotational tempo; Blastbones was cast right on schedule every third skill.",
    "Remarkably steady Blastbones engine — kept the 1-in-3 cadence rolling with minimal delay."
  ],
  NECRO_CADENCE_DELAYED: [
    "Blastbones was frequently delayed beyond the 3-GCD window. Blastbones is your engine; never let it sit ready off cooldown.",
    "Delayed Blastbones casts threw off your cadence. Keep to the strict BB -> Skill -> Skill rhythm to maximize Corpseburster pops.",
    "Blastbones sat off cooldown longer than necessary on several cycles. Prioritizing Blastbones every third cast will noticeably smooth out your damage flow."
  ],
  NECRO_PATTERN_MISSING_SIPHON_SIPHON: [
    "Notice: The high-burst 'BB - Siphon - Siphon' pattern was completely missing across these fights. When all DoTs are rolling and multiple corpses are on the ground, double-detonating Siphon is your highest-burst Corpseburster sequence.",
    "Missing regular pattern: you never used 'BB - Siphon - Siphon'. When your DoTs are refreshed and corpses are available, double Siphon casts trigger back-to-back Corpseburster detonations for maximum burst."
  ],
  NECRO_PATTERN_MISSING_GENERIC: [
    "Missing regular pattern: the '{name}' sequence was never cast across these fights. Incorporating the full set of standard Blastbones patterns ensures you adapt cleanly to changing fight conditions.",
    "Notice: The standard '{name}' sequence was not observed. Weaving all 4 regular Blastbones patterns keeps your Corpseburster procs flowing smoothly."
  ],
  NECRO_PATTERNS_BROKEN: [
    "Noticed {brokenCount} occasion(s) where regular rotation patterns broke (unexpected skill orders between Blastbones or dropped cadence). Sticking strictly to the 4 regular Blastbones sequences (BB -> Skill -> Skill) will stabilize your DPS.",
    "Rotational sequence broke on {brokenCount} occasion(s) across these fights. Keeping to the standard 3-cast patterns prevents awkward pauses and ensures consistent Corpseburster detonations."
  ],
  NECRO_CORPSE_MANAGEMENT: [
    "Keep an eye on corpse availability when consuming Siphon so you don't starve Corpseburster detonations.",
    "Good corpse utilization keeping continuous Siphon explosions active."
  ]
};

// --- 5. DRAGONKNIGHT PHRASES ---
export const DK_PHRASES = {
  // Magma Fist & Heat Shock
  HEAT_SHOCK_HIGH: [
    "Flawless Heat Shock management — maintained 3 stacks consistently on the main boss with clean ~1s refreshes.",
    "Great Magma Fist cadence; built to 3 stacks and kept Heat Shock refreshed without letting it expire."
  ],
  HEAT_SHOCK_EARLY: [
    "You're recasting Magma Fist too early ({early} early casts, averaging {avg}s). Wait until ~1s before Heat Shock expires (5.5s–6.8s) so you don't burn extra GCDs maintaining 3 stacks.",
    "Magma Fist was refreshed prematurely multiple times. Heat Shock lasts 7s; refreshing too fast drains magicka and costs filler casts."
  ],
  HEAT_SHOCK_DROPPED: [
    "Heat Shock dropped {dropped} time(s) on the main boss (averaging {avg}s between casts). When Heat Shock falls off, you lose all 3 stacks and have to rebuild the debuff from scratch.",
    "Watch your Heat Shock timer on the boss ({dropped} drops). Letting it expire resets the 3 stacks and hurts group damage scaling."
  ],

  // Flame Lash & Off-Balance Mini-Game
  LASH_OB_HIGH: [
    "Swift reactions to Off-Balance windows (avg {reaction}ms delay), converting {casts} Power Lash casts with clean DoT preservation.",
    "Excellent execution during Off-Balance; capitalized on Power Lash without sacrificing priority debuffs."
  ],
  LASH_OB_SLOW: [
    "Reaction to Off-Balance was delayed ({reaction}ms avg from onset to 1st Lash). Try setting up a tracker for the OB phase, plan your DoTs, and cast Flame Lash -> Power Lash as early into the OB window as possible.",
    "Slow uptake on Off-Balance windows ({reaction}ms delay). Track the Off-Balance window, pre-refresh your DoTs, and get into Flame Lash -> Power Lash early to maximize casts before the 7s window ends."
  ],
  LASH_DOTS_DROPPED: [
    "You let essential DoTs expire while tunneling Power Lash ({dotsCount} DoTs dropped: {dotsList}). Remember that keeping Magma Fist at 3 stacks and Knife rolling takes priority over Power Lash!",
    "DoT timers were sacrificed during Off-Balance ({dotsList} dropped). Finish refreshing your core debuffs before unleashing Lash stacks."
  ],
  LASH_PRIORITY_VIOLATION: [
    "Priority violation during Power Lash: you continued casting Flame Lash while Magma Fist / Status Knife dropped. Group debuffs take priority over individual Lash strikes.",
    "Don't let Heat Shock or Status Knife fall off while spamming Power Lash; refresh your high-value debuffs first."
  ],

  // Molten Whip & Seething Fury Mini-Game
  MOLTEN_WHIP_HIGH: [
    "Superb Seething Fury discipline — {pct}% of Molten Whips were cast at a full 3 stacks for maximum +99% damage burst.",
    "Clean Molten Whip cycling; consistently wove Ardent Flame skills to build 3 fury stacks before unleashing."
  ],
  MOLTEN_WHIP_LOW: [
    "You're firing Molten Whip with under 3 stacks of Seething Fury ({suboptimal} casts at 1-2 stacks; only {pct}% at 3 stacks). Always weave Ardent Flame abilities to build the full 3 stacks before whipping.",
    "Frequent low-stack Molten Whips detected ({suboptimal} casts). Molten Whip gains +33% damage per stack up to 99%; wait for 3 stacks before releasing."
  ],

  // Igneous Weapons
  IGNEOUS_HIGH: [
    "Flawless Igneous Weapons uptime ({pct}%), providing 100% Major Brutality and Sorcery coverage for the group.",
    "Great Igneous Weapons maintenance with minimal GCD waste."
  ],
  IGNEOUS_PREMATURE: [
    "Igneous Weapons was recast prematurely {early} time(s). It lasts a full 60 seconds; refreshing too early burns GCDs that should be dealing damage.",
    "You're recasting Igneous Weapons well before its 60s duration expires ({early} early casts). Let it run closer to expiration."
  ],
  IGNEOUS_DROPPED: [
    "Igneous Weapons dropped for {dropped} windows, leaving the group without Major Brutality and Sorcery. Keep an eye on its 60s timer.",
    "Major gaps in Igneous Weapons coverage. Maintain this group buff so your raid doesn't lose weapon and spell damage."
  ],

  // Dragonknight Standard
  STANDARD_HIGH: [
    "Prompt Dragonknight Standard drops; placed your banner as soon as 250 Ultimate was reached without sitting on excess ult.",
    "Great Standard usage, synchronizing banner placement smoothly with fight pacing."
  ],
  STANDARD_SITTING: [
    "You sat at 250+ Ultimate for {sec}s during active combat without placing Dragonknight Standard. Unless holding for an upcoming invulnerability or execute burn, drop standard as soon as it's ready.",
    "Delayed Standard cast: banked 250+ Ultimate for {sec}s. Don't sit on full ultimate in combat."
  ],

  // DK Tank Debuffs
  TANK_PERFECT: [
    "Flawless tank debuff coverage across the board: Taunt ({taunt}%), Major Breach ({breach}%), Crusher ({crusher}%), and Maim ({maim}%).",
    "Outstanding boss debuff maintenance; full mitigation and armor shred uptimes on the main boss."
  ],
  TANK_TAUNT_DROPPED: [
    "Taunt dropped on the main boss ({taunt}% uptime)! Maintain 100% taunt uptime with Pierce Armor or Frost Clench to prevent boss turning.",
    "Taunt had gaps ({taunt}%). Always reapply taunt before it expires."
  ],
  TANK_CRUSHER_LOW: [
    "Crusher enchant uptime was low on the boss ({crusher}%). Weave weapon skill light attacks or Infused back-bar enchants to keep armor shred at ~80%+.",
    "Crusher uptime was below target ({crusher}%). Ensure your backbar enchant is proccing consistently."
  ],
  TANK_BREACH_LOW: [
    "Major Breach had downtime on the boss ({breach}%). Keep Pierce Armor refreshed to ensure full physical and spell penetration for the group.",
    "Inconsistent Major Breach uptime ({breach}%). Keep pierce armor active on the boss."
  ]
};

// --- 6. UNIVERSAL PHRASES (Light Attacks, Uptime, Bar Swaps) ---
export const UNIVERSAL_PHRASES = {
  // Light Attack Hit Rate
  LA_HIT_HIGH: [
    "Light attack accuracy was crisp ({pct}% hit rate) — almost every swing connected cleanly to keep ultimate generation flowing.",
    "Clean light attack connection rate ({pct}%), ensuring reliable Ultimate generation and free passive damage."
  ],
  LA_HIT_MID: [
    "Light attack hit rate sat at {pct}% ({empty} empty casts). Make sure you're in target range and facing the boss so swings don't whiff.",
    "A handful of light attacks ({empty} misses) didn't connect. Ghost light attacks deal zero damage and don't grant Ultimate."
  ],
  LA_HIT_LOW: [
    "Substantial light attack leakage ({empty} empty swings, {pct}% hit rate). Ensure your target is in range and crosshairs are locked; connecting light attacks triggers ult regen, so missed swings deal zero damage and slow down your Ultimate generation.",
    "You're throwing a lot of empty light attacks into thin air ({empty} missed). Make sure your attacks actually connect to generate Ultimate."
  ],

  // Combat Uptime & Idle Downtime
  UPTIME_HIGH: [
    "High active combat uptime ({pct}%) with fast GCD pacing and virtually zero dead air between skills.",
    "Great cast pacing throughout the fights, keeping downtime to a bare minimum."
  ],
  UPTIME_MID: [
    "A bit of hesitation between casts ({idle}s total idle time across bosses). Keep pressing your next button as GCD finishes even during movement.",
    "Some idle gaps between skill casts during mechanics. Work on queueing abilities while navigating mechanics."
  ],
  UPTIME_LOW: [
    "High idle downtime ({idle}s idle across fights). Combat uptime was only {pct}%; keep your GCD rolling continuously.",
    "Noticeable pauses between casts. Avoid stopping your rotation during boss movement or positioning changes."
  ],

  // Bar Swaps
  BAR_SWAPS_SMOOTH: [
    "Bar swaps were snappy and cleanly animation-canceled without clipping skills."
  ],
  BAR_SWAPS_CLUNKY: [
    "A few clunky bar swaps interrupted your GCD rhythm; weave skills directly into swaps to keep the flow smooth."
  ]
};

// --- 6. KEY SKILL MECHANICS EXPLANATIONS (Human 1-2 sentence coaching rules) ---
export const KEY_SKILL_EXPLANATIONS: Record<string, Array<{ skill: string; explanation: string }>> = {
  sorcerer: [
    {
      skill: 'Haunting Curse',
      explanation:
        "Curse explodes twice at ~4 seconds and ~8 seconds. If you recast it too early, it doesn't deal full damage, just restarting the timer from 0, so it's an empty cast."
    },
    {
      skill: 'Crystal Frag Procs',
      explanation:
        'When Crystal Fragments procs, it turns instant, costs half magicka, and deals huge bonus damage. It is your absolute top priority to cast immediately on the next GCD — holding it or letting it expire is a massive damage loss.'
    },
    {
      skill: 'Bound Armaments',
      explanation:
        'Bound Armaments builds up to 8 daggers from light attacks. You want to let it stack up to at least 4 daggers (or even 8) before firing; casting it early with fewer daggers wastes the cast on low damage.'
    },
    {
      skill: 'Status Knife',
      explanation:
        'Status Knife applies a 10-second status effect debuff. You should refresh it roughly 1 second before it expires (~9 seconds). Recasting earlier wastes GCDs, while letting it drop loses status effect uptime.'
    },
    {
      skill: 'Shattered Paths Signet (Mythic)',
      explanation:
        'Shattered Paths boosts status effect damage based on current Ultimate (up to 133%). Your Ultimate must never drop below 133 during combat, or you immediately bleed that damage bonus (except in the final 5s of execute).'
    },
    {
      skill: 'Light Attacks',
      explanation:
        'Connecting a light attack deals direct damage and triggers Ultimate regeneration. If you miss light attacks, they deal zero damage and you do not gain Ultimate as quickly as you could have.'
    }
  ],
  arcanist: [
    {
      skill: 'Fatecarver (Beam Execution)',
      explanation:
        'Fatecarver is your primary damage source and channels for 4.5 seconds. Cutting the channel early with another ability or roll dodge forfeits the heaviest damage ticks at the tail end of the beam.'
    },
    {
      skill: 'Crux Usage & Building',
      explanation:
        'Always build all 3 Crux before beaming. Activating Fatecarver with only 1 or 2 Crux cuts both your channel length and beam damage by up to 66%.'
    },
    {
      skill: 'Beam Channel Uptime',
      explanation:
        'Arcanist DPS is driven by beam uptime. Minimize unnecessary filler skills and get back into your 3-Crux Fatecarver channel as quickly and often as possible.'
    },
    {
      skill: 'Light Attacks',
      explanation:
        'Connecting a light attack deals direct damage and triggers Ultimate regeneration. If you miss light attacks, they deal zero damage and you do not gain Ultimate as quickly as you could have.'
    }
  ],
  necromancer: [
    {
      skill: 'Blastbones (Corpseburster Engine)',
      explanation:
        'Blastbones is your primary rotation engine and detonates every 3 seconds. It must be cast on a strict 1-in-3 rhythm (Blastbones -> Skill -> Skill) without sitting ready off cooldown.'
    },
    {
      skill: 'Siphon & Corpse Consumption',
      explanation:
        'Siphon tethers a corpse to deal periodic damage, generate Ultimate, and trigger Corpseburster detonations. Never cast it without a corpse available or clip an active tether prematurely.'
    },
    {
      skill: 'DoT Refreshes & Filler Cadence',
      explanation:
        'The two GCDs between Blastbones casts are reserved for refreshing expiring DoTs or detonating corpses. Never double-cast low-priority fillers if your next Blastbones is ready.'
    },
    {
      skill: 'Light Attacks',
      explanation:
        'Connecting a light attack deals direct damage and triggers Ultimate regeneration. If you miss light attacks, they deal zero damage and you do not gain Ultimate as quickly as you could have.'
    }
  ],
  dragonknight: [
    {
      skill: 'Magma Fist & Heat Shock',
      explanation:
        'Magma Fist applies the single-target Heat Shock debuff, stacking up to 3 times with a 7-second duration. Apply it early to build 3 stacks, then refresh ~1s before expiry (5.5s–6.8s) on the main boss to maintain full stacks without wasting GCDs.'
    },
    {
      skill: 'Whip Mini-Game (Flame Lash vs Molten Whip)',
      explanation:
        'Both morphs are spammables, so never hold casts if DoTs are rolling. For Flame Lash, set up a tracker for the Off-Balance phase, plan your DoTs, and cast Flame Lash -> Power Lash as early into the 7s OB window as possible (while keeping 3-stack Magma Fist and Knife rolling). For Molten Whip, weave Ardent Flame skills to build 3 Seething Fury stacks before unleashing the +99% empowered whip.'
    },
    {
      skill: 'Status Knife',
      explanation:
        'Status Knife carries a 10-second cooldown and status window. Refresh it ~1s before expiration (8.5s–9.8s) to maintain constant status application.'
    },
    {
      skill: 'Igneous Weapons',
      explanation:
        'Igneous Weapons grants Major Brutality and Sorcery to the whole group for 60 seconds. Refreshing earlier than 45s wastes a cast, while letting it expire leaves the group without major damage buffs.'
    },
    {
      skill: 'Dragonknight Standard',
      explanation:
        'Standard of Might provides massive group and personal damage scaling for 250 Ultimate. Do not sit on 250+ Ultimate during active combat unless holding for a coordinated burn or boss invulnerability phase.'
    },
    {
      skill: 'Light Attacks',
      explanation:
        'Connecting a light attack deals direct damage and triggers Ultimate regeneration. If you miss light attacks, they deal zero damage and you do not gain Ultimate as quickly as you could have.'
    }
  ],
  'dragonknight-tank': [
    {
      skill: 'Taunt & Boss Positioning',
      explanation:
        'Taunt (Pierce Armor / Frost Clench) must remain at 100% on the main boss. Dropping taunt endangers the raid and turns the boss.'
    },
    {
      skill: 'Major Breach & Crusher',
      explanation:
        'Pierce Armor provides Major Breach, and your weapon enchant applies Crusher. Both reduce boss armor directly and should be maintained at near 100% uptime.'
    },
    {
      skill: 'Maim & Damage Reduction',
      explanation:
        'Minor and Major Maim reduce incoming boss damage by 5% and 10%. Keep these active to smooth tank and raid incoming damage spikes.'
    },
    {
      skill: 'Magma Fist & Igneous Weapons',
      explanation:
        'If slotted, maintain 3 stacks of Heat Shock on the boss and refresh 60-second Igneous Weapons to empower group weapon and spell damage.'
    },
    {
      skill: 'Light Attacks',
      explanation:
        'Connecting a light attack deals direct damage and triggers Ultimate regeneration. If you miss light attacks, they deal zero damage and you do not gain Ultimate as quickly as you could have.'
    }
  ]
};

export interface CoachingFeedback {
  assessment: string;
  strengths: string[];
  leaks: string[];
}

/**
 * Helper to replace placeholders like {pct}, {delayed}, etc. in a phrase.
 */
export function interpolate(phrase: string, params: Record<string, string | number>): string {
  let result = phrase;
  for (const [key, val] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
  }
  return result;
}

/**
 * Builds human-sounding coaching feedback for Sorcerer parses across boss encounters.
 */
export function getSorcererCoachingFeedback(params: {
  bossCount: number;
  totalFragProcs: number;
  immFrags: number;
  delayedFrags: number;
  delayedGCDs: number;
  expiredFrags: number;
  hardcasts: number;
  totalArmCasts: number;
  optimalArmCasts: number;
  avgArmStacks: number;
  hasShatteredPaths: boolean;
  shatteredDropFightsCount: number;
  totalKnifeCasts: number;
  optimalKnife: number;
  droppedKnife: number;
  earlyKnife: number;
  avgKnifeInterval: number;
  totalCurseCasts: number;
  clippedCurse: number;
  avgCurseInterval: number;
  connectedLAs: number;
  emptyLAs: number;
  activeUptimePct: number;
  totalIdleSec: number;
}): CoachingFeedback {
  const strengths: string[] = [];
  const leaks: string[] = [];

  const laTotal = params.connectedLAs + params.emptyLAs;
  const laPct = laTotal > 0 ? ((params.connectedLAs / laTotal) * 100).toFixed(1) : '100';
  const immPct =
    params.totalFragProcs > 0
      ? ((params.immFrags / params.totalFragProcs) * 100).toFixed(1)
      : '100';
  const armPct =
    params.totalArmCasts > 0
      ? Math.round((params.optimalArmCasts / params.totalArmCasts) * 100)
      : 100;

  // 1. Light Attacks
  if (Number(laPct) >= 85) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_HIGH[0], { pct: laPct }));
  } else if (Number(laPct) >= 70) {
    strengths.push(
      interpolate(
        "Solid light attack connection ({pct}%, {connected} hit) keeping Ultimate generation flowing steadily.",
        { pct: laPct, connected: params.connectedLAs }
      )
    );
  } else {
    leaks.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_LOW[0], { pct: laPct, empty: params.emptyLAs }));
  }

  // 2. Haunting Curse
  if (params.totalCurseCasts > 0) {
    if (params.clippedCurse <= 2) {
      const intact = params.totalCurseCasts - params.clippedCurse;
      strengths.push(
        interpolate(
          "Reliable Haunting Curse execution ({intact}/{total} full explosions), letting the double burst detonate.",
          { intact, total: params.totalCurseCasts }
        )
      );
    } else {
      leaks.push(interpolate(SORC_PHRASES.CURSE_CLIPPED[0], { count: params.clippedCurse }));
    }
  }

  // 3. Crystal Frag Procs
  if (params.totalFragProcs > 0) {
    if (Number(immPct) >= 80 && params.expiredFrags === 0 && params.hardcasts === 0) {
      strengths.push(SORC_PHRASES.FRAGS_IMMEDIATE_HIGH[0]);
    } else if (Number(immPct) >= 50 && params.expiredFrags < 3) {
      leaks.push(
        interpolate(SORC_PHRASES.FRAGS_IMMEDIATE_MID[0], {
          delayed: params.delayedFrags,
          gcds: params.delayedGCDs
        })
      );
    } else {
      leaks.push(
        interpolate(SORC_PHRASES.FRAGS_IMMEDIATE_LOW[0], {
          pct: immPct,
          delayed: params.delayedFrags,
          gcds: params.delayedGCDs,
          expired: params.expiredFrags
        })
      );
    }

    if (params.hardcasts > 0) {
      leaks.push(interpolate(SORC_PHRASES.FRAGS_HARDCAST[0], { count: params.hardcasts }));
    }
  }

  // 4. Bound Armaments
  if (params.totalArmCasts > 0) {
    if (armPct >= 75) {
      strengths.push(SORC_PHRASES.ARMAMENTS_HIGH[0]);
    } else if (armPct >= 40) {
      leaks.push(
        interpolate(SORC_PHRASES.ARMAMENTS_MID[0], {
          avg: params.avgArmStacks.toFixed(1)
        })
      );
    } else {
      leaks.push(
        interpolate(SORC_PHRASES.ARMAMENTS_LOW[0], {
          avg: params.avgArmStacks.toFixed(1),
          pct: armPct,
          suboptimal: params.totalArmCasts - params.optimalArmCasts
        })
      );
    }
  }

  // 5. Shattered Paths Signet
  if (params.hasShatteredPaths) {
    if (params.shatteredDropFightsCount === 0) {
      strengths.push(SORC_PHRASES.SHATTERED_PATHS_HIGH[0]);
    } else if (params.shatteredDropFightsCount <= 2 && params.shatteredDropFightsCount < params.bossCount) {
      leaks.push(
        interpolate(SORC_PHRASES.SHATTERED_PATHS_MID[0], {
          count: params.shatteredDropFightsCount
        })
      );
    } else {
      leaks.push(
        interpolate(SORC_PHRASES.SHATTERED_PATHS_LOW[0], {
          count: params.shatteredDropFightsCount
        })
      );
    }
  }

  // 6. Status Knife
  if (params.totalKnifeCasts > 0) {
    const knifeOptPct = (params.optimalKnife / params.totalKnifeCasts) * 100;
    if (knifeOptPct >= 60) {
      strengths.push(SORC_PHRASES.KNIFE_HIGH[0]);
    } else if (params.earlyKnife >= params.droppedKnife) {
      leaks.push(
        interpolate(SORC_PHRASES.KNIFE_PREMATURE[0], {
          early: params.earlyKnife,
          avg: params.avgKnifeInterval.toFixed(1)
        })
      );
    } else {
      leaks.push(
        interpolate(SORC_PHRASES.KNIFE_DROPPED[0], {
          dropped: params.droppedKnife,
          avg: params.avgKnifeInterval.toFixed(1)
        })
      );
    }
  }

  // 7. Active Uptime
  if (params.activeUptimePct >= 85) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.UPTIME_HIGH[0], { pct: params.activeUptimePct.toFixed(1) }));
  } else if (params.activeUptimePct < 75) {
    leaks.push(
      interpolate(UNIVERSAL_PHRASES.UPTIME_LOW[0], {
        idle: params.totalIdleSec.toFixed(1),
        pct: params.activeUptimePct.toFixed(1)
      })
    );
  }

  // Overall tone selection
  let assessment = OVERALL_PHRASES.MIXED[0];
  if (leaks.length === 0) {
    assessment = OVERALL_PHRASES.CLEAN[0];
  } else if (leaks.length >= 4) {
    assessment = OVERALL_PHRASES.ROUGH[0];
  }

  return { assessment, strengths, leaks };
}

/**
 * Builds human-sounding coaching feedback for Arcanist parses across boss encounters.
 */
export function getArcanistCoachingFeedback(params: {
  bossCount: number;
  totalBeams: number;
  optimalBeams: number;
  interruptedBeams: number;
  threeCruxBeams: number;
  underCruxBeams: number;
  beamChannelSec: number;
  totalFightSec: number;
  connectedLAs: number;
  emptyLAs: number;
  activeUptimePct: number;
  totalIdleSec: number;
  dominantInterruptAction?: string;
  interruptActionCounts?: Record<string, number>;
}): CoachingFeedback {
  const strengths: string[] = [];
  const leaks: string[] = [];

  const laTotal = params.connectedLAs + params.emptyLAs;
  const laPct = laTotal > 0 ? ((params.connectedLAs / laTotal) * 100).toFixed(1) : '100';
  const optPct = params.totalBeams > 0 ? Math.round((params.optimalBeams / params.totalBeams) * 100) : 100;
  const beamUptimePct = params.totalFightSec > 0 ? ((params.beamChannelSec / params.totalFightSec) * 100).toFixed(1) : '0';

  // Light attacks
  if (Number(laPct) >= 90) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_HIGH[0], { pct: laPct }));
  } else if (Number(laPct) >= 75) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_MID[0], { pct: laPct, empty: params.emptyLAs }));
  } else {
    leaks.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_LOW[0], { pct: laPct, empty: params.emptyLAs }));
  }

  // Crux discipline
  if (params.underCruxBeams === 0 && params.totalBeams > 0) {
    strengths.push(ARCANIST_PHRASES.CRUX_EXCELLENT[0]);
  } else if (params.underCruxBeams > 0) {
    leaks.push(interpolate(ARCANIST_PHRASES.CRUX_UNDER_CRUX[0], { count: params.underCruxBeams }));
  }

  // Beam full channels
  if (optPct >= 80) {
    strengths.push(ARCANIST_PHRASES.BEAM_FULL_HIGH[0]);
  } else if (optPct >= 50) {
    leaks.push(interpolate(ARCANIST_PHRASES.BEAM_INTERRUPTED_MID[0], { cut: params.interruptedBeams }));
  } else {
    leaks.push(interpolate(ARCANIST_PHRASES.BEAM_INTERRUPTED_LOW[0], { cut: params.interruptedBeams }));
  }

  // Specific interruption pattern if clear (e.g. cancelled by Bash or Roll Dodge)
  if (
    params.dominantInterruptAction &&
    (params.interruptActionCounts?.[params.dominantInterruptAction] || 0) >= 2
  ) {
    const actionCount = params.interruptActionCounts![params.dominantInterruptAction];
    leaks.push(
      interpolate(ARCANIST_PHRASES.BEAM_INTERRUPTED_ACTION[0], {
        action: params.dominantInterruptAction,
        count: actionCount
      })
    );
  }

  // Beam uptime
  if (Number(beamUptimePct) < 45 && params.totalFightSec > 30) {
    leaks.push(interpolate(ARCANIST_PHRASES.BEAM_UPTIME_LOW[0], { pct: beamUptimePct }));
  }

  // Uptime
  if (params.activeUptimePct >= 85) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.UPTIME_HIGH[0], { pct: params.activeUptimePct.toFixed(1) }));
  } else if (params.activeUptimePct < 75) {
    leaks.push(
      interpolate(UNIVERSAL_PHRASES.UPTIME_LOW[0], {
        idle: params.totalIdleSec.toFixed(1),
        pct: params.activeUptimePct.toFixed(1)
      })
    );
  }

  let assessment = OVERALL_PHRASES.MIXED[0];
  if (leaks.length === 0) {
    assessment = OVERALL_PHRASES.CLEAN[0];
  } else if (leaks.length >= 3) {
    assessment = OVERALL_PHRASES.ROUGH[0];
  }

  return { assessment, strengths, leaks };
}

/**
 * Builds human-sounding coaching feedback for Necromancer parses across boss encounters.
 */
export function getNecromancerCoachingFeedback(params: {
  bossCount: number;
  totalGCDCasts: number;
  perfectTripletsPct: number;
  delayedCadenceCount: number;
  connectedLAs: number;
  emptyLAs: number;
  activeUptimePct: number;
  totalIdleSec: number;
  brokenPatternsCount?: number;
  missingPatterns?: Array<{ id: string; name: string; count: number; description?: string }>;
  totalCycles?: number;
}): CoachingFeedback {
  const strengths: string[] = [];
  const leaks: string[] = [];

  const laTotal = params.connectedLAs + params.emptyLAs;
  const laPct = laTotal > 0 ? ((params.connectedLAs / laTotal) * 100).toFixed(1) : '100';

  if (Number(laPct) >= 80) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_HIGH[0], { pct: laPct }));
  } else {
    leaks.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_LOW[0], { pct: laPct, empty: params.emptyLAs }));
  }

  // Cadence
  if (params.perfectTripletsPct >= 70) {
    strengths.push(NECRO_PHRASES.NECRO_CADENCE_HIGH[0]);
  } else {
    leaks.push(NECRO_PHRASES.NECRO_CADENCE_DELAYED[0]);
  }

  // Missing regular patterns check (e.g. BB - Siphon - Siphon)
  if (params.missingPatterns && params.missingPatterns.length > 0) {
    const missingSiphonSiphon = params.missingPatterns.find(
      p => p.id === 'bb-siphon-siphon' || p.name.toLowerCase().includes('siphon - siphon')
    );
    if (missingSiphonSiphon) {
      leaks.push(NECRO_PHRASES.NECRO_PATTERN_MISSING_SIPHON_SIPHON[0]);
    } else {
      leaks.push(
        interpolate(NECRO_PHRASES.NECRO_PATTERN_MISSING_GENERIC[0], {
          name: params.missingPatterns[0].name
        })
      );
    }
  }

  // Broken patterns check
  if (params.brokenPatternsCount && params.brokenPatternsCount > 0) {
    leaks.push(
      interpolate(NECRO_PHRASES.NECRO_PATTERNS_BROKEN[0], {
        brokenCount: params.brokenPatternsCount
      })
    );
  }

  // Uptime
  if (params.activeUptimePct >= 85) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.UPTIME_HIGH[0], { pct: params.activeUptimePct.toFixed(1) }));
  } else if (params.activeUptimePct < 75) {
    leaks.push(
      interpolate(UNIVERSAL_PHRASES.UPTIME_LOW[0], {
        idle: params.totalIdleSec.toFixed(1),
        pct: params.activeUptimePct.toFixed(1)
      })
    );
  }

  let assessment = OVERALL_PHRASES.MIXED[0];
  if (leaks.length === 0) {
    assessment = OVERALL_PHRASES.CLEAN[0];
  } else if (leaks.length >= 2) {
    assessment = OVERALL_PHRASES.ROUGH[0];
  }

  return { assessment, strengths, leaks };
}

/**
 * Builds human-sounding coaching feedback for Dragonknight parses across boss encounters.
 */
export function getDragonknightCoachingFeedback(params: {
  bossCount: number;
  specVariant: 'tank' | 'zenkosh' | 'parse';
  hasMagmaFist: boolean;
  heatShockThreeStackUptimePct: number;
  optimalMagmaFistRefreshes: number;
  earlyMagmaFistRefreshes: number;
  droppedHeatShockCount: number;
  avgMagmaFistInterval: number;
  whipMorph: 'flame_lash' | 'molten_whip' | 'none';
  reactionDelayMs?: number;
  castsInOffBalance?: number;
  offBalanceWindowsCount?: number;
  expiredDotsCount?: number;
  expiredDotsList?: string;
  priorityViolationsCount?: number;
  seethingFuryThreeStackPct?: number;
  moltenWhipUnderThreeStacks?: number;
  hasIgneousWeapons: boolean;
  igneousUptimePct: number;
  earlyIgneousRecasts: number;
  droppedIgneousWindows: number;
  penalizedStandardSec: number;
  totalKnifeCasts?: number;
  optimalKnife?: number;
  earlyKnife?: number;
  droppedKnife?: number;
  avgKnifeInterval?: number;
  isTank: boolean;
  tauntUptimePct?: number;
  majorBreachUptimePct?: number;
  crusherUptimePct?: number;
  maimUptimePct?: number;
  connectedLAs: number;
  emptyLAs: number;
  activeUptimePct: number;
  totalIdleSec: number;
}): CoachingFeedback {
  const strengths: string[] = [];
  const leaks: string[] = [];

  // 1. Light Attacks
  const laTotal = params.connectedLAs + params.emptyLAs;
  const laPct = laTotal > 0 ? ((params.connectedLAs / laTotal) * 100).toFixed(1) : '100';

  if (Number(laPct) >= 80) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_HIGH[0], { pct: laPct }));
  } else {
    leaks.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_LOW[0], { pct: laPct, empty: params.emptyLAs }));
  }

  // 2. Magma Fist & Heat Shock
  if (params.hasMagmaFist) {
    if (params.droppedHeatShockCount === 0 && params.heatShockThreeStackUptimePct >= 70) {
      strengths.push(DK_PHRASES.HEAT_SHOCK_HIGH[0]);
    } else if (params.droppedHeatShockCount > 0) {
      leaks.push(
        interpolate(DK_PHRASES.HEAT_SHOCK_DROPPED[0], {
          dropped: params.droppedHeatShockCount,
          avg: params.avgMagmaFistInterval.toFixed(1)
        })
      );
    } else if (params.earlyMagmaFistRefreshes > 2) {
      leaks.push(
        interpolate(DK_PHRASES.HEAT_SHOCK_EARLY[0], {
          early: params.earlyMagmaFistRefreshes,
          avg: params.avgMagmaFistInterval.toFixed(1)
        })
      );
    }
  }

  // 3. Whip Mini-Game
  if (params.whipMorph === 'flame_lash') {
    if (
      params.reactionDelayMs !== undefined &&
      params.reactionDelayMs <= 1500 &&
      (params.priorityViolationsCount ?? 0) === 0 &&
      (params.expiredDotsCount ?? 0) === 0
    ) {
      strengths.push(
        interpolate(DK_PHRASES.LASH_OB_HIGH[0], {
          reaction: params.reactionDelayMs,
          casts: params.castsInOffBalance ?? 0
        })
      );
    }

    if (params.priorityViolationsCount && params.priorityViolationsCount > 0) {
      leaks.push(DK_PHRASES.LASH_PRIORITY_VIOLATION[0]);
    }

    if (params.expiredDotsCount && params.expiredDotsCount > 0) {
      leaks.push(
        interpolate(DK_PHRASES.LASH_DOTS_DROPPED[0], {
          dotsCount: params.expiredDotsCount,
          dotsList: params.expiredDotsList || 'essential DoTs'
        })
      );
    }

    if (params.reactionDelayMs !== undefined && params.reactionDelayMs > 1800) {
      leaks.push(
        interpolate(DK_PHRASES.LASH_OB_SLOW[0], {
          reaction: params.reactionDelayMs
        })
      );
    }
  } else if (params.whipMorph === 'molten_whip') {
    const furyPct = params.seethingFuryThreeStackPct ?? 100;
    if (furyPct >= 80) {
      strengths.push(interpolate(DK_PHRASES.MOLTEN_WHIP_HIGH[0], { pct: furyPct }));
    } else {
      leaks.push(
        interpolate(DK_PHRASES.MOLTEN_WHIP_LOW[0], {
          pct: furyPct,
          suboptimal: params.moltenWhipUnderThreeStacks ?? 0
        })
      );
    }
  }

  // 4. Igneous Weapons
  if (params.hasIgneousWeapons) {
    if (params.igneousUptimePct >= 85 && params.earlyIgneousRecasts <= 2) {
      strengths.push(interpolate(DK_PHRASES.IGNEOUS_HIGH[0], { pct: params.igneousUptimePct }));
    } else if (params.droppedIgneousWindows > 0) {
      leaks.push(
        interpolate(DK_PHRASES.IGNEOUS_DROPPED[0], {
          dropped: params.droppedIgneousWindows
        })
      );
    } else if (params.earlyIgneousRecasts > 2) {
      leaks.push(
        interpolate(DK_PHRASES.IGNEOUS_PREMATURE[0], {
          early: params.earlyIgneousRecasts
        })
      );
    }
  }

  // 5. Status Knife
  if (params.totalKnifeCasts && params.totalKnifeCasts > 0) {
    const knifeOptPct = (params.optimalKnife! / params.totalKnifeCasts) * 100;
    if (knifeOptPct >= 60) {
      strengths.push(SORC_PHRASES.KNIFE_HIGH[0]);
    } else if ((params.earlyKnife || 0) >= (params.droppedKnife || 0)) {
      leaks.push(
        interpolate(SORC_PHRASES.KNIFE_PREMATURE[0], {
          early: params.earlyKnife || 0,
          avg: (params.avgKnifeInterval || 0).toFixed(1)
        })
      );
    } else {
      leaks.push(
        interpolate(SORC_PHRASES.KNIFE_DROPPED[0], {
          dropped: params.droppedKnife || 0,
          avg: (params.avgKnifeInterval || 0).toFixed(1)
        })
      );
    }
  }

  // 5. Dragonknight Standard
  if (params.penalizedStandardSec > 15) {
    leaks.push(
      interpolate(DK_PHRASES.STANDARD_SITTING[0], {
        sec: params.penalizedStandardSec
      })
    );
  }

  // 6. Tank Debuffs
  if (params.isTank) {
    const taunt = params.tauntUptimePct ?? 0;
    const breach = params.majorBreachUptimePct ?? 0;
    const crusher = params.crusherUptimePct ?? 0;
    const maim = params.maimUptimePct ?? 0;

    if (taunt >= 95 && breach >= 90 && crusher >= 75) {
      strengths.push(
        interpolate(DK_PHRASES.TANK_PERFECT[0], {
          taunt,
          breach,
          crusher,
          maim
        })
      );
    } else {
      if (taunt < 95) {
        leaks.push(interpolate(DK_PHRASES.TANK_TAUNT_DROPPED[0], { taunt }));
      }
      if (crusher < 75) {
        leaks.push(interpolate(DK_PHRASES.TANK_CRUSHER_LOW[0], { crusher }));
      }
      if (breach < 90) {
        leaks.push(interpolate(DK_PHRASES.TANK_BREACH_LOW[0], { breach }));
      }
    }
  }

  // 7. Active Uptime
  if (params.activeUptimePct >= 85) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.UPTIME_HIGH[0], { pct: params.activeUptimePct.toFixed(1) }));
  } else if (params.activeUptimePct < 75) {
    leaks.push(
      interpolate(UNIVERSAL_PHRASES.UPTIME_LOW[0], {
        idle: params.totalIdleSec.toFixed(1),
        pct: params.activeUptimePct.toFixed(1)
      })
    );
  }

  let assessment = OVERALL_PHRASES.MIXED[0];
  if (leaks.length === 0) {
    assessment = OVERALL_PHRASES.CLEAN[0];
  } else if (leaks.length >= 3) {
    assessment = OVERALL_PHRASES.ROUGH[0];
  }

  return { assessment, strengths, leaks };
}

/**
 * Universal fallback feedback.
 */
export function getUniversalCoachingFeedback(params: {
  connectedLAs: number;
  emptyLAs: number;
  activeUptimePct: number;
  totalIdleSec: number;
}): CoachingFeedback {
  const strengths: string[] = [];
  const leaks: string[] = [];

  const laTotal = params.connectedLAs + params.emptyLAs;
  const laPct = laTotal > 0 ? ((params.connectedLAs / laTotal) * 100).toFixed(1) : '100';

  if (Number(laPct) >= 80) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_HIGH[0], { pct: laPct }));
  } else {
    leaks.push(interpolate(UNIVERSAL_PHRASES.LA_HIT_LOW[0], { pct: laPct, empty: params.emptyLAs }));
  }

  if (params.activeUptimePct >= 85) {
    strengths.push(interpolate(UNIVERSAL_PHRASES.UPTIME_HIGH[0], { pct: params.activeUptimePct.toFixed(1) }));
  } else {
    leaks.push(
      interpolate(UNIVERSAL_PHRASES.UPTIME_LOW[0], {
        idle: params.totalIdleSec.toFixed(1),
        pct: params.activeUptimePct.toFixed(1)
      })
    );
  }

  let assessment = leaks.length === 0 ? OVERALL_PHRASES.CLEAN[0] : OVERALL_PHRASES.MIXED[0];
  return { assessment, strengths, leaks };
}
