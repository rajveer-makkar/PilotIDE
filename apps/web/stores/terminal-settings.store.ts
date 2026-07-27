"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface TerminalSettings {
  fontSize: number
  fontFamily: string
  shellPath: string
  setFontSize: (v: number) => void
  setFontFamily: (v: string) => void
  setShellPath: (v: string) => void
}

export const useTerminalSettings = create<TerminalSettings>()(
  persist(
    (set) => ({
      fontSize: 13,
      fontFamily: "Menlo, monospace",
      shellPath: "",
      setFontSize: (v) => set({ fontSize: v }),
      setFontFamily: (v) => set({ fontFamily: v }),
      setShellPath: (v) => set({ shellPath: v }),
    }),
    { name: "pilot-terminal-settings" }
  )
)
