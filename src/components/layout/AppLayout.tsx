import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] transition-colors duration-300">
      <main className="mx-auto max-w-2xl px-5 py-6 pb-28">
        <div key={location.pathname} className="page-enter-smooth">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
