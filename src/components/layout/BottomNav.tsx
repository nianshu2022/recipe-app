import { useRef, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { UtensilsCrossed, Heart, CalendarRange, User, Sparkles } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

const leftItems = [
  { to: '/', icon: UtensilsCrossed, label: '寻味' },
  { to: '/meal-plan', icon: CalendarRange, label: '七日味' },
]
const rightItems = [
  { to: '/collection', icon: Heart, label: '收藏' },
  { to: '/settings', icon: User, label: '小窝' },
]

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof UtensilsCrossed; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `group relative flex flex-col items-center gap-1 rounded-2xl px-4 py-1.5 transition-all duration-200 ${
          isActive
            ? 'text-primary'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
          </div>
          <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-primary' : ''}`}>
            {label}
          </span>
          {isActive && (
            <span className="absolute -bottom-0.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  const modalOpen = useUIStore((s) => s.modalOpen)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (navRef.current) {
      if (modalOpen) {
        navRef.current.style.backdropFilter = 'none'
        navRef.current.style.backgroundColor = 'var(--color-bg-card)'
      } else {
        navRef.current.style.backdropFilter = ''
        navRef.current.style.backgroundColor = ''
      }
    }
  }, [modalOpen])

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)]/60 bg-[var(--color-bg-card)]/80 backdrop-blur-xl transition-colors duration-300">
      <div className="relative mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
        {leftItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Center button - 味遇 */}
        <Link
          to="/blind-box"
          className="group relative -mt-5 flex flex-col items-center gap-0.5"
        >
          <div className="animate-glow-pulse relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent-500)] text-white transition-all duration-200 hover:scale-110 active:scale-95">
            <Sparkles size={22} strokeWidth={2} className="relative z-10" />
          </div>
          <span className="text-[10px] font-medium tracking-wide text-primary">味遇</span>
        </Link>

        {rightItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
