import { useState } from 'react'
import { X, Copy, Download, Check, Loader2, Sparkles, MessageSquare, ShoppingBag, FileText } from 'lucide-react'
import type { ShoppingList, ShoppingItem } from '@/types'
import {
  formatWechatMessage,
  formatECommerceKeywords,
  exportShoppingReceiptImage,
} from '@/utils/shoppingExport'
import { useUIStore } from '@/stores/uiStore'

interface ShoppingShareModalProps {
  list: ShoppingList
  isOpen: boolean
  onClose: () => void
}

type TabType = 'wechat' | 'ecommerce' | 'receipt'

export function ShoppingShareModal({ list, isOpen, onClose }: ShoppingShareModalProps) {
  const showToast = useUIStore((s) => s.showToast)
  const [tab, setTab] = useState<TabType>('wechat')
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  if (!isOpen || !list) return null

  const defaultTitle = '今日买菜清单'
  const items: ShoppingItem[] = list.items || []
  const wechatText = formatWechatMessage(defaultTitle, items)
  const ecomText = formatECommerceKeywords(items)

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      showToast(`📋 ${label}已复制`, 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('复制失败，请手动选择', 'error')
    }
  }

  const handleDownloadReceipt = async () => {
    setExporting(true)
    try {
      await exportShoppingReceiptImage(defaultTitle, items)
      showToast('🎉 购物小票长图已保存', 'success')
    } catch {
      showToast('生成长图失败，请重试', 'error')
    } finally {
      setExporting(false)
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
              分享与导出购物清单
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 pb-0">
          <div className="flex gap-1.5 rounded-2xl bg-[var(--color-bg-subtle)] p-1">
            <button
              onClick={() => setTab('wechat')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                tab === 'wechat'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <MessageSquare size={14} />
              微信代买
            </button>
            <button
              onClick={() => setTab('ecommerce')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                tab === 'ecommerce'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <ShoppingBag size={14} />
              买菜软件搜索
            </button>
            <button
              onClick={() => setTab('receipt')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                tab === 'receipt'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <FileText size={14} />
              小票海报
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'wechat' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-text-muted)]">
                适合发送到微信好友或家庭群，按品类清晰排版：
              </p>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-xs">
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--color-text)]">
                  {wechatText}
                </pre>
              </div>
            </div>
          )}

          {tab === 'ecommerce' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-text-muted)]">
                一键复制食材关键词，可直接粘贴到盒马、叮咚买菜、美团买菜批量添加购物车：
              </p>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-xs">
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {ecomText || '暂无未采购食材'}
                </p>
              </div>
            </div>
          )}

          {tab === 'receipt' && (
            <div className="space-y-3 text-center">
              <p className="text-xs text-[var(--color-text-muted)]">
                生成质感买菜小票海报，记录生活仪式感：
              </p>
              <div className="mx-auto max-w-xs rounded-2xl border border-dashed border-[#D6D0C4] bg-[#FFFFFF] p-4 text-left shadow-sm text-stone-800">
                <div className="text-center border-b border-dashed border-stone-300 pb-2 mb-2">
                  <span className="text-[10px] font-bold text-amber-600 tracking-wider">
                    ✦ ZHIWEI GROCERY RECEIPT ✦
                  </span>
                  <h4 className="font-bold text-sm text-stone-900">{defaultTitle}</h4>
                  <span className="text-[10px] text-stone-500">共 {items.length} 件食材</span>
                </div>
                <div className="space-y-1 text-xs">
                  {items.slice(0, 5).map((i) => (
                    <div key={i.id} className="flex justify-between">
                      <span className="truncate">{i.name}</span>
                      <span className="font-semibold text-amber-600">
                        {i.amount ? `${i.amount}${i.unit || ''}` : '1份'}
                      </span>
                    </div>
                  ))}
                  {items.length > 5 && (
                    <p className="text-[10px] text-center text-stone-400 mt-1">
                      ... 其余 {items.length - 5} 项将在高清小票中完整展示 ...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/50 p-4">
          {tab === 'wechat' && (
            <button
              onClick={() => handleCopy(wechatText, '微信代买文本')}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg active:scale-95"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '已复制到剪贴板' : '复制微信代买文本'}
            </button>
          )}

          {tab === 'ecommerce' && (
            <button
              onClick={() => handleCopy(ecomText, '买菜搜索词')}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg active:scale-95"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '已复制搜索词' : '复制买菜搜索词'}
            </button>
          )}

          {tab === 'receipt' && (
            <button
              onClick={handleDownloadReceipt}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  生成小票中...
                </>
              ) : (
                <>
                  <Download size={16} />
                  下载高清小票海报
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
