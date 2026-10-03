import { getMobType } from '../data/mobs.js'
import { getItem } from '../data/items.js'
import { getSuperpower } from '../data/superpowers.js'
import { computeMeleeDamage, computeDefensePercent } from './stats.js'
import { applyXp, autoStatGrowth } from '../data/leveling.js'
import { DEFAULT_LOCATION_ID } from '../data/zones.js'
import { addToInventory } from './inventory.js'
import { rollRandomEvent, getEvent } from '../data/events.js'
import { getShelterAtLocation, getShelterForPlayer, hasShelterAccess } from './shelterStore.js'

function rollLoot(lootTable) {
  const drops = []
  for (const entry of lootTable) {
    if (Math.random() <= entry.chance) {
      const qty = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1))
      drops.push({ itemId: entry.itemId, qty })
    }
  }
  return drops
}

function pickWeightedMob(mobPool) {
  const total = mobPool.reduce((sum, p) => sum + p.weight, 0)
  let roll = Math.random() * total
  for (const entry of mobPool) {
    if (roll < entry.weight) return entry.mobType
    roll -= entry.weight
  }
  return mobPool[mobPool.length - 1].mobType
}

function grantKillRewards(player, mobTypeId) {
  const mobType = getMobType(mobTypeId)
  const { level, xp, levelsGained, statPointsGained } = applyXp(player, mobType.xpReward)
  player.level = level
  player.xp = xp
  player.statPoints += statPointsGained
  if (levelsGained > 0) {
    const growth = autoStatGrowth(levelsGained)
    player.maxHp += growth.maxHp
    player.hp = player.maxHp
    player.strength += growth.strength
    player.agility += growth.agility
    player.perception += growth.perception
    player.vitality += growth.vitality
  }

  const drops = rollLoot(mobType.lootTable)
  for (const d of drops) addToInventory(player, d.itemId, d.qty)

  let newlyDiscoveredMob = false
  if (!player.discoveredMobs.includes(mobTypeId)) {
    player.discoveredMobs = [...player.discoveredMobs, mobTypeId]
    newlyDiscoveredMob = true
  }

  return {
    newlyDiscoveredMob,
    mobType: mobTypeId,
    mobName: mobType.name,
    xpGained: mobType.xpReward,
    levelsGained,
    newLevel: player.level,
    loot: drops,
  }
}

// --- entering combat -------------------------------------------------------

const EVENT_CHANCE = 0.25

export function searchLocation(player, location) {
  if (player.isDead) return { error: '사망 상태입니다.' }
  if (player.encounter) return { error: '이미 전투 중입니다.' }
  if (player.pendingEvent) return { error: '먼저 눈앞의 상황에 대응해야 합니다.' }

  const hasMobs = !location.isSafe && location.mobPool.length > 0
  const roll = Math.random()
  let cursor = 0

  if (hasMobs) {
    cursor += location.encounterChance
    if (roll < cursor) {
      const mobTypeId = pickWeightedMob(location.mobPool)
      const mobType = getMobType(mobTypeId)
      player.encounter = {
        mobType: mobTypeId,
        mobHp: mobType.maxHp,
        mobMaxHp: mobType.maxHp,
        mobStunTurns: 0,
        mobBurnTurns: 0,
        mobBurnDps: 0,
      }
      return { type: 'encounter', mobType: mobTypeId, mobName: mobType.name, encounter: player.encounter }
    }
  }

  cursor += EVENT_CHANCE
  if (roll < cursor) {
    const event = rollRandomEvent(player, location)
    let newlyDiscoveredLore = false
    if (event.eventType === 'lore' && event.message && !player.discoveredLore.includes(event.message)) {
      player.discoveredLore = [...player.discoveredLore, event.message]
      newlyDiscoveredLore = true
    }
    return { type: 'event', newlyDiscoveredLore, ...event }
  }

  const drops = rollLoot(location.searchLoot ?? [])
  if (drops.length > 0) {
    for (const d of drops) addToInventory(player, d.itemId, d.qty)
    return { type: 'loot', loot: drops }
  }
  return {
    type: 'nothing',
    message: location.isSafe ? '이곳은 비교적 안전해 보입니다. 특별한 것을 찾지 못했습니다.' : '아무것도 찾지 못했습니다.',
  }
}

