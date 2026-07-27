"use client"

import { create } from "zustand"

interface DiffStore {
  diffFile: string | null
  original: string
  modified: string
  openDiff: (file: string, original: string, modified: string) => void
  closeDiff: () => void
}

export const useDiffStore = create<DiffStore>((set) => ({
  diffFile: null,
  original: "",
  modified: "",
  openDiff: (file, original, modified) => set({ diffFile: file, original, modified }),
  closeDiff: () => set({ diffFile: null, original: "", modified: "" }),
}))
