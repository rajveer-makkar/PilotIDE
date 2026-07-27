"use client"

import { create } from "zustand"

export interface Command {
  id: string
  label: string
  keybinding?: string
  handler: () => void
}

interface CommandStore {
  open: boolean
  commands: Command[]
  register: (cmd: Command) => void
  setOpen: (v: boolean) => void
  toggle: () => void
}

export const useCommandStore = create<CommandStore>((set) => ({
  open: false,
  commands: [],
  register: (cmd) => set((s) => {
    if (s.commands.find((c) => c.id === cmd.id)) return s
    return { commands: [...s.commands, cmd] }
  }),
  setOpen: (v) => set({ open: v }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
