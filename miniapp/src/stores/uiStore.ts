import { create } from 'zustand'

interface UIState {
  modalOpen: boolean
  setModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  modalOpen: false,
  setModalOpen: (open) => set({ modalOpen: open }),
}))
