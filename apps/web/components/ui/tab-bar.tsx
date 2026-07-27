"use client"

import { cn } from "@workspace/ui/lib/utils"
import { XIcon } from "lucide-react"

export interface Tab {
  id: string
  label: string
  dirty?: boolean
}

interface TabBarProps {
  tabs: Tab[]
  activeId: string | null
  onChange: (id: string) => void
  onClose?: (id: string) => void
  className?: string
  size?: "sm" | "md"
}

export function TabBar({ tabs, activeId, onChange, onClose, className, size = "md" }: TabBarProps) {
  if (tabs.length === 0) return null

  return (
    <div className={cn("flex items-center overflow-x-auto", className)}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          data-active={activeId === tab.id}
          className={cn(
            "group flex shrink-0 cursor-pointer items-center gap-1 border-r transition-colors hover:bg-background/50",
            size === "md" ? "px-3 text-[13px]" : "px-2 text-xs",
            activeId === tab.id
              ? "bg-background/80 text-foreground"
              : "text-muted-foreground"
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.dirty && (
            <span className="size-2 shrink-0 rounded-full bg-blue-400" />
          )}
          <span className="truncate max-w-[160px]">{tab.label}</span>
          {onClose && (
            <button
              className="ml-0.5 rounded-sm p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onClose(tab.id) }}
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
