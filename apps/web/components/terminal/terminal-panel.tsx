"use client"

import { useState, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { PlusIcon, XIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { TerminalInstance } from "./terminal-instance"
import { useTerminalSettings } from "@/stores/terminal-settings.store"

interface Tab {
  id: string
  name: string
}

let tabCounter = 0

export function TerminalPanel() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const shellPath = useTerminalSettings((s) => s.shellPath)

  const closeTab = useCallback(async (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id))
    setActiveId((prev) => (prev === id ? null : prev))
    await fetch(`/api/terminal/${id}/kill`, { method: "POST" }).catch(() => {})
  }, [])

  const create = useCallback(async () => {
    setError("")
    setCreating(true)
    try {
      const res = await fetch("/api/terminal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shell: shellPath || undefined }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText)
        setError(`Failed: ${res.status} ${txt}`)
        return
      }
      const { id } = await res.json()
      if (!id) { setError("No session ID returned"); return }
      tabCounter++
      const name = `Terminal ${tabCounter}`
      setTabs((prev) => [...prev, { id, name }])
      setActiveId(id)
    } catch (e) {
      setError(`Error: ${(e as Error).message}`)
    } finally {
      setCreating(false)
    }
  }, [shellPath])

  if (tabs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-xs text-muted-foreground">No active terminal</p>
        <Button size="xs" variant="outline" onClick={create} disabled={creating}>
          <PlusIcon className="mr-1 size-3" />
          {creating ? "Starting..." : "New Terminal"}
        </Button>
        {error && <p className="max-w-xs text-center text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center border-b bg-muted/20 px-1">
        <div className="flex flex-1 items-center gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "flex items-center gap-1 border-r px-3 py-1 text-xs cursor-pointer whitespace-nowrap hover:bg-accent/50",
                tab.id === activeId && "bg-background"
              )}
              onClick={() => setActiveId(tab.id)}
            >
              <span>{tab.name}</span>
              <button
                className="ml-1 rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="icon-xs" className="ml-1 shrink-0 text-muted-foreground" onClick={create} disabled={creating}>
          <PlusIcon className="size-3.5" />
        </Button>
      </div>
      <div className="flex flex-1">
        {tabs.map((tab) => (
          <div key={tab.id} className={cn("h-full w-full", tab.id !== activeId && "hidden")}>
            <TerminalInstance sessionId={tab.id} onExit={() => closeTab(tab.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
