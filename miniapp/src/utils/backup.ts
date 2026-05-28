import Taro from '@tarojs/taro'
import { db } from './storage'

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
  const fs = Taro.getFileSystemManager()
  const filePath = `${Taro.env.USER_DATA_PATH}/菜谱助手备份_${new Date().toISOString().slice(0, 10)}.json`
  fs.writeFileSync(filePath, json, 'utf8')
  Taro.shareFileMessage({
    filePath,
    success() {
      Taro.showToast({ title: '备份文件已保存', icon: 'success' })
    },
    fail() {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    },
  })
}

export async function importData(json: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(json) as BackupData

    if (data.version !== 1 || !data.recipes) {
      return { success: false, message: '无效的备份文件' }
    }

    let count = 0
    for (const recipe of data.recipes) {
      await db.putRecipe(recipe as never)
      count++
    }
    for (const collection of data.collections) {
      await db.putCollection(collection as never)
    }
    for (const menu of data.menus) {
      await db.putMenu(menu as never)
    }
    for (const plan of data.mealPlans) {
      await db.putMealPlan(plan as never)
    }
    for (const list of data.shoppingLists) {
      await db.putShoppingList(list as never)
    }
    for (const item of data.fridgeItems) {
      await db.putFridgeItem(item as never)
    }
    for (const record of data.cookingRecords) {
      await db.putCookingRecord(record as never)
    }

    return { success: true, message: `成功导入 ${count} 道菜谱` }
  } catch (e) {
    return { success: false, message: `导入失败: ${e instanceof Error ? e.message : '未知错误'}` }
  }
}

export async function pickAndImportData(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await Taro.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['.json'],
    })
    const fs = Taro.getFileSystemManager()
    const content = fs.readFileSync(res.tempFiles[0].path, 'utf8') as string
    return importData(content)
  } catch {
    return { success: false, message: '选择文件失败' }
  }
}
