"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WelcomeStore {
  recentProjects: string[]
  addRecent: (path: string) => void
  clearRecents: () => void
}

export const useWelcomeStore = create<WelcomeStore>()(
  persist(
    (set) => ({
      recentProjects: [],
      addRecent: (path) =>
        set((s) => ({
          recentProjects: [path, ...s.recentProjects.filter((p) => p !== path)].slice(0, 10),
        })),
      clearRecents: () => set({ recentProjects: [] }),
    }),
    { name: "pilot-welcome" }
  )
)
