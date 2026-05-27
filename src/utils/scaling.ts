import type { Ingredient } from '@/types'

export function scaleIngredient(
  ingredient: Ingredient,
  originalServings: number,
  targetServings: number,
): Ingredient {
  if (!ingredient.scalable) {
    return ingredient
  }

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
  if (amount === Math.floor(amount)) return `${amount}${unit}`
  if (amount < 0.01) return `少许`
  return `${amount}${unit}`
}
