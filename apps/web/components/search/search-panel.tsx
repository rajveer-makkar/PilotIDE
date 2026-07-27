"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { SearchIcon, XIcon, FileIcon } from "lucide-react"
import { useEditorStore } from "@/stores/editor.store"

interface Match {
  file: string
  line: number
  content: string
}

export function SearchPanel() {
  const [query, setQuery] = useState("")
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openFile = useEditorStore((s) => s.openFile)

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b p-2">
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
        <div className="px-2 py-1 text-[11px] text-muted-foreground">
          {loading ? "Searching..." : `${matches.length} results`}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {Object.entries(grouped).map(([file, fileMatches]) => (
          <div key={file}>
            <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
              <FileIcon className="size-3 shrink-0" />
              <span className="truncate">{file}</span>
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
