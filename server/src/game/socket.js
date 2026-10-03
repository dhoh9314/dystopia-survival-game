import { Server } from 'socket.io'
import { verifySocketToken } from '../auth.js'
import { prisma } from '../db.js'
import { getZone, getLocation, locationsInZone, LOCATIONS, DEFAULT_LOCATION_ID } from '../data/zones.js'
import { players, playersAtLocation } from './world.js'
import { characterToPlayerState, savePlayerState } from './persistence.js'
import {
  searchLocation,
  resolveCombatAction,
  resolveEventChoice,
  restAtLocation,
  useInventoryItem,
  respawnPlayer,
} from './combat.js'
import { tickSurvival } from './survival.js'
import { craftItem } from './crafting.js'
import { equipItem, unequipItem } from './equipment.js'
import {
  trades,
  requestTrade,
  startTrade,
  otherPlayerId,
  updateOffer,
  confirmTrade,
  executeTrade,
  cancelTrade,
  findActiveTradeForPlayer,
  pendingRequests,
} from './trading.js'
import { buildShelter, demolishOwnShelter, registerToMyShelter, unregisterFromMyShelter, SHELTER_COST } from './shelter.js'
import { sheltersByOwner, getShelterAtLocation, hasShelterAccess } from './shelterStore.js'

const SURVIVAL_TICK_MS = 5000
const PERSIST_INTERVAL_MS = 15_000

function publicPresence(p) {
  return { id: p.characterId, name: p.name, level: p.level, superpower: p.superpower }
}

function selfState(p) {
  return {
    id: p.characterId,
    name: p.name,
    superpower: p.superpower,
    level: p.level,
    xp: p.xp,
    statPoints: p.statPoints,
    hp: Math.round(p.hp),
    maxHp: p.maxHp,
    strength: p.strength,
    agility: p.agility,
    perception: p.perception,
    vitality: p.vitality,
    hunger: Math.round(p.hunger),
    thirst: Math.round(p.thirst),
    fatigue: Math.round(p.fatigue),
    locationId: p.locationId,
    inventory: p.inventory,
    equippedWeapon: p.equippedWeapon,
    equippedArmor: p.equippedArmor,
    discoveredLore: p.discoveredLore,
    discoveredMobs: p.discoveredMobs,
    interactedPlayers: p.interactedPlayers,
    myShelter: sheltersByOwner.get(p.characterId) ?? null,
    isDead: p.isDead,
    encounter: p.encounter,
    pendingEvent: p.pendingEvent,
    abilityReadyAt: p.abilityReadyAt,
  }
}

function locationDetailPayload(locationId, viewerCharacterId) {
  const loc = getLocation(locationId)
  const zone = getZone(loc.zoneId)
  const shelter = getShelterAtLocation(locationId)
  return {
    id: loc.id,
    name: loc.name,
    kind: loc.kind,
    description: loc.description,
    isSafe: loc.isSafe,
    hasEncounters: loc.mobPool.length > 0,
    zoneId: zone.id,
    zoneName: zone.name,
    dangerLevel: zone.dangerLevel,
    shelter: shelter ? { ownerId: shelter.ownerId, name: shelter.name, hasAccess: hasShelterAccess(shelter, viewerCharacterId) } : null,
    canBuildShelterHere: !shelter,
    connections: loc.connections.map((id) => {
      const l = getLocation(id)
      const z = getZone(l.zoneId)
      return { id: l.id, name: l.name, kind: l.kind, isSafe: l.isSafe, zoneId: z.id, zoneName: z.name, crossZone: z.id !== zone.id }
    }),
  }
}

