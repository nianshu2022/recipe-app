import html2canvas from 'html2canvas-pro'
import type { ShoppingItem } from '@/types'

function groupItemsByCategory(items: ShoppingItem[]): Record<string, ShoppingItem[]> {
  const grouped: Record<string, ShoppingItem[]> = {}
  for (const item of items) {
    const cat = item.category || '其他'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }
  return grouped
}

const CATEGORY_EMOJIS: Record<string, string> = {
  '蔬菜': '🥦',
  '肉类': '🥩',
  '海鲜': '🐟',
  '蛋奶': '🥚',
  '调料': '🧂',
  '主食': '🍚',
  '豆制品': '🥢',
  '干货': '🥜',
  '水果': '🍎',
  '其他': '🛒',
}

export function formatWechatMessage(listName: string, items: ShoppingItem[]): string {
  const grouped = groupItemsByCategory(items)
  const uncheckedItems = items.filter((i) => !i.checked)
  const targetItems = uncheckedItems.length > 0 ? uncheckedItems : items

  const sections: string[] = []

  for (const [cat, catItems] of Object.entries(grouped)) {
    const active = catItems.filter((i) => (uncheckedItems.length > 0 ? !i.checked : true))
    if (active.length === 0) continue

    const emoji = CATEGORY_EMOJIS[cat] || '📦'
    const lines = active.map((i) => `  · ${i.name} ${i.amount ? `${i.amount}${i.unit || ''}` : ''}`.trim())
    sections.push(`${emoji}【${cat}】\n${lines.join('\n')}`)
  }

  return `🛒【${listName || '买菜清单'}】\n\n${sections.join('\n\n')}\n\n📝 共 ${targetItems.length} 样食材，辛苦帮忙采购哦～ ❤️\n—— 来自「知味」私人美食管家`
}

export function formatECommerceKeywords(items: ShoppingItem[]): string {
  const unchecked = items.filter((i) => !i.checked)
  const target = unchecked.length > 0 ? unchecked : items
  // 提取纯食材名称并去重
  const names = Array.from(new Set(target.map((i) => i.name.trim()))).filter(Boolean)
  return names.join(' ')
}

export function formatMarkdownChecklist(listName: string, items: ShoppingItem[]): string {
  const lines = items.map((i) => `- [${i.checked ? 'x' : ' '}] ${i.name} ${i.amount ? `${i.amount}${i.unit || ''}` : ''}`.trim())
  return `# 🛒 ${listName || '购物清单'}\n\n${lines.join('\n')}`
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str || ''
  return div.innerHTML
}

export async function exportShoppingReceiptImage(
  listName: string,
  items: ShoppingItem[]
): Promise<string> {
  const dateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const timeStr = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 360px; padding: 24px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: #F4F1EA; color: #2D2825; box-sizing: border-box;
  `

  const grouped = groupItemsByCategory(items)

  container.innerHTML = `
    <div style="background: #FFFFFF; border-radius: 20px; padding: 24px 20px; border: 1px dashed #D6D0C4; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
      <!-- Receipt Header -->
      <div style="text-align: center; border-bottom: 2px dashed #E5E0D5; padding-bottom: 16px; margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #E06D3B; text-transform: uppercase; margin-bottom: 4px;">
          ✦ ZHIWEI GROCERY RECEIPT ✦
        </div>
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 6px; color: #2D2825;">
          ${escapeHtml(listName || '采购清单')}
        </h1>
        <div style="font-size: 11px; color: #847971;">
          ${dateStr} ${timeStr} · 待采总数: <b>${items.length}</b> 件
        </div>
      </div>

      <!-- Item List Grouped -->
      <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px;">
        ${Object.entries(grouped)
          .map(
            ([cat, catItems]) => `
          <div>
            <div style="font-size: 11px; font-weight: 800; color: #E06D3B; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
              <span>${CATEGORY_EMOJIS[cat] || '📦'}</span>
              <span>${escapeHtml(cat)}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${catItems
                .map(
                  (i) => `
                <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px dotted #F0ECE4;">
                  <span style="color: ${i.checked ? '#B0A8A0' : '#2D2825'}; ${i.checked ? 'text-decoration: line-through;' : 'font-weight: 500;'}">
                    ${i.checked ? '☑' : '☐'} ${escapeHtml(i.name)}
                  </span>
                  <span style="font-size: 12px; font-weight: 700; color: ${i.checked ? '#B0A8A0' : '#E06D3B'};">
                    ${i.amount ? `${i.amount}${escapeHtml(i.unit || '')}` : '1份'}
                  </span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <!-- Total & Footer -->
      <div style="border-top: 2px dashed #E5E0D5; padding-top: 14px; text-align: center;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #2D2825; margin-bottom: 12px;">
          <span>已采购完成</span>
          <span style="color: #2ECC71;">${items.filter((i) => i.checked).length} / ${items.length}</span>
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #2D2825;">知味 · 私人美食管家</div>
        <div style="font-size: 10px; color: #847971; margin-top: 2px;">让买菜和下厨充满仪式感</div>
      </div>
    </div>
  `

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#F4F1EA',
      scale: 2.5,
      logging: false,
    })

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${(listName || '买菜清单').replace(/[\\/:*?"<>|]/g, '_')}-小票海报.png`
    link.href = dataUrl
    link.click()

    return dataUrl
  } finally {
    document.body.removeChild(container)
  }
}
