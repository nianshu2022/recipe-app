import { db } from '@/db'

interface BackupData {
  version: 1
  exportedAt: string
  recipes: unknown[]
  collections: unknown[]
  menus: unknown[]
  mealPlans: unknown[]
  shoppingLists: unknown[]
  fridgeItems: unknown[]
  cookingRecords: unknown[]
}

export async function exportData(): Promise<string> {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes: await db.getAllRecipes(),
    collections: await db.getAllCollections(),
    menus: await db.getAllMenus(),
    mealPlans: await db.getAllMealPlans(),
    shoppingLists: await db.getAllShoppingLists(),
    fridgeItems: await db.getAllFridgeItems(),
    cookingRecords: await db.getAllCookingRecords(),
  }
  return JSON.stringify(data, null, 2)
}

export function downloadBackup(json: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `知味备份_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function isValidRecord(record: unknown): record is Record<string, unknown> {
  return typeof record === 'object' && record !== null && !Array.isArray(record)
}

function validateId(record: Record<string, unknown>): boolean {
  return typeof record.id === 'string' && record.id.length > 0
}

export async function importData(json: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(json) as BackupData

    if (data.version !== 1 || !Array.isArray(data.recipes)) {
      return { success: false, message: '无效的备份文件' }
    }

    let count = 0
    for (const recipe of data.recipes) {
      if (!isValidRecord(recipe) || !validateId(recipe)) continue
      await db.putRecipe(recipe as never)
      count++
    }
    for (const collection of data.collections ?? []) {
      if (!isValidRecord(collection) || !validateId(collection)) continue
      await db.putCollection(collection as never)
    }
    for (const menu of data.menus ?? []) {
      if (!isValidRecord(menu) || !validateId(menu)) continue
      await db.putMenu(menu as never)
    }
    for (const plan of data.mealPlans ?? []) {
      if (!isValidRecord(plan) || !validateId(plan)) continue
      await db.putMealPlan(plan as never)
    }
    for (const list of data.shoppingLists ?? []) {
      if (!isValidRecord(list) || !validateId(list)) continue
      await db.putShoppingList(list as never)
    }
    for (const item of data.fridgeItems ?? []) {
      if (!isValidRecord(item) || !validateId(item)) continue
      await db.putFridgeItem(item as never)
    }
    for (const record of data.cookingRecords ?? []) {
      if (!isValidRecord(record) || !validateId(record)) continue
      await db.putCookingRecord(record as never)
    }

    return { success: true, message: `成功导入 ${count} 道菜谱` }
  } catch (e) {
    return { success: false, message: `导入失败: ${e instanceof Error ? e.message : '未知错误'}` }
  }
}
