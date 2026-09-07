import { RotationSpec } from '@/types/rotation';
import { shootingStarCorpsebursterNecro } from './necromancer-corpseburster';
import { arcanistDPS } from './arcanist-dps';
import { sorcererDPS } from './sorcerer-dps';
import { dkTank } from './dk-tank';
import { dkZenkosh } from './dk-zenkosh';
import { dkParse } from './dk-parse';
import { createGenericSpec } from './generic';

shootingStarCorpsebursterNecro.isRecognized = true;
arcanistDPS.isRecognized = true;
sorcererDPS.isRecognized = true;
dkTank.isRecognized = true;
dkZenkosh.isRecognized = true;
dkParse.isRecognized = true;

export const ALL_ROTATION_SPECS: RotationSpec[] = [
  shootingStarCorpsebursterNecro,
  arcanistDPS,
  sorcererDPS,
  dkParse,
  dkZenkosh,
  dkTank
];

export function getRotationSpec(id: string): RotationSpec {
  const found = ALL_ROTATION_SPECS.find(s => s.id === id);
  if (found) return found;
  return shootingStarCorpsebursterNecro;
}

export function getSpecsForClass(className: string): RotationSpec[] {
  const norm = className.toLowerCase().replace(/[\s_-]+/g, '');
  return ALL_ROTATION_SPECS.filter(s => {
    const specNorm = s.class.toLowerCase().replace(/[\s_-]+/g, '');
    return specNorm === norm || (norm === 'dk' && specNorm === 'dragonknight');
  });
}

export interface ActorSpecContext {
  gear?: Array<{ setName?: string; name?: string; setID?: number }>;
  specs?: string[];
  role?: string;
  casts?: Array<{ ability?: { name?: string; guid?: number } }>;
  debuffs?: Array<{ name?: string; guid?: number }>;
}

export function isZenkoshDK(context?: ActorSpecContext): boolean {
  if (!context) return false;

  // 1. Check Gear: Z'en's Redress (setID 455) or Roar of Alkosh (setID 232)
  if (context.gear && context.gear.length > 0) {
    const hasZen = context.gear.some(
      g => g.setID === 455 || (g.setName && /z['’]?en/i.test(g.setName))
    );
    const hasAlkosh = context.gear.some(
      g => g.setID === 232 || (g.setName && /alkosh/i.test(g.setName))
    );
    if (hasZen || hasAlkosh) return true;
  }

  // 2. Check Debuffs (Touch of Z'en guid 126597/126601, Alkosh guid 75753/17945)
  if (context.debuffs && context.debuffs.length > 0) {
    const hasZenDebuff = context.debuffs.some(
      d => d.guid === 126597 || d.guid === 126601 || Boolean(d.name && /touch of z['’]?en/i.test(d.name))
    );
    const hasAlkoshDebuff = context.debuffs.some(
      d => d.guid === 75753 || d.guid === 17945 || Boolean(d.name && /alkosh/i.test(d.name))
    );
    if (hasZenDebuff || hasAlkoshDebuff) return true;
  }

  // 3. Check Casts / Abilities
  if (context.casts && context.casts.length > 0) {
    const hasZenOrAlkoshCast = context.casts.some(
      c => c.ability?.name && (/touch of z['’]?en/i.test(c.ability.name) || /alkosh/i.test(c.ability.name))
    );
    if (hasZenOrAlkoshCast) return true;
  }

  return false;
}

export function isTankDK(context?: ActorSpecContext): boolean {
  if (!context) return false;

  if (context.specs?.some(s => s.toLowerCase().includes('tank')) || context.role?.toLowerCase() === 'tank') {
    return true;
  }

  // Check Taunt casts (Pierce Armor 38254, Ransack 38250, Inner Fire 39475, Inner Beast 42060, Inner Rage 42056, Frost Clench 38989)
  if (context.casts && context.casts.length > 0) {
    const tauntGuids = [38254, 38250, 39475, 42060, 42056, 38989];
    const hasTauntCast = context.casts.some(
      c => c.ability?.guid && tauntGuids.includes(c.ability.guid)
    );
    if (hasTauntCast) return true;
  }

  return false;
}

/**
 * Resolves rotation spec based on the player's class in the log.
 * Also dynamically detects Zenkosh DK vs Parse DK vs Tank DK based on gear, specs, and debuffs.
 * If the class is not yet modeled, returns a generic fallback spec with isRecognized = false.
 */
export function resolveSpecForActor(
  actorClass: string,
  explicitSpecId?: string,
  context?: ActorSpecContext
): { spec: RotationSpec; isRecognized: boolean } {
  if (explicitSpecId) {
    const found = ALL_ROTATION_SPECS.find(s => s.id === explicitSpecId);
    if (found) return { spec: found, isRecognized: true };
  }

  const normalized = actorClass.toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized === 'arcanist') {
    return { spec: arcanistDPS, isRecognized: true };
  }
  if (normalized === 'necromancer') {
    return { spec: shootingStarCorpsebursterNecro, isRecognized: true };
  }
  if (normalized === 'sorcerer') {
    return { spec: sorcererDPS, isRecognized: true };
  }
  if (normalized === 'dragonknight' || normalized === 'dk') {
    if (context) {
      if (isZenkoshDK(context)) {
        return { spec: dkZenkosh, isRecognized: true };
      }
      if (isTankDK(context)) {
        return { spec: dkTank, isRecognized: true };
      }
    }
    return { spec: dkParse, isRecognized: true };
  }

  return { spec: createGenericSpec(actorClass), isRecognized: false };
}

export {
  shootingStarCorpsebursterNecro,
  arcanistDPS,
  sorcererDPS,
  dkTank,
  dkZenkosh,
  dkParse,
  createGenericSpec
};