export function resolveEventChoice(player, choiceId) {
  const pending = player.pendingEvent
  if (!pending) return { error: '대기 중인 선택이 없습니다.' }

  const event = getEvent(pending.eventId)
  if (!event) {
    player.pendingEvent = null
    return { error: '이벤트를 찾을 수 없습니다.' }
  }
  if (!event.choices.some((c) => c.id === choiceId)) {
    return { error: '잘못된 선택입니다.' }
  }

  const result = event.resolve(player, choiceId)
  player.pendingEvent = null

  if (result.xpGain) {
    const { level, xp, levelsGained, statPointsGained } = applyXp(player, result.xpGain)
    player.level = level
    player.xp = xp
    player.statPoints += statPointsGained
    if (levelsGained > 0) {
      const growth = autoStatGrowth(levelsGained)
      player.maxHp += growth.maxHp
      player.hp = player.maxHp
      player.strength += growth.strength
      player.agility += growth.agility
      player.perception += growth.perception
      player.vitality += growth.vitality
    }
  }

  if (player.hp <= 0) {
    player.hp = 0
    player.isDead = true
  }

  return { ok: true, ...result }
}

// --- resolving one combat exchange -----------------------------------------

export function resolveCombatAction(player, action, payload = {}) {
  const encounter = player.encounter
  if (!encounter) return { error: '전투 중이 아닙니다.' }
  if (player.isDead) return { error: '사망 상태입니다.' }

  const log = []

  if (action === 'attack') {
    const power = getSuperpower(player.superpower)
    const { amount, isCrit } = computeMeleeDamage(player)
    let dmg = amount

    if (power?.trait?.type === 'bonus_vs_robot') {
      dmg = Math.round(dmg * (1 + power.trait.percent))
      if (Math.random() < power.trait.stunChance) {
        encounter.mobStunTurns += 1
        log.push('신경 해킹으로 로봇의 제어 체계가 일시 마비되었습니다.')
      }
    }
    if (power?.trait?.type === 'burn' && Math.random() < power.trait.chance) {
      encounter.mobBurnTurns = Math.max(encounter.mobBurnTurns, Math.round(power.trait.duration))
      encounter.mobBurnDps = power.trait.dps
      log.push('로봇의 회로가 과열되기 시작했습니다.')
    }

    encounter.mobHp = Math.max(0, encounter.mobHp - dmg)
    log.push(`${isCrit ? '치명타! ' : ''}${dmg}의 피해를 입혔습니다.`)

    if (power?.trait?.type === 'extra_attack' && encounter.mobHp > 0 && Math.random() < power.trait.chance) {
      const second = computeMeleeDamage(player)
      encounter.mobHp = Math.max(0, encounter.mobHp - second.amount)
      log.push(`아드레날린이 폭주해 한 번 더 몰아쳤습니다! ${second.isCrit ? '치명타! ' : ''}${second.amount}의 추가 피해.`)
    }
  } else if (action === 'ability') {
    const result = useCombatAbility(player, encounter, log)
    if (result?.error) return result
  } else if (action === 'item') {
    const result = useInventoryItem(player, payload.itemId)
    if (result.error) return result
    log.push('아이템을 사용했습니다.')
  } else if (action === 'flee') {
    const fleeChance = Math.min(0.9, 0.5 + player.agility * 0.02)
    if (Math.random() < fleeChance) {
      player.encounter = null
      log.push('성공적으로 도망쳤습니다.')
      return { ok: true, fled: true, log }
    }
    log.push('도망에 실패했습니다!')
  } else {
    return { error: '알 수 없는 행동입니다.' }
  }

  if (encounter.mobHp <= 0) {
    const kill = grantKillRewards(player, encounter.mobType)
    player.encounter = null
    log.push(`${kill.mobName}을(를) 파괴했습니다.`)
    return { ok: true, kill, log, playerHp: player.hp }
  }

  if (encounter.mobBurnTurns > 0) {
    encounter.mobHp = Math.max(0, encounter.mobHp - encounter.mobBurnDps)
    encounter.mobBurnTurns -= 1
    log.push(`화상으로 로봇이 ${encounter.mobBurnDps}의 피해를 입었습니다.`)
    if (encounter.mobHp <= 0) {
      const kill = grantKillRewards(player, encounter.mobType)
      player.encounter = null
      log.push(`${kill.mobName}을(를) 파괴했습니다.`)
      return { ok: true, kill, log, playerHp: player.hp }
    }
  }

  if (encounter.mobStunTurns > 0) {
    encounter.mobStunTurns -= 1
    log.push('로봇이 마비 상태라 반격하지 못했습니다.')
  } else {
    const mobType = getMobType(encounter.mobType)
    const variance = mobType.damage * (Math.random() * 0.2 - 0.1)
    let dmg = Math.max(1, Math.round(mobType.damage + variance))
    const defensePercent = computeDefensePercent(player)
    if (defensePercent > 0) {
      dmg = Math.max(1, Math.round(dmg * (1 - defensePercent)))
    }
    const power = getSuperpower(player.superpower)
    if (power?.trait?.type === 'damage_reduction') {
      dmg = Math.max(1, Math.round(dmg * (1 - power.trait.percent)))
    }
    player.hp = Math.max(0, player.hp - dmg)
    log.push(`${mobType.name}의 반격! ${dmg}의 피해를 입었습니다.`)
    if (player.hp <= 0) {
      player.isDead = true
      player.hp = 0
      player.encounter = null
      log.push('쓰러졌습니다...')
    }
  }

  return { ok: true, encounter: player.encounter, log, playerHp: player.hp, isDead: player.isDead }
}

