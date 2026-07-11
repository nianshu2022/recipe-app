# P3 Features Design

## [S1] Problem

The app has completed P0/P1/P2 features but lacks:
- **Content for new users** - Empty home screen on first use
- **Intelligent shopping** - Users must manually compare fridge vs meal plan
- **Recipe import** - Manual entry is time-consuming
- **AI assistance** - Users want help generating recipes from available ingredients

## [S2] Solution Overview

Four features implemented in priority order:

1. **Sample Recipe Library** (Low complexity)
2. **Smart Shopping List** (Medium complexity)
3. **Recipe Import** (High complexity)
4. **AI Recipe Generation** (High complexity)

## [S3] Sample Recipe Library

### Purpose
Seed the app with 20-30 curated Chinese home cooking recipes so new users have content to explore immediately.

### Data Structure
```typescript
// src/data/sampleRecipes.ts
export const sampleRecipes: Recipe[] = [
  {
    id: 'sample-001',
    userId: 'system',
    name: '番茄炒蛋',
    category: 'hot-dish',
    tags: ['家常菜', '快手菜', '下饭菜'],
    difficulty: 'easy',
    duration: 15,
    servings: 2,
    ingredients: [
      { id: '1', name: '番茄', amount: 2, unit: '个', type: 'main', scalable: true },
      { id: '2', name: '鸡蛋', amount: 3, unit: '个', type: 'main', scalable: true },
      { id: '3', name: '盐', amount: 1, unit: '茶匙', type: 'seasoning', scalable: false },
      { id: '4', name: '糖', amount: 0.5, unit: '茶匙', type: 'seasoning', scalable: false },
    ],
    steps: [
      { order: 1, description: '番茄切块，鸡蛋打散加少许盐' },
      { order: 2, description: '热锅凉油，倒入蛋液炒至凝固盛出' },
      { order: 3, description: '锅中加油，放入番茄翻炒出汁' },
      { order: 4, description: '加入炒好的鸡蛋，加盐和糖调味' },
    ],
    nutrition: { calories: 180, protein: 12, carbs: 8, fat: 11, fiber: 2 },
  },
  // ... more recipes
]
```

### Categories to Cover
- 热菜 (hot-dish): 8-10 recipes
- 凉菜 (cold-dish): 4-5 recipes
- 汤类 (soup): 4-5 recipes
- 主食 (staple): 3-4 recipes
- 甜品 (dessert): 2-3 recipes

### Implementation
- Create `src/data/sampleRecipes.ts` with all recipes
- Modify `recipeStore.ts` to load sample recipes on first run
- Use localStorage flag `recipes-seeded` to track if samples have been loaded

### Files to Modify
- `src/data/sampleRecipes.ts` (new)
- `src/stores/recipeStore.ts` (add seeding logic)

## [S4] Smart Shopping List

### Purpose
Compare fridge inventory against meal plan requirements to show only what needs to be purchased.

### Algorithm
```typescript
function calculateShoppingNeeds(
  mealPlanRecipes: Recipe[],
  fridgeItems: FridgeItem[],
  servings: number
): ShoppingItem[] {
  // 1. Aggregate all ingredients from meal plan recipes
  const required = aggregateIngredients(mealPlanRecipes, servings)
  
  // 2. Match against fridge items by name
  const available = new Map(fridgeItems.map(i => [i.name, i]))
  
  // 3. Calculate difference
  return required.map(req => {
    const avail = available.get(req.name)
    if (!avail) return req
    const needed = req.amount - avail.amount
    return needed > 0 ? { ...req, amount: needed } : null
  }).filter(Boolean)
}
```

### UI Changes
- Add "智能购物清单" button on MealPlanPage (next to existing "生成购物清单")
- Show modal with three sections:
  - 需要购买 (red)
  - 冰箱已有 (green)
  - 即将过期 (yellow)

### Files to Modify
- `src/utils/smartShopping.ts` (new)
- `src/pages/meal-plan/MealPlanPage.tsx` (add button)
- `src/pages/shopping/ShoppingListPage.tsx` (show source indicator)

## [S5] Recipe Import

### Purpose
Allow users to import recipes from URLs (小红书, 下厨房, etc.) or screenshots.

### URL Import
- Parse HTML to extract recipe name, ingredients, steps
- Use regex patterns for common Chinese recipe sites
- Fallback to manual entry if parsing fails

### Screenshot OCR
- Use Tesseract.js for client-side OCR
- Parse extracted text to identify ingredients and steps
- Present parsed result for user confirmation

### Implementation
- Create `src/utils/recipeImport.ts` with parsers
- Create `src/pages/recipe/ImportRecipePage.tsx`
- Add route `/recipe/import`

### Files to Modify
- `src/utils/recipeImport.ts` (new)
- `src/pages/recipe/ImportRecipePage.tsx` (new)
- `src/App.tsx` (add route)

## [S6] AI Recipe Generation

### Purpose
Generate complete recipes based on available fridge ingredients.

### API Integration
- Use Cloudflare Workers AI (already on Cloudflare stack)
- Model: `@cf/meta/llama-3.1-8b-instruct` for recipe generation
- Prompt template for Chinese home cooking

### Prompt Template
```
你是一位中餐大厨。根据以下食材生成一道家常菜：

食材：{ingredients}
人数：{servings}

请返回 JSON 格式：
{
  "name": "菜名",
  "category": "hot-dish|cold-dish|soup|staple|dessert|drink",
  "difficulty": "easy|medium|hard",
  "duration": 分钟数,
  "ingredients": [{ "name": "食材名", "amount": 数量, "unit": "单位" }],
  "steps": [{ "order": 序号, "description": "步骤描述" }]
}
```

### UI Flow
1. User clicks "AI 生成" on FridgePage
2. Modal shows selected ingredients
3. Click "生成" → loading state
4. Show generated recipe preview
5. User confirms → save to recipe library

### Files to Modify
- `src/utils/aiRecipe.ts` (new)
- `src/pages/fridge/FridgePage.tsx` (add AI button)
- `src/pages/recipe/AiRecipePreview.tsx` (new)

## [S7] Implementation Order

| Phase | Feature | Effort | Dependencies |
|-------|---------|--------|--------------|
| 1 | 示例食谱库 | 1 day | None |
| 2 | 智能购物清单 | 2 days | Phase 1 |
| 3 | 食谱导入 | 3 days | None |
| 4 | AI 智能生成 | 3 days | Phase 3 (for recipe format) |

## [S8] Testing Strategy

- **示例食谱库**: Verify recipes load on first run, don't duplicate on subsequent loads
- **智能购物清单**: Test fridge-recipe matching, edge cases (missing amounts, unknown ingredients)
- **食谱导入**: Test with real URLs, handle parsing failures gracefully
- **AI 生成**: Test API integration, handle rate limits and errors
