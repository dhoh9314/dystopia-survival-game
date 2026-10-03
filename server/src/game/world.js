// In-memory authoritative state for every connected player. Movement is
// discrete (location graph, see data/zones.js) so there's no spatial
// simulation to run — presence is just "which players currently have this
// locationId", derived on demand.

export const players = new Map() // characterId -> PlayerState

export function playersAtLocation(locationId, excludeCharacterId) {
  const list = []
  for (const player of players.values()) {
    if (player.locationId === locationId && player.characterId !== excludeCharacterId) {
      list.push(player)
    }
  }
  return list
}
