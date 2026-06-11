import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    to?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-bg-subtle)]">
        <Icon size={36} className="text-[var(--color-text-muted)]" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-[var(--color-text)]">{title}</h3>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">{description}</p>
      {action && (
        action.to ? (
          <Link
            to={action.to}
            className="rounded-2xl bg-[var(--color-primary)] px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="rounded-2xl bg-[var(--color-primary)] px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
