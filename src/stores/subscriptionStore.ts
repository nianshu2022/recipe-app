import { create } from 'zustand'
import type { Subscription, SubscriptionPlan } from '@/types'

const STORAGE_KEY = 'recipe-app-subscription'

interface SubscriptionState {
  subscription: Subscription | null

  loadSubscription: () => void
  getPlan: () => SubscriptionPlan
  isPro: () => boolean
  activatePro: (days: number) => void
  deactivate: () => void
}

function getStoredSubscription(): Subscription | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const sub = JSON.parse(raw) as Subscription
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return sub
  } catch {
    return null
  }
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: getStoredSubscription(),

  loadSubscription: () => {
    set({ subscription: getStoredSubscription() })
  },

  getPlan: () => {
    const sub = get().subscription
    if (!sub) return 'free'
    if (sub.plan === 'pro' && sub.expiresAt && new Date(sub.expiresAt) > new Date()) {
      return 'pro'
    }
    return 'free'
  },

  isPro: () => get().getPlan() === 'pro',

  activatePro: (days) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
    const sub: Subscription = {
      id: crypto.randomUUID(),
      userId: 'local',
      plan: 'pro',
      expiresAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sub))
    set({ subscription: sub })
  },

  deactivate: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ subscription: null })
  },
}))
