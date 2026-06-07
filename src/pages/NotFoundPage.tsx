import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-bg-subtle)]">
        <MapPin size={36} className="text-[var(--color-text-muted)]" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-[var(--color-text)]">页面不存在</h3>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">你好像迷路了，回去看看吧</p>
      <Link
        to="/"
        replace
        className="rounded-2xl bg-[var(--color-primary)] px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
      >
        返回首页
      </Link>
    </div>
  )
}
