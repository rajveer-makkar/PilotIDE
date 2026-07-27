"use client"

import { create } from "zustand"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatStore {
  messages: ChatMessage[]
  isStreaming: boolean
  addMessage: (msg: ChatMessage) => void
  appendToLast: (text: string) => void
  setStreaming: (v: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  appendToLast: (text) => {
    if (get().messages.length === 0) return
    set((s) => {
      const msgs = [...s.messages]
      const last = { ...msgs[msgs.length - 1] } as ChatMessage
      last.content += text
      msgs[msgs.length - 1] = last
      return { messages: msgs }
    })
  },
  setStreaming: (v) => set({ isStreaming: v }),
  clearMessages: () => set({ messages: [], isStreaming: false }),
}))
