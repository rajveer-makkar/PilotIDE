"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { SearchIcon, XIcon, FileIcon, ReplaceIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { useEditorStore } from "@/stores/editor.store"
import { useOutputStore } from "@/stores/output.store"

interface Match {
  file: string
  line: number
  content: string
}

export function SearchPanel() {
  const [query, setQuery] = useState("")
  const [replacement, setReplacement] = useState("")
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openFile = useEditorStore((s) => s.openFile)
  const appendOutput = useOutputStore((s) => s.append)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setMatches([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setMatches(data.matches ?? [])
    } catch { /* network */ } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(query), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, doSearch])

  async function openResult(m: Match) {
    const res = await fetch(`/api/files/read?path=${encodeURIComponent(m.file)}`)
    const data = await res.json()
    if (data.content !== undefined) openFile(m.file, m.file.split("/").pop() ?? m.file, data.content)
  }

  const grouped = matches.reduce<Record<string, Match[]>>((acc, m) => {
    (acc[m.file] ??= []).push(m)
    return acc
  }, {})

  async function replaceAll() {
    if (!query.trim()) return
    const files = Object.keys(grouped)
    if (files.length === 0) return
    const res = await fetch("/api/search/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, replacement, files }),
    })
    const data = await res.json()
    if (data.replaced) {
      for (const r of data.replaced) {
        appendOutput(`Replaced ${r.count} occurrence(s) in ${r.file}`)
      }
      doSearch(query)
    }
  }

  async function replaceInFile(file: string) {
    const res = await fetch("/api/search/replace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, replacement, files: [file] }),
    })
    const data = await res.json()
    if (data.replaced?.[0]) {
      appendOutput(`Replaced ${data.replaced[0].count} occurrence(s) in ${file}`)
      doSearch(query)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-2">
        <div className="flex items-center gap-1">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Search workspace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 border-0 text-xs shadow-none focus-visible:ring-0"
          />
          {query && (
            <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={() => { setQuery(""); setMatches([]) }}>
              <XIcon className="size-3.5" />
            </Button>
          )}
        </div>
        {query && (
          <div className="mt-1">
            <Button variant="ghost" size="xs" className="h-6 gap-1 text-xs text-muted-foreground" onClick={() => setShowReplace(!showReplace)}>
              {showReplace ? <ChevronDownIcon className="size-3" /> : <ChevronRightIcon className="size-3" />}
              <ReplaceIcon className="size-3" />
              Replace
            </Button>
            {showReplace && (
              <div className="mt-1 flex items-center gap-1">
                <Input
                  placeholder="Replace with..."
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  className="h-7 border text-xs shadow-none focus-visible:ring-0"
                />
                <Button variant="outline" size="xs" className="h-7 text-xs" onClick={replaceAll}>
                  Replace All
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {query && (
        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground">
          <span>{loading ? "Searching..." : `${matches.length} results in ${Object.keys(grouped).length} files`}</span>
          {showReplace && replacement && <span className="text-xs">Preview — click file to replace</span>}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {Object.entries(grouped).map(([file, fileMatches]) => (
          <div key={file}>
            <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground hover:bg-accent/30">
              <div className="flex items-center gap-1 min-w-0">
                <FileIcon className="size-3 shrink-0" />
                <span className="truncate">{file}</span>
              </div>
              {showReplace && replacement && (
                <Button variant="ghost" size="icon-xs" className="shrink-0 text-muted-foreground" onClick={() => replaceInFile(file)}>
                  <ReplaceIcon className="size-3" />
                </Button>
              )}
            </div>
            {fileMatches.map((m, i) => (
              <button
                key={`${m.file}-${m.line}-${i}`}
                className="flex w-full items-start gap-2 px-2 py-[2px] text-xs hover:bg-accent"
                onClick={() => openResult(m)}
              >
                <span className="w-8 shrink-0 text-right text-muted-foreground">{m.line}</span>
                <span className="truncate text-foreground/80">{m.content}</span>
              </button>
            ))}
          </div>
        ))}
        {query && !loading && matches.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">No results</div>
        )}
      </div>
    </div>
  )
}
