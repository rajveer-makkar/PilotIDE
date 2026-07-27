"use client"

import { useState, useRef, useEffect } from "react"
import { useCommandStore } from "@/stores/command.store"
import { cn } from "@workspace/ui/lib/utils"

export function CommandPalette() {
  const open = useCommandStore((s) => s.open)
  const setOpen = useCommandStore((s) => s.setOpen)
  const commands = useCommandStore((s) => s.commands)
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    setSelectedIdx(0)
    listRef.current?.scrollTo(0, 0)
  }, [query])

  if (!open) return null

  const execute = (idx: number) => {
    const cmd = filtered[idx]
    if (!cmd) return
    setOpen(false)
    cmd.handler()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      execute(selectedIdx)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="w-full max-w-[540px] rounded-lg border bg-popover text-popover-foreground shadow-lg">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a command..."
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div ref={listRef} className="max-h-[300px] overflow-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No results</p>
          ) : (
            filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm",
                  i === selectedIdx ? "bg-accent text-accent-foreground" : ""
                )}
                onMouseDown={() => execute(i)}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <span>{cmd.label}</span>
                {cmd.keybinding && (
                  <kbd className="ml-4 rounded border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {cmd.keybinding}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
