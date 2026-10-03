import { getSuperpower } from '../data/superpowers.js'

const HUNGER_DECAY_PER_SEC = 100 / (25 * 60) // empty over ~25 minutes
const THIRST_DECAY_PER_SEC = 100 / (18 * 60) // empty over ~18 minutes
const FATIGUE_GAIN_PER_SEC = 100 / (40 * 60)

export function tickSurvival(players, dt) {
  const now = Date.now()

  for (const player of players.values()) {
    if (player.tempBuffs?.length) {
      player.tempBuffs = player.tempBuffs.filter((b) => b.expiresAt > now)
    }

    if (player.isDead) continue

    // Hunger/thirst/fatigue still track and affect anything that reads them
    // (e.g. future buffs), but no longer passively damage HP on their own.
    player.hunger = Math.max(0, player.hunger - HUNGER_DECAY_PER_SEC * dt)
    player.thirst = Math.max(0, player.thirst - THIRST_DECAY_PER_SEC * dt)
    player.fatigue = Math.min(100, player.fatigue + FATIGUE_GAIN_PER_SEC * dt)

    const power = getSuperpower(player.superpower)
    if (power?.trait?.type === 'regen' && player.hp > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + power.trait.hpPerSec * dt)
    }

    if (player.hp <= 0) {
      player.hp = 0
      player.isDead = true
      player.encounter = null
    }
  }
}
