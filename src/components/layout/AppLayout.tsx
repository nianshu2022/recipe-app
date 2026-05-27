import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt'

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)] transition-colors duration-300">
      <main className="mx-auto max-w-2xl px-5 py-6 pb-24">
        <Outlet />
      </main>
      <BottomNav />
      <PwaInstallPrompt />
    </div>
  )
}
