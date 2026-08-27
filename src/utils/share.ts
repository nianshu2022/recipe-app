import html2canvas from 'html2canvas-pro'
import type { Recipe } from '@/types'
import { formatAmount } from './scaling'
import { estimateNutrition, getCalorieLevel } from './nutrition'

export type PosterTheme = 'warm' | 'dark' | 'sunset'
export type PosterMode = 'full' | 'checkin'

const difficultyLabels = { easy: '简单易做', medium: '中等难度', hard: '高阶大厨' }
const categoryLabels: Record<string, string> = {
  'hot-dish': '热菜',
  'cold-dish': '凉菜',
  'soup': '汤羹',
  'staple': '主食',
  'dessert': '甜品',
  'drink': '饮品',
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str || ''
  return div.innerHTML
}

export async function shareRecipe(recipe: Recipe): Promise<boolean> {
  const nutrition = estimateNutrition(recipe.ingredients)
  const calorieLevel = getCalorieLevel(nutrition.calories)
  const shareText = `【${recipe.name}】\n难度：${difficultyLabels[recipe.difficulty]} · ${recipe.duration}分钟 · ${recipe.servings}人份\n估算热量：${nutrition.calories} kcal (${calorieLevel.label})\n\n来自「知味」私人美食管家`

  if (navigator.share) {
    try {
      await navigator.share({
        title: recipe.name,
        text: shareText,
        url: window.location.origin + `/recipe/${recipe.id}`,
      })
      return true
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Share failed:', e)
      }
      return false
    }
  }
  return false
}

