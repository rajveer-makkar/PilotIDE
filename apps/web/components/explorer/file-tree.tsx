"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useEditorStore } from "@/stores/editor.store"
import { useLayoutStore } from "@/stores/layout.store"
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  FilePenLineIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@workspace/ui/components/context-menu"

interface FileEntry {
  name: string
  path: string
  type: "file" | "directory"
  size: number
  modified: string
}

function FileIconByExt({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase()
  const color = ext === "ts" || ext === "tsx" ? "text-blue-500"
    : ext === "js" || ext === "jsx" ? "text-yellow-500"
    : ext === "css" || ext === "scss" ? "text-pink-400"
    : ext === "json" ? "text-orange-400"
    : ext === "md" ? "text-purple-400"
    : ext === "html" ? "text-red-400"
    : "text-muted-foreground"
  return <FileIcon className={cn("size-4 shrink-0", color)} />
}

async function resolveHandleDir(dirHandle: FileSystemDirectoryHandle, path: string) {
  if (!path) return dirHandle
  const parts = path.split("/")
  let h = dirHandle
  for (const part of parts) h = await h.getDirectoryHandle(part)
  return h
}

function CreateInput({
  parentPath,
  type,
  dirHandle,
  onDone,
}: {
  parentPath: string
  type: "file" | "directory"
  dirHandle: FileSystemDirectoryHandle | null
  onDone: () => void
}) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function submit() {
    const name = value.trim()
    if (!name) { onDone(); return }
    const childPath = parentPath ? `${parentPath}/${name}` : name
    if (dirHandle) {
      try {
        if (type === "directory") {
          await dirHandle.getDirectoryHandle(name, { create: true })
        } else {
          await dirHandle.getFileHandle(name, { create: true })
        }
      } catch (e) { console.error("create error", e) }
    } else {
      await fetch("/api/files/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: childPath, type }),
      }).catch((e) => console.error("create fetch error", e))
    }
    onDone()
  }

  return (
    <div className="flex items-center gap-1 px-2 py-[3px]" style={{ paddingLeft: `${8 + (parentPath.split("/").length + (parentPath ? 1 : 0)) * 16}px` }}>
      {type === "directory" ? <FolderIcon className="size-4 shrink-0 text-blue-400" /> : <FileIcon className="size-4 shrink-0 text-muted-foreground" />}
      <input
        ref={inputRef}
        className="h-5 flex-1 rounded border bg-background px-1 text-[13px] outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onDone() }}
        onBlur={submit}
      />
    </div>
  )
}

