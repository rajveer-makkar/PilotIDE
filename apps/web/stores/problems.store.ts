"use client"

import { create } from "zustand"

export interface Problem {
  file: string
  line: number
  column: number
  message: string
  severity: "error" | "warning" | "info"
}

interface ProblemsStore {
  problems: Problem[]
  setProblems: (p: Problem[]) => void
}

export const useProblemsStore = create<ProblemsStore>((set) => ({
  problems: [],
  setProblems: (problems) => set({ problems }),
}))
