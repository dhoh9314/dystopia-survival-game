import { getRecipe } from '../data/recipes.js'
import { itemCount, addToInventory, removeFromInventory } from './inventory.js'

export function craftItem(player, recipeId) {
  if (player.isDead) return { error: '사망 상태입니다.' }
  if (player.encounter) return { error: '전투 중에는 조합할 수 없습니다.' }

  const recipe = getRecipe(recipeId)
  if (!recipe) return { error: '존재하지 않는 조합법입니다.' }

  for (const input of recipe.inputs) {
    if (itemCount(player, input.itemId) < input.qty) {
      return { error: '재료가 부족합니다.' }
    }
  }

  for (const input of recipe.inputs) {
    removeFromInventory(player, input.itemId, input.qty)
  }
  addToInventory(player, recipe.outputItemId, recipe.outputQty)

  return { ok: true, recipeId, outputItemId: recipe.outputItemId, outputQty: recipe.outputQty }
}
