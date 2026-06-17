import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getSeason,
  getTimeScene,
  getSceneRecommendations,
  getSeasonalRecommendations,
  getQuickRecipes,
  scenes,
} from '../recommendations'
import type { Recipe } from '@/types'

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: '1',
    userId: 'local',
    name: '番茄炒蛋',
    category: 'hot-dish',
    tags: ['家常菜', '快手菜'],
    difficulty: 'easy',
    duration: 15,
    servings: 2,
    ingredients: [],
    steps: [],
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('getSeason', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return spring for March-May', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 15)) // April
    expect(getSeason()).toBe('spring')
  })

  it('should return summer for June-August', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15)) // July
    expect(getSeason()).toBe('summer')
  })

  it('should return autumn for September-November', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 15)) // October
    expect(getSeason()).toBe('autumn')
  })

  it('should return winter for December-February', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15)) // January
    expect(getSeason()).toBe('winter')
  })
})

describe('getTimeScene', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return breakfast for 5-10', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 8, 0))
    expect(getTimeScene()).toBe('breakfast')
  })

  it('should return lunch for 10-14', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0))
    expect(getTimeScene()).toBe('lunch')
  })

  it('should return snack for 14-17', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 15, 0))
    expect(getTimeScene()).toBe('snack')
  })

  it('should return dinner for other hours', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 19, 0))
    expect(getTimeScene()).toBe('dinner')
  })
})

describe('getSceneRecommendations', () => {
  it('should return recipes matching scene tags', () => {
    const recipes = [
      makeRecipe({ id: '1', tags: ['家常菜', '下饭菜'], duration: 30 }),
      makeRecipe({ id: '2', tags: ['甜品'], duration: 60 }),
    ]
    const result = getSceneRecommendations(recipes, 'lunch')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].id).toBe('1')
  })

  it('should respect limit parameter', () => {
    const recipes = Array.from({ length: 10 }, (_, i) =>
      makeRecipe({ id: String(i), tags: ['家常菜'] })
    )
    const result = getSceneRecommendations(recipes, 'lunch', 3)
    expect(result).toHaveLength(3)
  })

  it('should return empty for unknown scene', () => {
    const recipes = [makeRecipe()]
    // @ts-expect-error testing invalid scene
    const result = getSceneRecommendations(recipes, 'invalid')
    expect(result).toEqual([])
  })

  it('should return empty for empty recipes', () => {
    const result = getSceneRecommendations([], 'lunch')
    expect(result).toEqual([])
  })
})

describe('getSeasonalRecommendations', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return recipes matching seasonal tags', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15)) // winter

    const recipes = [
      makeRecipe({ id: '1', tags: ['火锅', '暖身'] }),
      makeRecipe({ id: '2', tags: ['凉菜'] }),
    ]
    const result = getSeasonalRecommendations(recipes)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].id).toBe('1')
  })

  it('should respect limit', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15)) // winter

    const recipes = Array.from({ length: 10 }, (_, i) =>
      makeRecipe({ id: String(i), tags: ['火锅'] })
    )
    const result = getSeasonalRecommendations(recipes, 2)
    expect(result).toHaveLength(2)
  })
})

describe('getQuickRecipes', () => {
  it('should return recipes under 30 minutes sorted by duration', () => {
    const recipes = [
      makeRecipe({ id: '1', duration: 45 }),
      makeRecipe({ id: '2', duration: 15 }),
      makeRecipe({ id: '3', duration: 25 }),
      makeRecipe({ id: '4', duration: 60 }),
    ]
    const result = getQuickRecipes(recipes)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('3')
  })

  it('should respect limit', () => {
    const recipes = Array.from({ length: 10 }, (_, i) =>
      makeRecipe({ id: String(i), duration: 10 })
    )
    const result = getQuickRecipes(recipes, 3)
    expect(result).toHaveLength(3)
  })

  it('should return empty if no quick recipes', () => {
    const recipes = [makeRecipe({ duration: 60 })]
    const result = getQuickRecipes(recipes)
    expect(result).toEqual([])
  })
})
