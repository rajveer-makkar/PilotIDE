"use client"

import { create } from "zustand"
import { persist, type PersistStorage } from "zustand/middleware"

const enc = (s: string) => btoa(s)
const dec = (s: string) => { try { return atob(s) } catch { return s } }

interface AISettings {
  apiUrl: string
  apiKey: string
  model: string
  setApiUrl: (v: string) => void
  setApiKey: (v: string) => void
  setModel: (v: string) => void
}

const storage: PersistStorage<AISettings> = {
  getItem(name) {
    const raw = localStorage.getItem(name)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.state?.apiKey) parsed.state.apiKey = dec(parsed.state.apiKey)
    return parsed
  },
  setItem(name, value) {
    const encoded = {
      ...value,
      state: {
        ...value.state,
        apiKey: value.state.apiKey ? enc(value.state.apiKey) : value.state.apiKey,
      },
    }
    localStorage.setItem(name, JSON.stringify(encoded))
  },
  removeItem(name) {
    localStorage.removeItem(name)
  },
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
    { name: "pilot-ai-settings", storage }
  )
)
