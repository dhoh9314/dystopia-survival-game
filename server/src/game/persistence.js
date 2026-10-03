import { prisma } from '../db.js'

function parseJsonArray(raw) {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function characterToPlayerState(character, socketId) {
  return {
    characterId: character.id,
    accountId: character.accountId,
    socketId,
    name: character.name,
    superpower: character.superpower,
    level: character.level,
    xp: character.xp,
    statPoints: character.statPoints,
    maxHp: character.maxHp,
    hp: character.hp,
    strength: character.strength,
    agility: character.agility,
    perception: character.perception,
    vitality: character.vitality,
    hunger: character.hunger,
    thirst: character.thirst,
    fatigue: character.fatigue,
    locationId: character.locationId,
    inventory: parseJsonArray(character.inventory),
    equippedWeapon: character.equippedWeapon ?? null,
    equippedArmor: character.equippedArmor ?? null,
    discoveredLore: parseJsonArray(character.discoveredLore),
    discoveredMobs: parseJsonArray(character.discoveredMobs),
    interactedPlayers: parseJsonArray(character.interactedPlayers),
    isDead: character.isDead,
    tempBuffs: [],
    abilityReadyAt: 0,
    encounter: null,
    pendingEvent: null,
  }
}

export async function savePlayerState(player) {
  await prisma.character.update({
    where: { id: player.characterId },
    data: {
      level: player.level,
      xp: player.xp,
      statPoints: player.statPoints,
      maxHp: player.maxHp,
      hp: Math.round(player.hp),
      strength: player.strength,
      agility: player.agility,
      perception: player.perception,
      vitality: player.vitality,
      hunger: player.hunger,
      thirst: player.thirst,
      fatigue: player.fatigue,
      locationId: player.locationId,
      inventory: JSON.stringify(player.inventory),
      equippedWeapon: player.equippedWeapon,
      equippedArmor: player.equippedArmor,
      discoveredLore: JSON.stringify(player.discoveredLore),
      discoveredMobs: JSON.stringify(player.discoveredMobs),
      interactedPlayers: JSON.stringify(player.interactedPlayers),
      isDead: player.isDead,
    },
  })
}
