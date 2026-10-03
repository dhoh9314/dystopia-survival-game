import { getSuperpower } from '../data/superpowers.js'
import { getItem } from '../data/items.js'

// Base stats stored on the character row are "allocated" stats; superpowers
// add passive modifiers on top. This is what combat/movement math should use.
export function computeEffectiveStats(character) {
  const power = getSuperpower(character.superpower)
  const mods = power?.mods ?? {}
  const buffs = { strength: 0, agility: 0, perception: 0, vitality: 0 }
  for (const buff of character.tempBuffs ?? []) {
    buffs[buff.stat] = (buffs[buff.stat] ?? 0) + buff.amount
  }
  return {
    strength: character.strength + (mods.strength ?? 0) + buffs.strength,
    agility: character.agility + (mods.agility ?? 0) + buffs.agility,
    perception: character.perception + (mods.perception ?? 0) + buffs.perception,
    vitality: character.vitality + (mods.vitality ?? 0) + buffs.vitality,
  }
}

export function computeMeleeDamage(character) {
  const eff = computeEffectiveStats(character)
  const weapon = character.equippedWeapon ? getItem(character.equippedWeapon) : null
  const weaponBonus = weapon?.damageBonus ?? 0
  const base = 4 + eff.strength * 1.4 + weaponBonus
  const variance = base * (Math.random() * 0.3 - 0.15)
  const critChance = Math.min(0.35, eff.perception * 0.02)
  const isCrit = Math.random() < critChance
  return { amount: Math.max(1, Math.round(base + variance) * (isCrit ? 2 : 1)), isCrit }
}

export function computeDefensePercent(character) {
  const armor = character.equippedArmor ? getItem(character.equippedArmor) : null
  return armor?.defensePercent ?? 0
}
