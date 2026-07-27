"use client"

import { create } from "zustand"

interface OutputStore {
  lines: string[]
  append: (text: string) => void
  clear: () => void
}

export const useOutputStore = create<OutputStore>((set) => ({
  lines: [],
  append: (text) => set((s) => ({ lines: [...s.lines, text] })),
  clear: () => set({ lines: [] }),
}))
