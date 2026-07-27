"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface EditorSettings {
  minimap: boolean
  formatOnSave: boolean
  autoSave: boolean
  setMinimap: (v: boolean) => void
  setFormatOnSave: (v: boolean) => void
  setAutoSave: (v: boolean) => void
}

export const useEditorSettings = create<EditorSettings>()(
  persist(
    (set) => ({
      minimap: false,
      formatOnSave: true,
      autoSave: false,
      setMinimap: (v) => set({ minimap: v }),
      setFormatOnSave: (v) => set({ formatOnSave: v }),
      setAutoSave: (v) => set({ autoSave: v }),
    }),
    { name: "pilot-editor-settings" }
  )
)
