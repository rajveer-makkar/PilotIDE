"use client"

import { useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { TerminalIcon, FolderOpenIcon, Trash2Icon } from "lucide-react"
import { useLayoutStore } from "@/stores/layout.store"
import { useWelcomeStore } from "@/stores/welcome.store"

export function WelcomePanel() {
  const workspaceRoot = useLayoutStore((s) => s.workspaceRoot)
  const workspaceName = useLayoutStore((s) => s.workspaceName)
  const openWorkspace = useLayoutStore((s) => s.openWorkspace)
  const openFolder = useLayoutStore((s) => s.openFolder)
  const toggleBottom = useLayoutStore((s) => s.toggleBottom)
  const setBottomTab = useLayoutStore((s) => s.setBottomTab)
  const { recentProjects, addRecent, clearRecents } = useWelcomeStore()

  const pickFolder = useCallback(async () => {
    try {
      const handle = await (window as any).showDirectoryPicker()
      openFolder(handle)
    } catch { /* cancelled */ }
  }, [openFolder])

  const openRecent = useCallback(async (path: string) => {
    try {
      const res = await fetch("/api/workspace/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      })
      const data = await res.json()
      if (res.ok) openWorkspace(data.root, data.name)
    } catch { /* network error */ }
    addRecent(path)
  }, [openWorkspace, addRecent])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2">
        <TerminalIcon className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Pilot IDE</h1>
        <p className="text-sm text-muted-foreground">Start coding — open a folder or create a new file</p>
      </div>

      <div className="flex gap-3">
        <Button onClick={pickFolder}>
          <FolderOpenIcon className="mr-1.5 size-4" />
          Open Folder
        </Button>
        <Button variant="outline" onClick={() => { toggleBottom(); setBottomTab("terminal") }}>
          <TerminalIcon className="mr-1.5 size-4" />
          Open Terminal
        </Button>
      </div>

      {recentProjects.length > 0 && (
        <div className="w-full max-w-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase text-muted-foreground">Recent Projects</h2>
            <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={clearRecents}>
              <Trash2Icon className="size-3" />
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            {recentProjects.map((p) => (
              <button
                key={p}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => openRecent(p)}
              >
                <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{p}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {workspaceRoot && (
        <p className="text-xs text-muted-foreground">
          Current: <span className="font-medium text-foreground">{workspaceName}</span>
        </p>
      )}
    </div>
  )
}
