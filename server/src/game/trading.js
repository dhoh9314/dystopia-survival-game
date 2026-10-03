import { nanoid } from 'nanoid'
import { itemCount, addToInventory, removeFromInventory } from './inventory.js'

export const trades = new Map() // tradeId -> session
export const pendingRequests = new Map() // targetCharacterId -> { fromCharacterId, fromName }

export function requestTrade(fromPlayer, toPlayer) {
  if (fromPlayer.isDead || toPlayer.isDead) return { error: '사망 상태에서는 거래할 수 없습니다.' }
  if (fromPlayer.encounter || toPlayer.encounter) return { error: '전투 중에는 거래할 수 없습니다.' }
  if (fromPlayer.locationId !== toPlayer.locationId) return { error: '같은 장소에 있어야 거래할 수 있습니다.' }
  if (findActiveTradeForPlayer(fromPlayer.characterId) || findActiveTradeForPlayer(toPlayer.characterId)) {
    return { error: '이미 거래가 진행 중입니다.' }
  }
  pendingRequests.set(toPlayer.characterId, { fromCharacterId: fromPlayer.characterId, fromName: fromPlayer.name })
  return { ok: true }
}

export function startTrade(playerAId, playerBId) {
  const id = nanoid(10)
  const session = {
    id,
    playerAId,
    playerBId,
    offers: { [playerAId]: [], [playerBId]: [] },
    confirmed: { [playerAId]: false, [playerBId]: false },
  }
  trades.set(id, session)
  return session
}

export function otherPlayerId(session, characterId) {
  return session.playerAId === characterId ? session.playerBId : session.playerAId
}

export function updateOffer(session, player, items) {
  for (const it of items) {
    if (itemCount(player, it.itemId) < it.qty) {
      return { error: '보유 수량을 초과했습니다.' }
    }
  }
  session.offers[player.characterId] = items
  session.confirmed[session.playerAId] = false
  session.confirmed[session.playerBId] = false
  return { ok: true }
}

// Returns true once both sides have confirmed.
export function confirmTrade(session, characterId) {
  session.confirmed[characterId] = true
  return session.confirmed[session.playerAId] && session.confirmed[session.playerBId]
}

export function executeTrade(session, playerA, playerB) {
  for (const { itemId, qty } of session.offers[playerA.characterId]) {
    if (itemCount(playerA, itemId) < qty) return { error: `${playerA.name}님의 재고가 부족해 거래가 취소되었습니다.` }
  }
  for (const { itemId, qty } of session.offers[playerB.characterId]) {
    if (itemCount(playerB, itemId) < qty) return { error: `${playerB.name}님의 재고가 부족해 거래가 취소되었습니다.` }
  }

  for (const { itemId, qty } of session.offers[playerA.characterId]) {
    removeFromInventory(playerA, itemId, qty)
    addToInventory(playerB, itemId, qty)
  }
  for (const { itemId, qty } of session.offers[playerB.characterId]) {
    removeFromInventory(playerB, itemId, qty)
    addToInventory(playerA, itemId, qty)
  }

  trades.delete(session.id)
  return { ok: true }
}

export function cancelTrade(session) {
  trades.delete(session.id)
}

export function findActiveTradeForPlayer(characterId) {
  for (const session of trades.values()) {
    if (session.playerAId === characterId || session.playerBId === characterId) return session
  }
  return null
}
