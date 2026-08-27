import { describe, it, expect } from 'vitest'
import {
  formatWechatMessage,
  formatECommerceKeywords,
  formatMarkdownChecklist,
} from '../shoppingExport'
import type { ShoppingItem } from '@/types'

const mockItems: ShoppingItem[] = [
  {
    id: 's1',
    name: '西红柿',
    amount: 500,
    unit: 'g',
    category: '蔬菜',
    checked: false,
  },
  {
    id: 's2',
    name: '牛腩',
    amount: 400,
    unit: 'g',
    category: '肉类',
    checked: false,
  },
  {
    id: 's3',
    name: '生抽',
    amount: 1,
    unit: '瓶',
    category: '调料',
    checked: true,
  },
]

describe('shoppingExport utils', () => {
  it('formats wechat message grouped by category', () => {
    const text = formatWechatMessage('周末采购', mockItems)
    expect(text).toContain('周末采购')
    expect(text).toContain('【蔬菜】')
    expect(text).toContain('西红柿 500g')
    expect(text).toContain('【肉类】')
    expect(text).toContain('牛腩 400g')
  })

  it('formats ecommerce keywords for batch search', () => {
    const keywords = formatECommerceKeywords(mockItems)
    expect(keywords).toContain('西红柿')
    expect(keywords).toContain('牛腩')
  })

  it('formats markdown checklist', () => {
    const md = formatMarkdownChecklist('待买清单', mockItems)
    expect(md).toContain('- [ ] 西红柿 500g')
    expect(md).toContain('- [ ] 牛腩 400g')
    expect(md).toContain('- [x] 生抽 1瓶')
  })
})
