import { useState } from 'react'
import { X, Sparkles, Plus, Trash2, Check, Loader2, Calendar } from 'lucide-react'
import { parseBatchFridgeItems, type ParsedFridgeItem } from '@/utils/fridgeParser'
import { useFridgeStore } from '@/stores/fridgeStore'
import { useUIStore } from '@/stores/uiStore'

interface BatchFridgeModalProps {
  isOpen: boolean
  onClose: () => void
}

const SAMPLE_BATCHES = [
  {
    name: '周日买菜小票',
    icon: '🛒',
    text: '土豆2个、西红柿500g、五花肉400g、纯牛奶1盒、嫩豆腐1盒、生菜1把',
  },
  {
    name: '减脂健康备餐',
    icon: '🥗',
    text: '鸡胸肉500g、西兰花1棵、鸡蛋10个、无糖酸奶2盒、黄瓜2根、小番茄1盒',
  },
  {
    name: '火锅食材清单',
    icon: '🍲',
    text: '肥牛卷1盒、羊肉卷1盒、金针菇1包、娃娃菜2颗、虾滑1管、油豆皮1包',
  },
]

const CATEGORY_LIST = ['蔬菜', '肉类', '海鲜', '蛋奶', '豆制品', '主食', '调料', '干货', '其他']
const UNIT_LIST = ['个', 'g', 'kg', 'ml', 'L', '包', '袋', '盒', '瓶', '根', '棵', '把', '条', '块']

export function BatchFridgeModal({ isOpen, onClose }: BatchFridgeModalProps) {
  const { addItem } = useFridgeStore()
  const showToast = useUIStore((s) => s.showToast)

  const [input, setInput] = useState('')
  const [parsedItems, setParsedItems] = useState<ParsedFridgeItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleParse = () => {
    if (!input.trim()) return
    const items = parseBatchFridgeItems(input)
    if (items.length === 0) {
      showToast('未能识别出有效食材，请检查格式', 'error')
      return
    }
    setParsedItems(items)
  }

  const handleSaveAll = async () => {
    if (parsedItems.length === 0) return
    setSubmitting(true)
    try {
      for (const item of parsedItems) {
        if (!item.name.trim()) continue
        await addItem({
          name: item.name.trim(),
          amount: Number(item.amount) || 1,
          unit: item.unit || '个',
          category: item.category || '其他',
          purchaseDate: new Date().toISOString(),
          expiryDate: item.expiryDate || undefined,
        })
      }
      showToast(`🎉 成功录入 ${parsedItems.length} 样食材至冰箱`, 'success')
      setInput('')
      setParsedItems([])
      onClose()
    } catch {
      showToast('批量录入失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="font-display text-base font-bold text-[var(--color-text)]">
              智能批量录入食材
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {parsedItems.length === 0 ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--color-text)]">
                粘贴小票文字或自由输入（支持逗号/换行分隔）
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如：&#10;土豆2个、五花肉500g、纯牛奶2盒、生菜1把、生抽1瓶...&#10;&#10;系统将自动识别数量、分类并预估保质期。"
                rows={6}
                className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10"
              />

              {/* Sample Chips */}
              <div>
                <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                  💡 快捷体验模板：
                </span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {SAMPLE_BATCHES.map((sample) => (
                    <button
                      key={sample.name}
                      onClick={() => setInput(sample.text)}
                      className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] shadow-2xs hover:border-amber-500/50 hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] active:scale-95"
                    >
                      <span>{sample.icon}</span>
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleParse}
                disabled={!input.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-40"
              >
                <Sparkles size={16} />
                一键智能提取
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  已识别 {parsedItems.length} 项食材（可手动微调）：
                </span>
                <button
                  onClick={() => setParsedItems([])}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                >
                  重新输入
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2 shadow-2xs"
                  >
                    {/* Name */}
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const next = [...parsedItems]
                        next[idx].name = e.target.value
                        setParsedItems(next)
                      }}
                      placeholder="食材名称"
                      className="min-w-0 flex-1 bg-transparent px-1 text-xs font-semibold text-[var(--color-text)] outline-none"
                    />

                    {/* Amount */}
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => {
                        const next = [...parsedItems]
                        next[idx].amount = Number(e.target.value)
                        setParsedItems(next)
                      }}
                      className="w-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-1 py-1 text-center text-xs text-[var(--color-text)] outline-none"
                    />

                    {/* Unit */}
                    <select
                      value={item.unit}
                      onChange={(e) => {
                        const next = [...parsedItems]
                        next[idx].unit = e.target.value
                        setParsedItems(next)
                      }}
                      className="w-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-1 py-1 text-xs text-[var(--color-text)] outline-none"
                    >
                      {UNIT_LIST.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>

                    {/* Category */}
                    <select
                      value={item.category}
                      onChange={(e) => {
                        const next = [...parsedItems]
                        next[idx].category = e.target.value
                        setParsedItems(next)
                      }}
                      className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-1 py-1 text-xs text-[var(--color-text)] outline-none"
                    >
                      {CATEGORY_LIST.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    {/* Expiry Date */}
                    <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                      <Calendar size={12} />
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => {
                          const next = [...parsedItems]
                          next[idx].expiryDate = e.target.value
                          setParsedItems(next)
                        }}
                        className="w-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-1 py-1 text-[10px] text-[var(--color-text)] outline-none"
                      />
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => setParsedItems(parsedItems.filter((_, i) => i !== idx))}
                      className="p-1 text-[var(--color-text-muted)] hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  setParsedItems([
                    ...parsedItems,
                    {
                      id: `manual-${Date.now()}`,
                      name: '',
                      amount: 1,
                      unit: '个',
                      category: '蔬菜',
                      daysUntilExpiry: 5,
                      expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
                    },
                  ])
                }
                className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--color-border)] py-2 text-xs font-medium text-[var(--color-text-muted)] hover:border-amber-500 hover:text-amber-600"
              >
                <Plus size={13} />
                再添一项
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedItems.length > 0 && (
          <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/50 p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setParsedItems([])}
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-3 text-xs font-semibold text-[var(--color-text-secondary)] shadow-2xs hover:bg-[var(--color-bg)] active:scale-95"
              >
                取消
              </button>
              <button
                onClick={handleSaveAll}
                disabled={submitting}
                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    正在入库...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    确认录入 ({parsedItems.length} 样食材)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
