import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/home/HomePage'
import { RecipeDetailPage } from '@/pages/recipe/RecipeDetailPage'
import { RecipeFormPage } from '@/pages/recipe/RecipeFormPage'
import { CookingPage } from '@/pages/cooking/CookingPage'
import { CalendarPage } from '@/pages/calendar/CalendarPage'
import { FridgePage } from '@/pages/fridge/FridgePage'
import { MealPlanPage } from '@/pages/meal-plan/MealPlanPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { CollectionPage } from '@/pages/collection/CollectionPage'
import { ShoppingListPage } from '@/pages/shopping/ShoppingListPage'
import { LoginPage } from '@/pages/settings/LoginPage'
import { DataManagementPage } from '@/pages/settings/DataManagementPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
          <Route path="/recipe/new" element={<RecipeFormPage />} />
          <Route path="/recipe/:id/edit" element={<RecipeFormPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/fridge" element={<FridgePage />} />
          <Route path="/meal-plan" element={<MealPlanPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/settings/data" element={<DataManagementPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/shopping" element={<ShoppingListPage />} />
        </Route>
        <Route path="/cooking/:id" element={<CookingPage />} />
      </Routes>
    </BrowserRouter>
  )
}
