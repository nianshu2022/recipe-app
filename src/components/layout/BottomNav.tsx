import { useRef, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { UtensilsCrossed, Refrigerator, CalendarRange, User, Dice5 } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

const leftItems = [
  { to: '/', icon: UtensilsCrossed, label: '寻味' },
  { to: '/meal-plan', icon: CalendarRange, label: '七日味' },
]
const rightItems = [
  { to: '/fridge', icon: Refrigerator, label: '食材簿' },
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
            : 'text-stone-400 hover:text-stone-600'
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
        navRef.current.style.backgroundColor = 'white'
      } else {
        navRef.current.style.backdropFilter = ''
        navRef.current.style.backgroundColor = ''
      }
    }
  }, [modalOpen])

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/60 bg-white/80 backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
        {leftItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Center blind box button */}
        <Link
          to="/blind-box"
          className="group relative -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent-500)] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95"
        >
          <Dice5 size={24} strokeWidth={2} />
        </Link>

        {rightItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