export async function copyRecipeLink(recipe: Recipe): Promise<boolean> {
  const url = window.location.origin + `/recipe/${recipe.id}`
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

export function generateShareCopyText(recipe: Recipe): string {
  const ingList = recipe.ingredients
    .map((i) => `· ${i.name} ${formatAmount(i.amount, i.unit)}`)
    .join('\n')
  const stepList = recipe.steps
    .map((s, idx) => `${idx + 1}. ${s.description}`)
    .join('\n')

  return `🍳【${recipe.name}】\n\n🕒 烹饪时间：${recipe.duration}分钟 | 难度：${difficultyLabels[recipe.difficulty]}\n\n🌿 食材准备：\n${ingList}\n\n👩‍🍳 烹饪步骤：\n${stepList}\n\n—— 来自「知味」APP · 私人美食管家`
}

interface ExportOptions {
  theme?: PosterTheme
  mode?: PosterMode
}

export async function exportRecipeAsImage(
  recipe: Recipe,
  options: ExportOptions = {}
): Promise<string> {
  const theme = options.theme || 'warm'
  const mode = options.mode || 'full'

  const nutrition = estimateNutrition(recipe.ingredients)

  // 主题配色变量
  const themeStyles = {
    warm: {
      bg: '#FBF9F5',
      cardBg: '#FFFFFF',
      textMain: '#2D2825',
      textMuted: '#847971',
      accent: '#E06D3B',
      accentBg: '#FFF1EB',
      badgeBg: '#F2ECE4',
      border: '#EFE9E0',
      stampBorder: '#D86B3E',
      stampText: '#D86B3E',
    },
    dark: {
      bg: '#181615',
      cardBg: '#23201D',
      textMain: '#F7F5F2',
      textMuted: '#A09990',
      accent: '#F39C12',
      accentBg: '#332617',
      badgeBg: '#2E2A26',
      border: '#3D3731',
      stampBorder: '#E67E22',
      stampText: '#F39C12',
    },
    sunset: {
      bg: '#FFF8F3',
      cardBg: '#FFFFFF',
      textMain: '#33221C',
      textMuted: '#8C746C',
      accent: '#F25C54',
      accentBg: '#FFEAE8',
      badgeBg: '#FFEBE0',
      border: '#F9E2D8',
      stampBorder: '#F25C54',
      stampText: '#F25C54',
    },
  }[theme]

  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 420px; padding: 28px 24px;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: ${themeStyles.bg}; color: ${themeStyles.textMain};
    box-sizing: border-box;
  `

  const dateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  if (mode === 'checkin') {
    // 紧凑打卡卡片
    container.innerHTML = `
      <div style="background: ${themeStyles.cardBg}; border-radius: 24px; padding: 24px; border: 1px solid ${themeStyles.border}; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: ${themeStyles.accent}; text-transform: uppercase;">TODAY'S KITCHEN</span>
            <h1 style="font-size: 24px; font-weight: 800; margin: 4px 0 0; color: ${themeStyles.textMain}; line-height: 1.3;">
              ${escapeHtml(recipe.name)}
            </h1>
          </div>
          <div style="border: 2px dashed ${themeStyles.stampBorder}; border-radius: 12px; padding: 4px 8px; text-align: center; transform: rotate(-4deg);">
            <span style="font-size: 10px; font-weight: 800; color: ${themeStyles.stampText}; display: block;">打卡认证</span>
            <span style="font-size: 9px; color: ${themeStyles.textMuted};">${dateStr}</span>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
          <span style="background: ${themeStyles.accentBg}; color: ${themeStyles.accent}; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px;">
            ${categoryLabels[recipe.category] || '美食'}
          </span>
          <span style="background: ${themeStyles.badgeBg}; color: ${themeStyles.textMuted}; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 8px;">
            ⏱️ ${recipe.duration} 分钟
          </span>
          <span style="background: ${themeStyles.badgeBg}; color: ${themeStyles.textMuted}; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 8px;">
            🔥 ${nutrition.calories} kcal
          </span>
        </div>

        <div style="background: ${themeStyles.bg}; border-radius: 16px; padding: 14px; margin-bottom: 20px; border: 1px solid ${themeStyles.border};">
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 8px; color: ${themeStyles.textMain};">核心食材准备</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${recipe.ingredients
              .slice(0, 8)
              .map(
                (ing) => `
              <span style="font-size: 11px; background: ${themeStyles.cardBg}; border: 1px solid ${themeStyles.border}; padding: 3px 8px; border-radius: 6px; color: ${themeStyles.textMain};">
                ${escapeHtml(ing.name)} <b style="color:${themeStyles.accent}">${escapeHtml(formatAmount(ing.amount, ing.unit))}</b>
              </span>
            `
              )
              .join('')}
            ${recipe.ingredients.length > 8 ? `<span style="font-size: 11px; color:${themeStyles.textMuted}; padding: 3px 4px;">等${recipe.ingredients.length}样</span>` : ''}
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed ${themeStyles.border}; padding-top: 14px;">
          <div>
            <div style="font-size: 13px; font-weight: 800; color: ${themeStyles.textMain};">知味 · 私人美食管家</div>
            <div style="font-size: 10px; color: ${themeStyles.textMuted};">记录每一餐生活的仪式感</div>
          </div>
          <div style="background: ${themeStyles.accentBg}; color: ${themeStyles.accent}; border-radius: 8px; padding: 4px 8px; font-size: 10px; font-weight: 700;">
            ZHIWEI APP
          </div>
        </div>
      </div>
    `
  } else {
    // 全量精美海报长图
    container.innerHTML = `
      <div style="background: ${themeStyles.cardBg}; border-radius: 28px; padding: 26px 22px; border: 1px solid ${themeStyles.border}; box-shadow: 0 12px 30px rgba(0,0,0,0.03);">
        <!-- Header -->
        <div style="margin-bottom: 22px; text-align: center; border-bottom: 1px solid ${themeStyles.border}; padding-bottom: 18px;">
          <div style="display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 2px; color: ${themeStyles.accent}; text-transform: uppercase; margin-bottom: 6px;">
            ✦ 知味精选食谱 ✦
          </div>
          <h1 style="font-size: 26px; font-weight: 900; margin: 0 0 12px; color: ${themeStyles.textMain}; letter-spacing: -0.5px; line-height: 1.25;">
            ${escapeHtml(recipe.name)}
          </h1>
          <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
            <span style="background: ${themeStyles.accentBg}; color: ${themeStyles.accent}; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px;">
              ${difficultyLabels[recipe.difficulty]}
            </span>
            <span style="background: ${themeStyles.badgeBg}; color: ${themeStyles.textMuted}; font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 999px;">
              ⏱️ ${recipe.duration}分钟
            </span>
            <span style="background: ${themeStyles.badgeBg}; color: ${themeStyles.textMuted}; font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 999px;">
              👥 ${recipe.servings}人份
            </span>
            <span style="background: ${themeStyles.badgeBg}; color: ${themeStyles.textMuted}; font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 999px;">
              🔥 ${nutrition.calories}kcal
            </span>
          </div>
        </div>

        <!-- Ingredients Section -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h2 style="font-size: 15px; font-weight: 800; margin: 0; color: ${themeStyles.textMain}; display: flex; align-items: center; gap: 6px;">
              <span style="display:inline-block; width:4px; height:14px; background:${themeStyles.accent}; border-radius:2px;"></span>
              用料准备 (${recipe.ingredients.length})
            </h2>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            ${recipe.ingredients
              .map(
                (ing) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: ${themeStyles.bg}; border-radius: 10px; border: 1px solid ${themeStyles.border};">
                <span style="font-size: 12px; font-weight: 500; color: ${themeStyles.textMain}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(ing.name)}</span>
                <span style="font-size: 12px; font-weight: 700; color: ${themeStyles.accent};">${escapeHtml(formatAmount(ing.amount, ing.unit))}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Steps Section -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 15px; font-weight: 800; margin: 0 0 12px; color: ${themeStyles.textMain}; display: flex; align-items: center; gap: 6px;">
            <span style="display:inline-block; width:4px; height:14px; background:${themeStyles.accent}; border-radius:2px;"></span>
            烹饪步骤 (${recipe.steps.length})
          </h2>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${recipe.steps
              .map(
                (step) => `
              <div style="display: flex; gap: 12px; background: ${themeStyles.bg}; border-radius: 14px; padding: 12px 14px; border: 1px solid ${themeStyles.border};">
                <div style="flex-shrink: 0; width: 22px; height: 22px; border-radius: 999px; background: ${themeStyles.accent}; color: white; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center;">
                  ${step.order}
                </div>
                <div style="flex: 1;">
                  <p style="font-size: 13px; line-height: 1.55; color: ${themeStyles.textMain}; margin: 0; font-weight: 400;">
                    ${escapeHtml(step.description)}
                  </p>
                  ${
                    step.timer
                      ? `<span style="display: inline-block; margin-top: 4px; font-size: 10px; font-weight: 600; color: ${themeStyles.accent};">⏱️ 建议计时：${step.timer}分钟</span>`
                      : ''
                  }
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px dashed ${themeStyles.border};">
          <div>
            <div style="font-size: 13px; font-weight: 800; color: ${themeStyles.textMain};">知味 · Zhiwei</div>
            <div style="font-size: 10px; color: ${themeStyles.textMuted};">私人美食管家 · 知味者方知生活</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 9px; color: ${themeStyles.textMuted};">GEN BY RECIPE APP</div>
            <div style="font-size: 10px; font-weight: 700; color: ${themeStyles.accent};">${dateStr}</div>
          </div>
        </div>
      </div>
    `
  }

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: themeStyles.bg,
      scale: 2.5,
      useCORS: true,
      logging: false,
    })

    const dataUrl = canvas.toDataURL('image/png')

    const link = document.createElement('a')
    const safeName = recipe.name.replace(/[\\/:*?"<>|]/g, '_')
    link.download = `${safeName}-${mode === 'checkin' ? '打卡卡片' : '精美食谱海报'}.png`
    link.href = dataUrl
    link.click()

    return dataUrl
  } finally {
    document.body.removeChild(container)
  }
}

