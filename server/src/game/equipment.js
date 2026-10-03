import { getItem } from '../data/items.js'

export function equipItem(player, itemId) {
  const item = getItem(itemId)
  if (!item) return { error: '존재하지 않는 아이템입니다.' }
  if (item.type !== 'weapon' && item.type !== 'armor') return { error: '장착할 수 없는 아이템입니다.' }
  if (!player.inventory.some((s) => s.itemId === itemId)) return { error: '보유하지 않은 아이템입니다.' }

  if (item.type === 'weapon') player.equippedWeapon = itemId
  else player.equippedArmor = itemId

  return { ok: true, slot: item.type, itemId }
}

export function unequipItem(player, slot) {
  if (slot === 'weapon') player.equippedWeapon = null
  else if (slot === 'armor') player.equippedArmor = null
  else return { error: '잘못된 장비 슬롯입니다.' }
  return { ok: true, slot }
}
