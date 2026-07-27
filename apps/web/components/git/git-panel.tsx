"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import { GitBranchIcon, RotateCcwIcon, ArrowRightFromLineIcon, ArrowUpFromLineIcon, ArrowDownFromLineIcon, CloudIcon } from "lucide-react"
import { useDiffStore } from "@/stores/diff.store"
import { useOutputStore } from "@/stores/output.store"

interface GitFile {
  path: string
  staged: boolean
  status: "added" | "modified" | "deleted" | "renamed" | "untracked"
}

const statusIcon: Record<string, string> = {
  added: "A",
  modified: "M",
  deleted: "D",
  renamed: "R",
  untracked: "?",
}
const statusColor: Record<string, string> = {
  added: "text-green-500",
  modified: "text-yellow-500",
  deleted: "text-red-500",
  renamed: "text-purple-500",
  untracked: "text-muted-foreground",
}

export function GitPanel() {
  const [branch, setBranch] = useState("")
  const [files, setFiles] = useState<GitFile[]>([])
  const [loading, setLoading] = useState(true)
  const [commitMsg, setCommitMsg] = useState("")
  const [committing, setCommitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/git/status")
      const data = await res.json()
      if (res.ok) {
        setBranch(data.branch)
        setFiles(data.files ?? [])
      }
    } catch { /* network errors */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function stage(path: string) {
    await fetch("/api/git/stage", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: [path] }),
    })
    load()
  }

  async function unstage(path: string) {
    await fetch("/api/git/unstage", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: [path] }),
    })
    load()
  }

  const openDiff = useDiffStore((s) => s.openDiff)
  const appendOutput = useOutputStore((s) => s.append)
  const [remoteOp, setRemoteOp] = useState<string | null>(null)

  async function openFileDiff(path: string) {
    const [headRes, workRes] = await Promise.all([
      fetch(`/api/git/show?path=${encodeURIComponent(path)}`),
      fetch(`/api/files/read?path=${encodeURIComponent(path)}`),
    ])
    const head = await headRes.json()
    const work = await workRes.json()
    openDiff(path, head.content ?? "", work.content ?? "")
  }

  async function commit() {
    if (!commitMsg.trim()) return
    setCommitting(true)
    const res = await fetch("/api/git/commit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: commitMsg }),
    })
    const result = await res.json()
    appendOutput(res.ok ? `✓ Committed: ${commitMsg}` : `✗ Commit failed: ${result.error}`)
    setCommitMsg("")
    setCommitting(false)
    load()
  }

  const staged = files.filter((f) => f.staged)
  const unstaged = files.filter((f) => !f.staged)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 px-3 py-2">
        <GitBranchIcon className="size-4 text-muted-foreground" />
        <span className="mr-auto text-[13px] font-medium">{branch}</span>
        <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={load} disabled={loading}>
          <RotateCcwIcon className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={async () => {
          setRemoteOp("fetch")
          try {
            const res = await fetch("/api/git/fetch", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
            const d = await res.json()
            appendOutput(res.ok ? "✓ Fetched from origin" : `✗ Fetch failed: ${d.error}`)
          } finally { setRemoteOp(null); load() }
        }} disabled={remoteOp !== null}>
          <CloudIcon className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={async () => {
          setRemoteOp("pull")
          try {
            const res = await fetch("/api/git/pull", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
            const d = await res.json()
            appendOutput(res.ok ? "✓ Pulled from origin" : `✗ Pull failed: ${d.error}`)
          } finally { setRemoteOp(null); load() }
        }} disabled={remoteOp !== null}>
          <ArrowDownFromLineIcon className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={async () => {
          setRemoteOp("push")
          try {
            const res = await fetch("/api/git/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branch }) })
            const d = await res.json()
            appendOutput(res.ok ? `✓ Pushed ${branch}` : `✗ Push failed: ${d.error}`)
          } finally { setRemoteOp(null); load() }
        }} disabled={remoteOp !== null}>
          <ArrowUpFromLineIcon className="size-3.5" />
        </Button>
      </div>
      <Separator />

      {loading && files.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-xs text-muted-foreground">No changes</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-auto">
          {staged.length > 0 && (
            <div className="px-2 py-1">
              <p className="mb-1 px-2 text-[11px] font-medium uppercase text-muted-foreground">Staged</p>
              {staged.map((f) => (
                <div key={f.path} className="group flex items-center gap-1 rounded-sm px-2 py-[3px] text-[13px] hover:bg-accent cursor-pointer" onClick={() => openFileDiff(f.path)}>
                  <span className={cn("w-4 text-[11px] font-mono", statusColor[f.status])}>{statusIcon[f.status]}</span>
                  <span className="flex-1 truncate">{f.path}</span>
                  <ArrowRightFromLineIcon className="ml-auto hidden size-3 text-muted-foreground group-hover:block" />
                  <button className="hidden text-[11px] text-muted-foreground hover:text-foreground group-hover:block" onClick={(e) => { e.stopPropagation(); unstage(f.path) }}>−</button>
                </div>
              ))}
            </div>
          )}

          {unstaged.length > 0 && (
            <div className="px-2 py-1">
              {staged.length > 0 && <Separator className="my-1" />}
              <p className="mb-1 px-2 text-[11px] font-medium uppercase text-muted-foreground">Changes</p>
              {unstaged.map((f) => (
                <div key={f.path} className="group flex items-center gap-1 rounded-sm px-2 py-[3px] text-[13px] hover:bg-accent cursor-pointer" onClick={() => openFileDiff(f.path)}>
                  <span className={cn("w-4 text-[11px] font-mono", statusColor[f.status])}>{statusIcon[f.status]}</span>
                  <span className="flex-1 truncate">{f.path}</span>
                  <ArrowRightFromLineIcon className="ml-auto hidden size-3 text-muted-foreground group-hover:block" />
                  <button className="hidden text-[11px] text-muted-foreground hover:text-foreground group-hover:block" onClick={(e) => { e.stopPropagation(); stage(f.path) }}>+</button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto border-t p-2">
            <div className="flex gap-1">
              <Input
                placeholder="Commit message"
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                className="h-7 text-xs"
                onKeyDown={(e) => { if (e.key === "Enter") commit() }}
              />
              <Button size="xs" onClick={commit} disabled={!commitMsg.trim() || committing}>
                {committing ? "..." : "Commit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
