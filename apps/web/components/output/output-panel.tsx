"use client"

import { useRef, useEffect } from "react"
import { useOutputStore } from "@/stores/output.store"
import { Button } from "@workspace/ui/components/button"
import { Trash2Icon } from "lucide-react"

export function OutputPanel() {
  const lines = useOutputStore((s) => s.lines)
  const clear = useOutputStore((s) => s.clear)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [lines])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-muted/20 px-2 py-1 backdrop-blur-sm">
        <span className="text-[11px] text-muted-foreground">Output</span>
        {lines.length > 0 && (
          <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={clear}>
            <Trash2Icon className="size-3.5" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-2 font-mono text-xs leading-relaxed">
        {lines.length === 0 ? (
          <p className="text-muted-foreground">No output yet</p>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line}</div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
