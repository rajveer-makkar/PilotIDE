"use client"

import { create } from "zustand"
import { useLayoutStore } from "@/stores/layout.store"

interface EditorFile {
  path: string
  name: string
  content: string
  originalContent: string
  dirty: boolean
}

interface EditorStore {
  files: Record<string, EditorFile>
  activePath: string | null
  openFile: (path: string, name: string, content: string) => void
  closeFile: (path: string) => void
  setActive: (path: string) => void
  updateContent: (path: string, content: string) => void
  markClean: (path: string) => void
  saveCurrent: () => Promise<void>
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  files: {},
  activePath: null,

  openFile: (path, name, content) => {
    const files = get().files
    if (!files[path]) {
      set({
        files: {
          ...files,
          [path]: { path, name, content, originalContent: content, dirty: false },
        },
        activePath: path,
      })
    } else {
      set({ activePath: path })
    }
  },

  closeFile: (path) => {
    const rest = Object.fromEntries(Object.entries(get().files).filter(([k]) => k !== path))
    const order = Object.keys(get().files)
    const idx = order.indexOf(path)
    const nextActive = idx > 0 ? order[idx - 1] : order[1] || null
    set({ files: rest, activePath: get().activePath === path ? nextActive : get().activePath })
  },

  setActive: (path) => set({ activePath: path }),

  updateContent: (path, content) => {
    const file = get().files[path]
    if (!file) return
    set({
      files: {
        ...get().files,
        [path]: { ...file, content, dirty: content !== file.originalContent },
      },
    })
  },

  markClean: (path) => {
    const file = get().files[path]
    if (!file) return
    set({
      files: {
        ...get().files,
        [path]: { ...file, originalContent: file.content, dirty: false },
      },
    })
  },

  saveCurrent: async () => {
    const { activePath, files } = get()
    if (!activePath || !files[activePath]) return
    const file = files[activePath]
    // ponytail: try handle-based write first, fall back to server API
    const { dirHandle } = useLayoutStore.getState()
    if (dirHandle) {
      const parts = file.path.split("/")
      const fileName = parts.pop()!
      let handle: FileSystemDirectoryHandle = dirHandle
      for (const part of parts) {
        handle = await handle.getDirectoryHandle(part)
      }
      const fileHandle = await handle.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(file.content)
      await writable.close()
    } else {
      await fetch("/api/files/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: file.path, content: file.content }),
      })
    }
    get().markClean(activePath)
  },
}))
