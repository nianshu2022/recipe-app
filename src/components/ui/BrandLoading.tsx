import type { ReactNode } from 'react'

export function BrandLoading({ children }: { children?: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-10 opacity-40">
        <img src="/favicon.png" alt="知味" className="mb-3 h-14 w-14 rounded-2xl" />
        <p className="text-sm font-medium tracking-widest text-[var(--color-text-muted)]">
          知味
        </p>
      </div>
      {children}
    </div>
  )
}
