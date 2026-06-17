import { describe, it, expect } from 'vitest'
import { estimateNutrition, getCalorieLevel, getMacroPercentages } from '../nutrition'
import type { Ingredient } from '@/types'

function makeIngredient(name: string, amount: number, unit: string): Ingredient {
  return {
    id: '1',
    name,
    amount,
    unit,
    type: 'main',
    scalable: true,
  }
}

describe('estimateNutrition', () => {
  it('should calculate nutrition for known ingredients', () => {
    const ingredients = [makeIngredient('鸡蛋', 2, '个')]
    const result = estimateNutrition(ingredients)
    expect(result.calories).toBeGreaterThan(0)
    expect(result.protein).toBeGreaterThan(0)
  })

  it('should return zeros for unknown ingredients', () => {
    const ingredients = [makeIngredient('未知食材', 100, 'g')]
    const result = estimateNutrition(ingredients)
    expect(result.calories).toBe(0)
    expect(result.protein).toBe(0)
    expect(result.carbs).toBe(0)
    expect(result.fat).toBe(0)
  })

  it('should handle empty ingredients', () => {
    const result = estimateNutrition([])
    expect(result.calories).toBe(0)
  })

  it('should sum multiple ingredients', () => {
    const ingredients = [
      makeIngredient('鸡蛋', 2, '个'),
      makeIngredient('番茄', 200, 'g'),
    ]
    const result = estimateNutrition(ingredients)
    expect(result.calories).toBeGreaterThan(0)
    expect(result.protein).toBeGreaterThan(0)
  })

  it('should handle zero amount ingredients', () => {
    const ingredients = [makeIngredient('鸡蛋', 0, '个')]
    const result = estimateNutrition(ingredients)
    expect(result.calories).toBe(0)
  })
})

describe('getCalorieLevel', () => {
  it('should return 低卡 for < 300 cal', () => {
    expect(getCalorieLevel(200).label).toBe('低卡')
  })

  it('should return 适中 for 300-600 cal', () => {
    expect(getCalorieLevel(450).label).toBe('适中')
  })

  it('should return 高卡 for > 600 cal', () => {
    expect(getCalorieLevel(800).label).toBe('高卡')
  })

  it('should return 低卡 for 0 cal', () => {
    expect(getCalorieLevel(0).label).toBe('低卡')
  })
})

describe('getMacroPercentages', () => {
  it('should return percentages that sum to 100', () => {
    const nutrition = { calories: 500, protein: 30, carbs: 50, fat: 20, fiber: 5 }
    const result = getMacroPercentages(nutrition)
    expect(result.protein + result.carbs + result.fat).toBe(100)
  })

  it('should return zeros for zero nutrition', () => {
    const nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    const result = getMacroPercentages(nutrition)
    expect(result.protein).toBe(0)
    expect(result.carbs).toBe(0)
    expect(result.fat).toBe(0)
  })

  it('should calculate correct proportions', () => {
    // protein=10g (40cal), carbs=10g (40cal), fat=10g (90cal) => total=170cal
    const nutrition = { calories: 170, protein: 10, carbs: 10, fat: 10, fiber: 0 }
    const result = getMacroPercentages(nutrition)
    expect(result.protein).toBe(24) // 40/170 ≈ 24%
    expect(result.carbs).toBe(24)   // 40/170 ≈ 24%
    expect(result.fat).toBe(52)     // 100-24-24 = 52%
  })
})
