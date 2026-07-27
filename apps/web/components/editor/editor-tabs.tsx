"use client"

import { XIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useEditorStore } from "@/stores/editor.store"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@workspace/ui/components/context-menu"

export function EditorTabs() {
  const files = useEditorStore((s) => s.files)
  const activePath = useEditorStore((s) => s.activePath)
  const setActive = useEditorStore((s) => s.setActive)
  const closeFile = useEditorStore((s) => s.closeFile)
  const closeAll = useEditorStore((s) => s.closeAll)
  const closeOthers = useEditorStore((s) => s.closeOthers)
  const closeToRight = useEditorStore((s) => s.closeToRight)

  const entries = Object.values(files)

  if (entries.length === 0) {
    return (
      <div className="flex h-[35px] items-center border-b bg-muted/30 px-2 backdrop-blur-sm">
        <span className="text-xs text-muted-foreground">No files open</span>
      </div>
    )
  }

  return (
    <div className="flex h-[35px] items-center overflow-x-auto border-b bg-muted/30 backdrop-blur-sm">
      {entries.map((file) => (
        <ContextMenu key={file.path}>
          <ContextMenuTrigger asChild>
            <div
              data-active={activePath === file.path}
              className={cn(
                "flex shrink-0 items-center gap-1 border-r px-3 text-[13px]",
                "cursor-pointer hover:bg-background/50",
                activePath === file.path ? "bg-background/80 text-foreground" : "text-muted-foreground"
              )}
              onClick={() => setActive(file.path)}
            >
              {file.dirty && <span className="size-2 shrink-0 rounded-full bg-blue-400" />}
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button
                className="ml-0.5 rounded p-0.5 opacity-0 hover:bg-muted hover:opacity-100 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); closeFile(file.path) }}
              >
                <XIcon className="size-3" />
              </button>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => closeFile(file.path)}>
              Close
            </ContextMenuItem>
            <ContextMenuItem onClick={() => closeOthers(file.path)}>
              Close Others
            </ContextMenuItem>
            <ContextMenuItem onClick={() => closeToRight(file.path)}>
              Close to the Right
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={closeAll}>
              Close All
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  )
}
