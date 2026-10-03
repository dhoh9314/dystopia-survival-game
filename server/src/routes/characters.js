import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../db.js'
import { requireAuth } from '../auth.js'
import { getSuperpower, SUPERPOWER_LIST } from '../data/superpowers.js'
import { DEFAULT_LOCATION_ID } from '../data/zones.js'
import { RECIPE_LIST } from '../data/recipes.js'
import { ITEMS } from '../data/items.js'
import { MOB_TYPE_LIST } from '../data/mobs.js'
import { TOTAL_LORE_ENTRIES } from '../data/events.js'

export const charactersRouter = Router()
const MAX_CHARACTERS = 3
const JWT_SECRET = process.env.JWT_SECRET

function serializeCharacter(c) {
  return {
    id: c.id,
    name: c.name,
    superpower: c.superpower,
    level: c.level,
    xp: c.xp,
    statPoints: c.statPoints,
    maxHp: c.maxHp,
    hp: c.hp,
    strength: c.strength,
    agility: c.agility,
    perception: c.perception,
    vitality: c.vitality,
    hunger: c.hunger,
    thirst: c.thirst,
    fatigue: c.fatigue,
    locationId: c.locationId,
    isDead: c.isDead,
  }
}

charactersRouter.get('/superpowers', (req, res) => {
  res.json({ superpowers: SUPERPOWER_LIST })
})

charactersRouter.get('/recipes', (req, res) => {
  res.json({ recipes: RECIPE_LIST })
})

charactersRouter.get('/items', (req, res) => {
  res.json({ items: Object.values(ITEMS) })
})

charactersRouter.get('/codex-info', (req, res) => {
  res.json({
    totalLoreEntries: TOTAL_LORE_ENTRIES,
    mobs: MOB_TYPE_LIST.map((m) => ({ id: m.id, name: m.name, codexEntry: m.codexEntry, maxHp: m.maxHp, damage: m.damage, xpReward: m.xpReward })),
  })
})

charactersRouter.get('/', requireAuth, async (req, res) => {
  const characters = await prisma.character.findMany({
    where: { accountId: req.accountId },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ characters: characters.map(serializeCharacter) })
})

charactersRouter.post('/', requireAuth, async (req, res) => {
  const { name, superpower } = req.body ?? {}

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 16) {
    return res.status(400).json({ error: '이름은 1~16자여야 합니다.' })
  }
  const power = getSuperpower(superpower)
  if (!power) {
    return res.status(400).json({ error: '유효하지 않은 초능력입니다.' })
  }

  const count = await prisma.character.count({ where: { accountId: req.accountId } })
  if (count >= MAX_CHARACTERS) {
    return res.status(400).json({ error: `캐릭터는 최대 ${MAX_CHARACTERS}개까지 만들 수 있습니다.` })
  }

  const character = await prisma.character.create({
    data: {
      accountId: req.accountId,
      name: name.trim(),
      superpower: power.id,
      locationId: DEFAULT_LOCATION_ID,
    },
  })

  res.status(201).json({ character: serializeCharacter(character) })
})

charactersRouter.delete('/:id', requireAuth, async (req, res) => {
  const character = await prisma.character.findUnique({ where: { id: req.params.id } })
  if (!character || character.accountId !== req.accountId) {
    return res.status(404).json({ error: 'not found' })
  }
  await prisma.character.delete({ where: { id: character.id } })
  res.json({ ok: true })
})

// Selecting a character mints a short-lived token the client uses to open
// the realtime game socket. Keeps the game socket decoupled from the
// cross-origin cookie session.
charactersRouter.post('/:id/select', requireAuth, async (req, res) => {
  const character = await prisma.character.findUnique({ where: { id: req.params.id } })
  if (!character || character.accountId !== req.accountId) {
    return res.status(404).json({ error: 'not found' })
  }

  const socketToken = jwt.sign(
    { accountId: req.accountId, characterId: character.id },
    JWT_SECRET,
    { expiresIn: '2h' }
  )

  res.json({ socketToken, character: serializeCharacter(character) })
})
