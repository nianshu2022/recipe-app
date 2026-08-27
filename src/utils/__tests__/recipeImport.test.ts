import { describe, it, expect } from 'vitest'
import { parseRecipeFromText, parseIngredientLine, parseStepLine, parseRecipesFromMarkdown } from '../recipeImport'

describe('recipeImport utils', () => {
  it('parses inline separated ingredients properly', () => {
    const list = parseIngredientLine('西红柿2个、鸡蛋3个、生抽1勺、盐少许')
    expect(list.length).toBe(4)
    expect(list[0].name).toBe('西红柿')
    expect(list[0].amount).toBe(2)
    expect(list[0].unit).toBe('个')
    expect(list[1].name).toBe('鸡蛋')
    expect(list[1].amount).toBe(3)
    expect(list[2].name).toBe('生抽')
    expect(list[2].amount).toBe(1)
    expect(list[2].unit).toBe('勺')
    expect(list[3].name).toBe('盐')
    expect(list[3].unit).toBe('少许')
  })

  it('parses step lines with timers and emoji prefixes', () => {
    const step1 = parseStepLine('1️⃣ 将五花肉切块，大火焯水5分钟捞出', 1)
    expect(step1).not.toBeNull()
    expect(step1?.description).toContain('将五花肉切块')
    expect(step1?.timer).toBe(5)

    const step2 = parseStepLine('Step 2: 倒入热油，小火慢炖半小时入味', 2)
    expect(step2?.timer).toBe(30)
  })

  it('parses full Xiaohongshu text into structured recipe', () => {
    const text = `
今日份神仙美味！【番茄土豆炖牛腩】🍅🐮
巨下饭巨好吃，全家人都赞不绝口～

🌿【食材准备】
牛腩 500g
土豆 2个
西红柿 2个
生姜 3片
生抽 2勺
老抽 1勺
盐 适量

👩‍🍳【制作步骤】
1. 牛腩切块冷水下锅焯水5分钟捞出沥干
2. 热锅凉油爆香生姜，下牛腩翻炒均匀
3. 倒入番茄丁炒出红汁，加入开水小火焖40分钟
4. 放入土豆块再煮15分钟，加盐调味即可出锅

#家常菜 #快手菜 #减脂餐 #周末下厨
    `

    const parsed = parseRecipeFromText(text)
    expect(parsed.name).toBe('番茄土豆炖牛腩')
    expect(parsed.category).toBe('hot-dish')
    expect(parsed.tags).toEqual(expect.arrayContaining(['家常菜', '快手菜', '减脂餐', '周末下厨']))
    expect(parsed.ingredients.length).toBeGreaterThanOrEqual(6)
    expect(parsed.steps.length).toBe(4)
    expect(parsed.steps[0].timer).toBe(5)
    expect(parsed.steps[2].timer).toBe(40)
  })

  it('parses Markdown cookbook content into multiple recipes', () => {
    const md = `
# 📖 知味 · 私人美食菜谱书

## 西红柿炒鸡蛋
- **分类**：热菜
- **难度**：简单
- **耗时**：10 分钟
- **分量**：2 人份
- **标签**：#家常菜 #快手菜

### 🥦 食材清单
- [ ] **西红柿** 2个
- [ ] **鸡蛋** 3个
- [ ] **盐** 2g

### 🍳 烹饪步骤
1. 鸡蛋打散翻炒成块盛出。
2. 锅中下油炒出西红柿浓汁，加入炒蛋与盐翻炒出锅。 ⏱️ *(3分钟)*

---

## 燕麦牛奶
- **分类**：主食
- **难度**：简单
- **耗时**：5 分钟

### 🥦 食材清单
- [ ] **燕麦** 50g
- [ ] **纯牛奶** 200ml

### 🍳 烹饪步骤
1. 将燕麦与牛奶放入锅中小火加热。
    `
    const recipes = parseRecipesFromMarkdown(md)
    expect(recipes.length).toBe(2)
    expect(recipes[0].name).toBe('西红柿炒鸡蛋')
    expect(recipes[0].category).toBe('hot-dish')
    expect(recipes[0].ingredients.length).toBe(3)
    expect(recipes[0].steps.length).toBe(2)
    expect(recipes[1].name).toBe('燕麦牛奶')
    expect(recipes[1].category).toBe('staple')
  })
})
