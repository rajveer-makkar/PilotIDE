"use client"

import { useState, type FormEvent, useRef } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { FolderOpenIcon, FolderUpIcon } from "lucide-react"
import { useLayoutStore } from "@/stores/layout.store"
import { useWelcomeStore } from "@/stores/welcome.store"

export function ProjectSelector() {
  const [path, setPath] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const openWorkspace = useLayoutStore((s) => s.openWorkspace)
  const openFolder = useLayoutStore((s) => s.openFolder)
  const addRecent = useWelcomeStore((s) => s.addRecent)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/workspace/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      openWorkspace(data.root, data.name)
      addRecent(data.root)
    } catch {
      setError("Failed to open workspace")
    } finally {
      setLoading(false)
    }
  }

  async function pickFolder() {
    if (!("showDirectoryPicker" in window)) {
      setError("Folder picker requires Chrome/Edge")
      return
    }
    try {
      const handle = await (window as any).showDirectoryPicker()
      openFolder(handle)
    } catch {
      // user cancelled
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
      <FolderOpenIcon className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-center">Open a project folder to get started</p>
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-2">
        <Input
          placeholder="/path/to/project"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" disabled={loading || !path.trim()}>
          {loading ? "Opening..." : "Open Path"}
        </Button>
      </form>
      <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="w-full" onClick={pickFolder}>
        <FolderUpIcon className="mr-2 size-4" />
        Open Folder
      </Button>
    </div>
  )
}
