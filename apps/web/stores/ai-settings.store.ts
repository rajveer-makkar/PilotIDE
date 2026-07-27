"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AISettings {
  apiUrl: string
  apiKey: string
  model: string
  setApiUrl: (v: string) => void
  setApiKey: (v: string) => void
  setModel: (v: string) => void
}

export const useAISettings = create<AISettings>()(
  persist(
    (set) => ({
      apiUrl: "",
      apiKey: "",
      model: "",
      setApiUrl: (v) => set({ apiUrl: v }),
      setApiKey: (v) => set({ apiKey: v }),
      setModel: (v) => set({ model: v }),
    }),
    { name: "pilot-ai-settings" }
  )
)