function zoneMapPayload(zoneId) {
  const zone = getZone(zoneId)
  const locs = locationsInZone(zoneId)
  const locationIds = new Set(locs.map((l) => l.id))

  const gatewayIds = new Set()
  for (const l of locs) {
    for (const c of l.connections) {
      if (!locationIds.has(c)) gatewayIds.add(c)
    }
  }

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    zoneDescription: zone.description,
    dangerLevel: zone.dangerLevel,
    locations: locs.map((l) => ({
      id: l.id,
      name: l.name,
      kind: l.kind,
      isSafe: l.isSafe,
      position: l.position,
      connections: l.connections,
    })),
    gateways: [...gatewayIds].map((id) => {
      const l = getLocation(id)
      const z = getZone(l.zoneId)
      return { id: l.id, name: l.name, zoneId: z.id, zoneName: z.name }
    }),
  }
}

function presenceList(locationId, excludeCharacterId) {
  return playersAtLocation(locationId, excludeCharacterId).map(publicPresence)
}

export function createGameServer(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  })

  function broadcastPresence(locationId) {
    io.to(locationId).emit('presenceUpdate', presenceList(locationId, null))
  }

  function moveToLocation(socket, player, newLocationId) {
    const oldLocationId = player.locationId
    socket.leave(oldLocationId)
    player.locationId = newLocationId
    socket.join(newLocationId)
    broadcastPresence(oldLocationId)
    broadcastPresence(newLocationId)
  }

  function broadcastTradeState(session) {
    const a = players.get(session.playerAId)
    const b = players.get(session.playerBId)
    if (!a || !b) {
      cancelTrade(session)
      if (a) io.to(a.socketId).emit('tradeCancelled', {})
      if (b) io.to(b.socketId).emit('tradeCancelled', {})
      return
    }
    io.to(a.socketId).emit('tradeUpdate', {
      tradeId: session.id,
      myOffer: session.offers[a.characterId],
      otherOffer: session.offers[b.characterId],
      myConfirmed: session.confirmed[a.characterId],
      otherConfirmed: session.confirmed[b.characterId],
    })
    io.to(b.socketId).emit('tradeUpdate', {
      tradeId: session.id,
      myOffer: session.offers[b.characterId],
      otherOffer: session.offers[a.characterId],
      myConfirmed: session.confirmed[b.characterId],
      otherConfirmed: session.confirmed[a.characterId],
    })
  }

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    const accountId = token ? verifySocketToken(token) : null
    if (!accountId) return next(new Error('unauthorized'))

    const decodedCharacterId = socket.handshake.auth?.characterId
    const character = await prisma.character.findUnique({ where: { id: decodedCharacterId } })
    if (!character || character.accountId !== accountId) return next(new Error('unauthorized'))

    socket.data.accountId = accountId
    socket.data.characterId = character.id
    socket.data.initialCharacter = character
    next()
  })

  io.on('connection', (socket) => {
    const character = socket.data.initialCharacter
    const player = characterToPlayerState(character, socket.id)
    if (!LOCATIONS[player.locationId]) player.locationId = DEFAULT_LOCATION_ID

    players.set(player.characterId, player)
    socket.join(player.locationId)

    socket.emit('init', {
      self: selfState(player),
      location: locationDetailPayload(player.locationId, player.characterId),
      zoneMap: zoneMapPayload(getLocation(player.locationId).zoneId),
      presence: presenceList(player.locationId, player.characterId),
    })
    broadcastPresence(player.locationId)

    socket.on('travel', ({ toLocationId }) => {
      if (player.isDead) return socket.emit('travelResult', { error: '사망 상태입니다.' })
      if (player.encounter) return socket.emit('travelResult', { error: '전투 중에는 이동할 수 없습니다.' })
      if (player.pendingEvent) return socket.emit('travelResult', { error: '먼저 눈앞의 상황에 대응해야 합니다.' })
      if (findActiveTradeForPlayer(player.characterId)) {
        return socket.emit('travelResult', { error: '거래 중에는 이동할 수 없습니다.' })
      }

      const current = getLocation(player.locationId)
      if (!current.connections.includes(toLocationId)) {
        return socket.emit('travelResult', { error: '그곳으로 바로 이동할 수 없습니다.' })
      }

      const fromZoneId = current.zoneId
      moveToLocation(socket, player, toLocationId)
      const toZoneId = getLocation(toLocationId).zoneId

      socket.emit('travelResult', {
        ok: true,
        self: selfState(player),
        location: locationDetailPayload(player.locationId, player.characterId),
        zoneMap: toZoneId === fromZoneId ? null : zoneMapPayload(toZoneId),
        presence: presenceList(player.locationId, player.characterId),
      })
    })

    socket.on('search', () => {
      if (findActiveTradeForPlayer(player.characterId)) {
        return socket.emit('searchResult', { error: '거래 중에는 탐색할 수 없습니다.' })
      }
      const location = getLocation(player.locationId)
      const result = searchLocation(player, location)
      socket.emit('searchResult', { ...result, self: selfState(player) })
    })

    socket.on('eventChoice', ({ choiceId }) => {
      const result = resolveEventChoice(player, choiceId)
      socket.emit('eventChoiceResult', { ...result, self: selfState(player) })
    })

    socket.on('craft', ({ recipeId }) => {
      const result = craftItem(player, recipeId)
      socket.emit('craftResult', { ...result, self: selfState(player) })
    })

    socket.on('equip', ({ itemId }) => {
      const result = equipItem(player, itemId)
      socket.emit('equipResult', { ...result, self: selfState(player) })
    })

    socket.on('unequip', ({ slot }) => {
      const result = unequipItem(player, slot)
      socket.emit('equipResult', { ...result, self: selfState(player) })
    })

    socket.on('buildShelter', async ({ name }) => {
      const result = await buildShelter(player, name)
      socket.emit('shelterResult', {
        ...result,
        self: selfState(player),
        location: locationDetailPayload(player.locationId, player.characterId),
      })
    })

    socket.on('demolishShelter', async () => {
      const result = await demolishOwnShelter(player)
      socket.emit('shelterResult', {
        ...result,
        self: selfState(player),
        location: locationDetailPayload(player.locationId, player.characterId),
      })
    })

    socket.on('registerShelterPlayer', async ({ characterId }) => {
      const result = await registerToMyShelter(player, characterId)
      socket.emit('shelterResult', { ...result, self: selfState(player) })
    })

    socket.on('unregisterShelterPlayer', async ({ characterId }) => {
      const result = await unregisterFromMyShelter(player, characterId)
      socket.emit('shelterResult', { ...result, self: selfState(player) })
    })

    socket.on('combatAction', ({ action, itemId }) => {
      const result = resolveCombatAction(player, action, { itemId })
      socket.emit('combatResult', { ...result, self: selfState(player) })
    })

    socket.on('rest', () => {
      if (player.pendingEvent) return socket.emit('restResult', { error: '먼저 눈앞의 상황에 대응해야 합니다.' })
      if (findActiveTradeForPlayer(player.characterId)) {
        return socket.emit('restResult', { error: '거래 중에는 쉴 수 없습니다.' })
      }
      const location = getLocation(player.locationId)
      const result = restAtLocation(player, location)
      socket.emit('restResult', { ...result, self: selfState(player) })
    })

    socket.on('useItem', ({ itemId }) => {
      const result = useInventoryItem(player, itemId)
      socket.emit('useItemResult', { ...result, self: selfState(player) })
    })

    socket.on('tradeRequest', ({ toCharacterId }) => {
      const target = players.get(toCharacterId)
      if (!target) return socket.emit('tradeError', { error: '대상을 찾을 수 없습니다.' })
      const result = requestTrade(player, target)
      if (result.error) return socket.emit('tradeError', result)
      io.to(target.socketId).emit('tradeRequestReceived', { fromCharacterId: player.characterId, fromName: player.name })
      socket.emit('tradeRequestSent', { toCharacterId, toName: target.name })
    })

    socket.on('tradeRespond', ({ fromCharacterId, accept }) => {
      const pending = pendingRequests.get(player.characterId)
      if (!pending || pending.fromCharacterId !== fromCharacterId) return
      pendingRequests.delete(player.characterId)
      const requester = players.get(fromCharacterId)
      if (!requester) return
      if (!accept) {
        io.to(requester.socketId).emit('tradeDeclined', { byName: player.name })
        return
      }
      const session = startTrade(fromCharacterId, player.characterId)
      io.to(requester.socketId).emit('tradeStarted', { tradeId: session.id, other: { id: player.characterId, name: player.name } })
      socket.emit('tradeStarted', { tradeId: session.id, other: { id: requester.characterId, name: requester.name } })
    })

    socket.on('tradeOffer', ({ tradeId, items }) => {
      const session = trades.get(tradeId)
      if (!session) return
      const result = updateOffer(session, player, items ?? [])
      if (result.error) return socket.emit('tradeError', result)
      broadcastTradeState(session)
    })

    socket.on('tradeConfirm', ({ tradeId }) => {
      const session = trades.get(tradeId)
      if (!session) return
      const bothConfirmed = confirmTrade(session, player.characterId)
      if (!bothConfirmed) {
        broadcastTradeState(session)
        return
      }
      const a = players.get(session.playerAId)
      const b = players.get(session.playerBId)
      const result = executeTrade(session, a, b)
      if (result.error) {
        if (a) io.to(a.socketId).emit('tradeCancelled', { reason: result.error })
        if (b) io.to(b.socketId).emit('tradeCancelled', { reason: result.error })
        return
      }
      if (a && !a.interactedPlayers.some((p) => p.id === b.characterId)) {
        a.interactedPlayers = [...a.interactedPlayers, { id: b.characterId, name: b.name }]
      }
      if (b && !b.interactedPlayers.some((p) => p.id === a.characterId)) {
        b.interactedPlayers = [...b.interactedPlayers, { id: a.characterId, name: a.name }]
      }
      if (a) io.to(a.socketId).emit('tradeCompleted', { self: selfState(a) })
      if (b) io.to(b.socketId).emit('tradeCompleted', { self: selfState(b) })
    })

    socket.on('tradeCancel', ({ tradeId }) => {
      const session = trades.get(tradeId)
      if (!session) return
      const other = players.get(otherPlayerId(session, player.characterId))
      cancelTrade(session)
      socket.emit('tradeCancelled', {})
      if (other) io.to(other.socketId).emit('tradeCancelled', {})
    })

    socket.on('respawn', () => {
      if (!player.isDead) return
      const oldLocationId = player.locationId
      respawnPlayer(player)
      socket.leave(oldLocationId)
      socket.join(player.locationId)
      broadcastPresence(oldLocationId)
      broadcastPresence(player.locationId)
      socket.emit('respawned', {
        self: selfState(player),
        location: locationDetailPayload(player.locationId, player.characterId),
        zoneMap: zoneMapPayload(getLocation(player.locationId).zoneId),
        presence: presenceList(player.locationId, player.characterId),
      })
    })

    socket.on('disconnect', () => {
      // A newer connection for this character may already have taken over
      // (fast reconnect, or a leaked duplicate from client-side re-render).
      // Only the connection currently owning the map entry may clean up.
      if (players.get(player.characterId) !== player) return

      pendingRequests.delete(player.characterId)
      const activeTrade = findActiveTradeForPlayer(player.characterId)
      if (activeTrade) {
        const other = players.get(otherPlayerId(activeTrade, player.characterId))
        cancelTrade(activeTrade)
        if (other) io.to(other.socketId).emit('tradeCancelled', { reason: '상대방의 연결이 끊어졌습니다.' })
      }
      players.delete(player.characterId)
      broadcastPresence(player.locationId)
      savePlayerState(player).catch((err) => console.error('save on disconnect failed', err))
    })
  })

  setInterval(() => {
    const dt = SURVIVAL_TICK_MS / 1000
    tickSurvival(players, dt)
    for (const player of players.values()) {
      io.to(player.socketId).emit('self', selfState(player))
    }
  }, SURVIVAL_TICK_MS)

  setInterval(() => {
    for (const player of players.values()) {
      savePlayerState(player).catch((err) => console.error('periodic save failed', err))
    }
  }, PERSIST_INTERVAL_MS)

  return io
}
