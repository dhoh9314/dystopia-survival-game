import { prisma } from '../db.js'

// In-memory mirror of the Shelter table, keyed two ways for fast lookup.
// Shelters are rare and long-lived (unlike combat/trade state), so loading
// everything at boot and keeping it in sync on writes is simplest.
export const sheltersByOwner = new Map() // ownerId -> shelter
export const sheltersByLocation = new Map() // locationId -> shelter

function toMemory(row) {
  return { ...row, registered: JSON.parse(row.registered) }
}

export async function loadShelters() {
  const rows = await prisma.shelter.findMany()
  for (const row of rows) {
    const shelter = toMemory(row)
    sheltersByOwner.set(row.ownerId, shelter)
    sheltersByLocation.set(row.locationId, shelter)
  }
}

export async function createShelter(ownerId, locationId, name) {
  const row = await prisma.shelter.create({ data: { ownerId, locationId, name, registered: '[]' } })
  const shelter = toMemory(row)
  sheltersByOwner.set(ownerId, shelter)
  sheltersByLocation.set(locationId, shelter)
  return shelter
}

export async function demolishShelter(ownerId) {
  const existing = sheltersByOwner.get(ownerId)
  if (!existing) return
  await prisma.shelter.delete({ where: { ownerId } })
  sheltersByOwner.delete(ownerId)
  sheltersByLocation.delete(existing.locationId)
}

export async function registerPlayerToShelter(ownerId, characterId) {
  const shelter = sheltersByOwner.get(ownerId)
  if (!shelter) return null
  if (!shelter.registered.includes(characterId)) {
    shelter.registered = [...shelter.registered, characterId]
    await prisma.shelter.update({ where: { ownerId }, data: { registered: JSON.stringify(shelter.registered) } })
  }
  return shelter
}

export async function unregisterPlayerFromShelter(ownerId, characterId) {
  const shelter = sheltersByOwner.get(ownerId)
  if (!shelter) return null
  shelter.registered = shelter.registered.filter((id) => id !== characterId)
  await prisma.shelter.update({ where: { ownerId }, data: { registered: JSON.stringify(shelter.registered) } })
  return shelter
}

// Resolves where a player should respawn: their own shelter, else a shelter
// they've been registered to, else null (caller falls back to default spawn).
export function getShelterForPlayer(characterId) {
  const own = sheltersByOwner.get(characterId)
  if (own) return own
  for (const shelter of sheltersByOwner.values()) {
    if (shelter.registered.includes(characterId)) return shelter
  }
  return null
}

export function getShelterAtLocation(locationId) {
  return sheltersByLocation.get(locationId) ?? null
}

export function hasShelterAccess(shelter, characterId) {
  if (!shelter) return false
  return shelter.ownerId === characterId || shelter.registered.includes(characterId)
}
