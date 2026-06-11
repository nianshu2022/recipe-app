import type { ReactNode } from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-lg bg-[var(--color-bg-subtle)] ${className}`} />
  )
}

interface PageSkeletonProps {
  header?: boolean
  children?: ReactNode
}

export function PageSkeleton({ header = true, children }: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {header && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      )}
      {children}
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
          <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-3 py-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-8 mx-auto" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-[var(--color-bg-card)] p-3 shadow-xs">
          <Skeleton className="aspect-[4/3] rounded-xl" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
