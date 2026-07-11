import { create } from 'zustand'
import type { FamilyGroup, FamilyMember } from '@/types'

const STORAGE_KEY = 'recipe-app-family'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function getStoredGroup(): FamilyGroup | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FamilyGroup
  } catch {
    return null
  }
}

interface FamilyState {
  group: FamilyGroup | null

  loadGroup: () => void
  createGroup: (nickname: string, email: string) => void
  joinGroup: (inviteCode: string, nickname: string, email: string) => boolean
  regenerateCode: () => void
  removeMember: (memberId: string) => void
  leaveGroup: () => void
  getInviteCode: () => string | null
  isOwner: () => boolean
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  group: getStoredGroup(),

  loadGroup: () => {
    set({ group: getStoredGroup() })
  },

  createGroup: (nickname, email) => {
    const now = new Date().toISOString()
    const group: FamilyGroup = {
      id: crypto.randomUUID(),
      ownerId: 'local',
      inviteCode: generateInviteCode(),
      members: [{
        id: crypto.randomUUID(),
        userId: 'local',
        nickname,
        email,
        joinedAt: now,
      }],
      createdAt: now,
      updatedAt: now,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(group))
    set({ group })
  },

  joinGroup: (inviteCode, nickname, email) => {
    const stored = getStoredGroup()
    if (stored && stored.inviteCode === inviteCode) {
      return false
    }

    const now = new Date().toISOString()
    const newMember: FamilyMember = {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      nickname,
      email,
      joinedAt: now,
    }

    const group: FamilyGroup = {
      id: crypto.randomUUID(),
      ownerId: 'remote',
      inviteCode,
      members: [newMember],
      createdAt: now,
      updatedAt: now,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(group))
    set({ group })
    return true
  },

  regenerateCode: () => {
    const group = get().group
    if (!group) return
    const updated = { ...group, inviteCode: generateInviteCode(), updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    set({ group: updated })
  },

  removeMember: (memberId) => {
    const group = get().group
    if (!group) return
    const updated = {
      ...group,
      members: group.members.filter((m) => m.id !== memberId),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    set({ group: updated })
  },

  leaveGroup: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ group: null })
  },

  getInviteCode: () => get().group?.inviteCode ?? null,

  isOwner: () => get().group?.ownerId === 'local',
}))
