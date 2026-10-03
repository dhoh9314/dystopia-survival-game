const MAX_LEVEL = 50

// XP needed to go from `level` to `level + 1`.
export function xpToNextLevel(level) {
  return Math.round(40 * Math.pow(level, 1.5) + 20)
}

// Applies incoming XP, rolling through as many level-ups as it earns.
// Returns the updated { level, xp, levelsGained, statPointsGained }.
export function applyXp(character, gainedXp) {
  let level = character.level
  let xp = character.xp + gainedXp
  let levelsGained = 0

  while (level < MAX_LEVEL && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level)
    level += 1
    levelsGained += 1
  }

  return { level, xp, levelsGained, statPointsGained: levelsGained * 3 }
}

// Automatic growth applied on level-up (on top of player-allocated statPoints).
export function autoStatGrowth(levelsGained) {
  return {
    maxHp: levelsGained * 8,
    strength: Math.floor(levelsGained * 0.5),
    agility: Math.floor(levelsGained * 0.5),
    perception: Math.floor(levelsGained * 0.5),
    vitality: Math.floor(levelsGained * 0.5),
  }
}
