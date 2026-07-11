import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { ToastContainer } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useRecipeStore } from '@/stores/recipeStore'

// Lazy-loaded pages
const HomePage = lazy(() => import('@/pages/home/HomePage').then(m => ({ default: m.HomePage })))
const RecipeDetailPage = lazy(() => import('@/pages/recipe/RecipeDetailPage').then(m => ({ default: m.RecipeDetailPage })))
const RecipeFormPage = lazy(() => import('@/pages/recipe/RecipeFormPage').then(m => ({ default: m.RecipeFormPage })))
const CookingPage = lazy(() => import('@/pages/cooking/CookingPage').then(m => ({ default: m.CookingPage })))

const MealPlanPage = lazy(() => import('@/pages/meal-plan/MealPlanPage').then(m => ({ default: m.MealPlanPage })))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const CollectionPage = lazy(() => import('@/pages/collection/CollectionPage').then(m => ({ default: m.CollectionPage })))
const ShoppingListPage = lazy(() => import('@/pages/shopping/ShoppingListPage').then(m => ({ default: m.ShoppingListPage })))
const LoginPage = lazy(() => import('@/pages/settings/LoginPage').then(m => ({ default: m.LoginPage })))
const DataManagementPage = lazy(() => import('@/pages/settings/DataManagementPage').then(m => ({ default: m.DataManagementPage })))
const PricingPage = lazy(() => import('@/pages/settings/PricingPage').then(m => ({ default: m.PricingPage })))
const FamilyPage = lazy(() => import('@/pages/settings/FamilyPage').then(m => ({ default: m.FamilyPage })))
const BlindBoxPage = lazy(() => import('@/pages/blind-box/BlindBoxPage').then(m => ({ default: m.BlindBoxPage })))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<PageSuspense><HomePage /></PageSuspense>} />
          <Route path="/recipe/:id" element={<PageSuspense><RecipeDetailPage /></PageSuspense>} />
          <Route path="/recipe/new" element={<PageSuspense><RecipeFormPage /></PageSuspense>} />
          <Route path="/recipe/:id/edit" element={<PageSuspense><RecipeFormPage /></PageSuspense>} />

          <Route path="/meal-plan" element={<PageSuspense><MealPlanPage /></PageSuspense>} />
          <Route path="/settings" element={<PageSuspense><SettingsPage /></PageSuspense>} />
          <Route path="/login" element={<PageSuspense><LoginPage /></PageSuspense>} />
          <Route path="/settings/data" element={<PageSuspense><DataManagementPage /></PageSuspense>} />
          <Route path="/settings/pricing" element={<PageSuspense><PricingPage /></PageSuspense>} />
          <Route path="/settings/family" element={<PageSuspense><FamilyPage /></PageSuspense>} />
          <Route path="/collection" element={<PageSuspense><CollectionPage /></PageSuspense>} />
          <Route path="/shopping" element={<PageSuspense><ShoppingListPage /></PageSuspense>} />
          <Route path="/blind-box" element={<PageSuspense><BlindBoxPage /></PageSuspense>} />
          <Route path="/privacy" element={<PageSuspense><PrivacyPage /></PageSuspense>} />

          <Route path="*" element={<PageSuspense><NotFoundPage /></PageSuspense>} />
        </Route>
        <Route path="/cooking/:id" element={<PageSuspense><CookingPage /></PageSuspense>} />
      </Routes>
    </div>
  )
}

export default function App() {
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  useEffect(() => {
    let lastTouchEnd = 0

    const preventGestureZoom = (event: Event) => {
      event.preventDefault()
    }
    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }

    document.addEventListener('gesturestart', preventGestureZoom, { passive: false })
    document.addEventListener('gesturechange', preventGestureZoom, { passive: false })
    document.addEventListener('gestureend', preventGestureZoom, { passive: false })
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', preventGestureZoom)
      document.removeEventListener('gesturechange', preventGestureZoom)
      document.removeEventListener('gestureend', preventGestureZoom)
      document.removeEventListener('touchend', preventDoubleTapZoom)
    }
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnimatedRoutes />
        <ToastContainer />
        <ConfirmDialog />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
