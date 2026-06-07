import type { Ingredient } from '@/types'

export function scaleIngredient(
  ingredient: Ingredient,
  originalServings: number,
  targetServings: number,
): Ingredient {
  if (!ingredient.scalable) {
    return ingredient
  }

  if (originalServings <= 0 || targetServings <= 0) return ingredient
  const ratio = targetServings / originalServings
  const newAmount = Math.round(ingredient.amount * ratio * 100) / 100

  return {
    ...ingredient,
    amount: newAmount,
  }
}

export function scaleIngredients(
  ingredients: Ingredient[],
  originalServings: number,
  targetServings: number,
): Ingredient[] {
  return ingredients.map((ing) => scaleIngredient(ing, originalServings, targetServings))
}

export function formatAmount(amount: number, unit: string): string {
  if (amount === 0) return ''
  const rounded = Math.round(amount * 100) / 100
  if (rounded === Math.floor(rounded)) return `${rounded}${unit}`
  if (rounded < 0.01) return `少许`
  return `${rounded}${unit}`
}
