import { describe, it, expect } from 'vitest'
import { parseBatchFridgeItems, detectIngredientCategory } from '../fridgeParser'

describe('fridgeParser', () => {
  it('correctly categorizes ingredients', () => {
    expect(detectIngredientCategory('生菜').category).toBe('蔬菜')
    expect(detectIngredientCategory('牛腩').category).toBe('肉类')
    expect(detectIngredientCategory('鲜虾').category).toBe('海鲜')
    expect(detectIngredientCategory('纯牛奶').category).toBe('蛋奶')
    expect(detectIngredientCategory('生抽').category).toBe('调料')
  })

  it('parses comma-separated batch input string', () => {
    const text = '土豆2个、西红柿500g、纯牛奶1盒、鲜鸡蛋10个、生抽1瓶'
    const items = parseBatchFridgeItems(text)
    expect(items.length).toBe(5)

    expect(items[0].name).toBe('土豆')
    expect(items[0].amount).toBe(2)
    expect(items[0].unit).toBe('个')
    expect(items[0].category).toBe('蔬菜')

    expect(items[1].name).toBe('西红柿')
    expect(items[1].amount).toBe(500)
    expect(items[1].unit).toBe('g')

    expect(items[2].category).toBe('蛋奶')
    expect(items[4].category).toBe('调料')
  })

  it('parses multiline receipt text', () => {
    const text = `
买菜小票：
- 猪五花肉 500克
- 西兰花 1棵
- 嫩豆腐 1盒
- 挂面 1包
    `
    const items = parseBatchFridgeItems(text)
    expect(items.length).toBe(4)
    expect(items[0].name).toBe('猪五花肉')
    expect(items[0].unit).toBe('g')
    expect(items[0].category).toBe('肉类')
    expect(items[1].category).toBe('蔬菜')
    expect(items[2].category).toBe('豆制品')
    expect(items[3].category).toBe('主食')
  })
})
