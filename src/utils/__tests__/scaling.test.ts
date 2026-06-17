import { describe, it, expect } from 'vitest'
import { scaleIngredient, scaleIngredients, formatAmount } from '../scaling'
import type { Ingredient } from '@/types'

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: '1',
    name: '盐',
    amount: 100,
    unit: 'g',
    type: 'seasoning',
    scalable: true,
    ...overrides,
  }
}

describe('scaleIngredient', () => {
  it('should scale amount proportionally', () => {
    const ing = makeIngredient({ amount: 100 })
    const result = scaleIngredient(ing, 2, 4)
    expect(result.amount).toBe(200)
  })

  it('should scale down', () => {
    const ing = makeIngredient({ amount: 200 })
    const result = scaleIngredient(ing, 4, 2)
    expect(result.amount).toBe(100)
  })

  it('should not scale non-scalable ingredients', () => {
    const ing = makeIngredient({ amount: 100, scalable: false })
    const result = scaleIngredient(ing, 2, 4)
    expect(result.amount).toBe(100)
  })

  it('should handle zero servings gracefully', () => {
    const ing = makeIngredient({ amount: 100 })
    const result = scaleIngredient(ing, 0, 4)
    expect(result.amount).toBe(100)
  })

  it('should round to 2 decimal places', () => {
    const ing = makeIngredient({ amount: 100 })
    const result = scaleIngredient(ing, 3, 2)
    expect(result.amount).toBe(66.67)
  })
})

describe('scaleIngredients', () => {
  it('should scale all ingredients', () => {
    const ingredients = [
      makeIngredient({ amount: 100 }),
      makeIngredient({ amount: 50, name: '糖' }),
    ]
    const result = scaleIngredients(ingredients, 2, 4)
    expect(result[0].amount).toBe(200)
    expect(result[1].amount).toBe(100)
  })

  it('should return empty array for empty input', () => {
    expect(scaleIngredients([], 2, 4)).toEqual([])
  })
})

describe('formatAmount', () => {
  it('should return empty string for 0', () => {
    expect(formatAmount(0, 'g')).toBe('')
  })

  it('should format integer amounts', () => {
    expect(formatAmount(100, 'g')).toBe('100g')
  })

  it('should format decimal amounts', () => {
    expect(formatAmount(1.5, 'ml')).toBe('1.5ml')
  })

  it('should return 0g for amounts that round to 0', () => {
    expect(formatAmount(0.001, 'g')).toBe('0g')
  })
})