function useCombatAbility(player, encounter, log) {
  const power = getSuperpower(player.superpower)
  const traitType = power?.trait?.type
  if (!['aoe_stun', 'blood_weapon', 'shadow_strike'].includes(traitType)) {
    return { error: '이 초능력은 패시브입니다.' }
  }

  const now = Date.now()
  if (now < (player.abilityReadyAt ?? 0)) {
    return { error: '쿨다운 중입니다.', readyAt: player.abilityReadyAt }
  }

  if (traitType === 'aoe_stun') {
    player.abilityReadyAt = now + power.trait.cooldown * 1000
    encounter.mobStunTurns += Math.max(1, Math.round(power.trait.duration))
    log.push('전자기 펄스가 로봇을 마비시켰습니다.')
    return null
  }

  if (traitType === 'blood_weapon') {
    if (player.hp <= power.trait.selfDamage) return { error: '흘릴 피가 부족합니다.' }
    player.hp = Math.max(1, player.hp - power.trait.selfDamage)
    player.abilityReadyAt = now + power.trait.cooldown * 1000
    player.tempBuffs = player.tempBuffs ?? []
    player.tempBuffs.push({
      stat: 'strength',
      amount: power.trait.strengthBonus,
      expiresAt: now + power.trait.duration * 1000,
    })
    log.push(`스스로에게 상처를 내 피로 무기를 벼려냈습니다. (-${power.trait.selfDamage} HP, 공격력 강화)`)
    return null
  }

  if (traitType === 'shadow_strike') {
    player.abilityReadyAt = now + power.trait.cooldown * 1000
    const { amount, isCrit } = computeMeleeDamage(player)
    const dmg = Math.round(amount * power.trait.damageMultiplier)
    encounter.mobHp = Math.max(0, encounter.mobHp - dmg)
    log.push(`그림자가 적을 꿰뚫었습니다. ${isCrit ? '치명타! ' : ''}${dmg}의 피해!`)
    return null
  }

  return { error: '알 수 없는 초능력입니다.' }
}

// --- out-of-combat actions ---------------------------------------------

export function restAtLocation(player, location) {
  if (player.isDead) return { error: '사망 상태입니다.' }
  if (player.encounter) return { error: '전투 중에는 쉴 수 없습니다.' }
  const shelterHere = getShelterAtLocation(player.locationId)
  if (!location.isSafe && !hasShelterAccess(shelterHere, player.characterId)) {
    return { error: '이곳은 안전하지 않아 휴식할 수 없습니다.' }
  }

  player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.25))
  player.fatigue = Math.max(0, player.fatigue - 25)
  player.hunger = Math.max(0, player.hunger - 3)
  player.thirst = Math.max(0, player.thirst - 4)

  return { ok: true }
}

export function useInventoryItem(player, itemId) {
  const slot = player.inventory.find((s) => s.itemId === itemId)
  if (!slot) return { error: '인벤토리에 없는 아이템입니다.' }
  const item = getItem(itemId)
  if (!item || item.type !== 'consumable') return { error: '사용할 수 없는 아이템입니다.' }

  if (item.effect.hp) player.hp = Math.min(player.maxHp, player.hp + item.effect.hp)
  if (item.effect.hunger) player.hunger = Math.min(100, player.hunger + item.effect.hunger)
  if (item.effect.thirst) player.thirst = Math.min(100, player.thirst + item.effect.thirst)
  if (item.effect.fatigue) player.fatigue = Math.max(0, player.fatigue + item.effect.fatigue)

  for (const stat of ['strength', 'agility', 'perception', 'vitality']) {
    if (item.effect[stat]) {
      player.tempBuffs = player.tempBuffs ?? []
      player.tempBuffs.push({
        stat,
        amount: item.effect[stat],
        expiresAt: Date.now() + item.effect.durationSec * 1000,
      })
    }
  }

  slot.qty -= 1
  if (slot.qty <= 0) {
    player.inventory = player.inventory.filter((s) => s !== slot)
  }
  return { ok: true }
}

export function respawnPlayer(player) {
  player.isDead = false
  player.hp = player.maxHp
  player.hunger = Math.max(player.hunger, 40)
  player.thirst = Math.max(player.thirst, 40)
  player.encounter = null
  const shelter = getShelterForPlayer(player.characterId)
  player.locationId = shelter ? shelter.locationId : DEFAULT_LOCATION_ID
}
