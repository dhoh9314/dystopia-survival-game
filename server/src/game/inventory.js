import { getItem } from '../data/items.js'

export function itemCount(player, itemId) {
  return player.inventory.find((s) => s.itemId === itemId)?.qty ?? 0
}

export function addToInventory(player, itemId, qty) {
  const item = getItem(itemId)
  const existing = player.inventory.find((s) => s.itemId === itemId)
  if (existing) {
    existing.qty = Math.min(item.stack, existing.qty + qty)
  } else {
    player.inventory.push({ itemId, qty: Math.min(item.stack, qty) })
  }
}

export function removeFromInventory(player, itemId, qty) {
  const slot = player.inventory.find((s) => s.itemId === itemId)
  if (!slot) return
  slot.qty -= qty
  if (slot.qty <= 0) {
    player.inventory = player.inventory.filter((s) => s !== slot)
    if (player.equippedWeapon === itemId) player.equippedWeapon = null
    if (player.equippedArmor === itemId) player.equippedArmor = null
  }
}