function TreeNode({
  name,
  path,
  type,
  depth,
  onRefresh,
}: FileEntry & { depth: number; onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState<FileEntry[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(name)
  const [creating, setCreating] = useState<"file" | "directory" | null>(null)
  const openFile = useEditorStore((s) => s.openFile)
  const dirHandle = useLayoutStore((s) => s.dirHandle)
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (renaming) renameRef.current?.focus() }, [renaming])

  const load = useCallback(async () => {
    if (children !== null && !creating) return
    setLoading(true)
    try {
      if (dirHandle) {
        const handle = await resolveHandleDir(dirHandle, path)
        const entries: FileEntry[] = []
        for await (const [n, entry] of (handle as any).entries()) {
          entries.push({ name: n, path: `${path}/${n}`, type: entry.kind as "file" | "directory", size: 0, modified: "" })
        }
        entries.sort((a, b) => {
          if (a.type !== b.type) return a.type === "directory" ? -1 : 1
          return a.name.localeCompare(b.name)
        })
        setChildren(entries)
      } else {
        const res = await fetch(`/api/files/list?path=${encodeURIComponent(path)}`)
        const data = await res.json()
        setChildren(data.files ?? [])
      }
      } catch (e) { console.error("list error", e); setChildren([]) } finally { setLoading(false) }
  }, [path, children, creating, dirHandle])

  async function readFile(filePath: string) {
    if (dirHandle) {
      const parts = filePath.split("/")
      const fileName = parts.pop()!
      let h: FileSystemDirectoryHandle = dirHandle
      for (const part of parts) h = await h.getDirectoryHandle(part)
      const f = await h.getFileHandle(fileName)
      return await (await f.getFile()).text()
    }
    const res = await fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`)
    const data = await res.json()
    return data.content as string
  }

  async function handleClick() {
    if (type === "directory") { setOpen(!open); if (!open) load(); return }
    try {
      const content = await readFile(path)
      if (content !== undefined) openFile(path, name, content)
    } catch (e) { console.error("read error", e) }
  }

  async function doRename() {
    const newName = renameValue.trim()
    if (!newName || newName === name) { setRenaming(false); return }
    if (dirHandle) {
      try {
        const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ""
        const parentHandle = await resolveHandleDir(dirHandle, parent)
        if (type === "directory") {
          const existing = await parentHandle.getDirectoryHandle(name)
          await parentHandle.getDirectoryHandle(newName, { create: true })
          // copy entries from old to new, then delete old (ponytail: naive recursive copy)
          await copyHandleDir(existing, await parentHandle.getDirectoryHandle(newName, { create: true }))
          await dirHandle.removeEntry(parent ? `${parent}/${name}` : name, { recursive: true })
        } else {
          const file = await parentHandle.getFileHandle(name)
          const buf = await (await file.getFile()).arrayBuffer()
          const newFile = await parentHandle.getFileHandle(newName, { create: true })
          const w = await newFile.createWritable()
          await w.write(new Uint8Array(buf))
          await w.close()
          await parentHandle.removeEntry(name)
        }
        } catch (e) { console.error("rename error", e) }
    } else {
      await fetch("/api/files/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, newName }),
      }).catch((e) => console.error("rename fetch error", e))
    }
    setRenaming(false)
    onRefresh()
  }

  async function doDelete() {
    if (!window.confirm(`Delete "${name}"?`)) return
    if (dirHandle) {
      try {
        const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ""
        const parentHandle = parent ? await resolveHandleDir(dirHandle, parent) : dirHandle
        await parentHandle.removeEntry(name, { recursive: true })
      } catch (e) { console.error("delete error", e) }
    } else {
      await fetch("/api/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      }).catch((e) => console.error("delete fetch error", e))
    }
    onRefresh()
  }

  async function onCreateDone() {
    setCreating(null)
    setOpen(true)
    load()
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-1 rounded-sm px-2 py-[3px] text-[13px] hover:bg-accent hover:text-accent-foreground",
              "text-muted-foreground"
            )}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={handleClick}
          >
            {type === "directory" ? (
              <>
                {open ? <ChevronDownIcon className="size-3.5 shrink-0" /> : <ChevronRightIcon className="size-3.5 shrink-0" />}
                {open ? <FolderOpenIcon className="size-4 shrink-0 text-blue-400" /> : <FolderIcon className="size-4 shrink-0 text-blue-400" />}
              </>
            ) : (
              <><span className="w-3.5" /><FileIconByExt name={name} /></>
            )}
            {renaming ? (
              <input
                ref={renameRef}
                className="h-5 flex-1 rounded border bg-background px-1 text-[13px] outline-none"
                value={renameValue}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") doRename(); if (e.key === "Escape") setRenaming(false) }}
                onBlur={doRename}
              />
            ) : (
              <span className="truncate">{name}</span>
            )}
            {loading && <span className="ml-auto text-[10px] text-muted-foreground">...</span>}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {type === "directory" && (
            <>
              <ContextMenuItem onClick={() => setCreating("file")}>
                <PlusIcon className="mr-2 size-3.5" /> New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setCreating("directory")}>
                <PlusIcon className="mr-2 size-3.5" /> New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={() => { setRenaming(true); setRenameValue(name) }}>
            <FilePenLineIcon className="mr-2 size-3.5" /> Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={doDelete}>
            <Trash2Icon className="mr-2 size-3.5" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {open && children && (
        <div>
          {children.map((child) => (
            <TreeNode key={child.path} {...child} depth={depth + 1} onRefresh={load} />
          ))}
        </div>
      )}
      {creating && (
        <CreateInput parentPath={path} type={creating} dirHandle={dirHandle} onDone={onCreateDone} />
      )}
    </>
  )
}

// ponytail: naive recursive directory copy for handle-based renames
async function copyHandleDir(src: FileSystemDirectoryHandle, dest: FileSystemDirectoryHandle) {
  for await (const [name, entry] of (src as any).entries()) {
    if (entry.kind === "directory") {
      const subDest = await dest.getDirectoryHandle(name, { create: true })
      await copyHandleDir(entry, subDest)
    } else {
      const file = await (entry as FileSystemFileHandle).getFile()
      const newFile = await dest.getFileHandle(name, { create: true })
      const w = await newFile.createWritable()
      await w.write(new Uint8Array(await file.arrayBuffer()))
      await w.close()
    }
  }
}

export function FileTree({ rootPath }: { rootPath: string }) {
  const [root, setRoot] = useState<FileEntry[] | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const dirHandle = useLayoutStore((s) => s.dirHandle)
  const loading = root === null

  const load = useCallback(async () => {
    if (dirHandle) {
      const entries: FileEntry[] = []
      for await (const [name, entry] of (dirHandle as any).entries()) {
        entries.push({ name, path: name, type: entry.kind as "file" | "directory", size: 0, modified: "" })
      }
      entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      setRoot(entries)
    } else {
      const res = await fetch(`/api/files/list?path=${encodeURIComponent(rootPath)}`)
      const data = await res.json()
      setRoot(data.files ?? [])
    }
  }, [dirHandle])

  useEffect(() => { load() }, [load, refreshKey])

  function refresh() { setRefreshKey((k) => k + 1) }

  if (loading) {
    return <div className="p-3 text-xs text-muted-foreground">Loading...</div>
  }

  return (
    <div className="py-1">
      {root?.map((entry) => (
        <TreeNode key={entry.path} {...entry} depth={0} onRefresh={refresh} />
      ))}
      {root?.length === 0 && <div className="p-3 text-xs text-muted-foreground">Empty folder</div>}
    </div>
  )
}
