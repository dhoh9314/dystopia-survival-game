import { itemCount, removeFromInventory } from './inventory.js'
import { getItem } from '../data/items.js'
import {
  sheltersByOwner,
  getShelterAtLocation,
  createShelter,
  demolishShelter,
  registerPlayerToShelter,
  unregisterPlayerFromShelter,
} from './shelterStore.js'

export const SHELTER_COST = [
  { itemId: 'scrap_metal', qty: 5 },
  { itemId: 'alloy_plate', qty: 2 },
  { itemId: 'circuit_board', qty: 2 },
]

function costLabel() {
  return SHELTER_COST.map((c) => `${getItem(c.itemId).name} ${c.qty}`).join(', ')
}

export async function buildShelter(player, name) {
  if (player.isDead) return { error: '사망 상태입니다.' }
  if (player.encounter) return { error: '전투 중에는 건설할 수 없습니다.' }
  if (sheltersByOwner.has(player.characterId)) {
    return { error: '이미 쉘터를 가지고 있습니다. 먼저 기존 쉘터를 철거해야 합니다.' }
  }

  const existingHere = getShelterAtLocation(player.locationId)
  if (existingHere) {
    return { error: '이곳에는 이미 다른 생존자의 쉘터가 있습니다.' }
  }

  for (const c of SHELTER_COST) {
    if (itemCount(player, c.itemId) < c.qty) {
      return { error: `재료가 부족합니다. (필요: ${costLabel()})` }
    }
  }
  for (const c of SHELTER_COST) removeFromInventory(player, c.itemId, c.qty)

  const trimmedName = (name ?? '').trim().slice(0, 20) || `${player.name}의 쉘터`
  const shelter = await createShelter(player.characterId, player.locationId, trimmedName)
  return { ok: true, shelter }
}

export async function demolishOwnShelter(player) {
  if (!sheltersByOwner.has(player.characterId)) return { error: '쉘터가 없습니다.' }
  await demolishShelter(player.characterId)
  return { ok: true }
}

export async function registerToMyShelter(player, characterId) {
  const shelter = sheltersByOwner.get(player.characterId)
  if (!shelter) return { error: '쉘터가 없습니다.' }
  if (!player.interactedPlayers.some((p) => p.id === characterId)) {
    return { error: '상호작용한 적 없는 플레이어는 등록할 수 없습니다.' }
  }
  const updated = await registerPlayerToShelter(player.characterId, characterId)
  return { ok: true, shelter: updated }
}

export async function unregisterFromMyShelter(player, characterId) {
  const shelter = sheltersByOwner.get(player.characterId)
  if (!shelter) return { error: '쉘터가 없습니다.' }
  const updated = await unregisterPlayerFromShelter(player.characterId, characterId)
  return { ok: true, shelter: updated }
}
