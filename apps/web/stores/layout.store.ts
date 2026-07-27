"use client"

import { create } from "zustand"

export type ActivityTab = "explorer" | "search" | "git" | "terminal" | "settings" | "chat"
export type BottomTab = "terminal" | "problems" | "output"

interface LayoutState {
  activeTab: ActivityTab
  sidebarOpen: boolean
  bottomOpen: boolean
  bottomTab: BottomTab
  chatOpen: boolean
  workspaceRoot: string | null
  workspaceName: string | null
  dirHandle: FileSystemDirectoryHandle | null
  setActiveTab: (tab: ActivityTab) => void
  toggleSidebar: () => void
  toggleBottom: () => void
  setBottomTab: (tab: BottomTab) => void
  toggleChat: () => void
  openWorkspace: (root: string, name: string) => void
  openFolder: (handle: FileSystemDirectoryHandle) => void
  closeWorkspace: () => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  activeTab: "explorer",
  sidebarOpen: true,
  bottomOpen: true,
  bottomTab: "terminal",
  chatOpen: false,
  workspaceRoot: null,
  workspaceName: null,
  dirHandle: null,
  setActiveTab: (tab) => set({ activeTab: tab, sidebarOpen: true }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleBottom: () => set((s) => ({ bottomOpen: !s.bottomOpen })),
  setBottomTab: (tab) => set({ bottomTab: tab }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  openWorkspace: (root, name) => set({ workspaceRoot: root, workspaceName: name, dirHandle: null, activeTab: "explorer" }),
  openFolder: (handle) => set({ dirHandle: handle, workspaceName: handle.name, workspaceRoot: null, activeTab: "explorer" }),
  closeWorkspace: () => set({ workspaceRoot: null, workspaceName: null, dirHandle: null }),
}))
