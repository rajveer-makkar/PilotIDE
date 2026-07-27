"use client"

import { useEffect, useRef } from "react"
import "xterm/css/xterm.css"
import { useTerminalSettings } from "@/stores/terminal-settings.store"

interface Props {
  sessionId: string
  onExit: () => void
}

export function TerminalInstance({ sessionId, onExit }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const killTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onExitRef = useRef(onExit)
  onExitRef.current = onExit

  const { fontSize, fontFamily } = useTerminalSettings()

  useEffect(() => {
    clearTimeout(killTimerRef.current)
    let cancelled = false
    let term: any = null
    let fit: { fit: () => void } | null = null
    let ro: ResizeObserver | null = null

    async function init() {
      try {
        const [{ Terminal }, { FitAddon }] = await Promise.all([
          import("xterm"),
          import("xterm-addon-fit"),
        ])
        if (cancelled || !ref.current) return

        const isDark = document.documentElement.classList.contains("dark")
        term = new Terminal({
          cursorBlink: true,
          fontSize,
          fontFamily,
          theme: isDark
            ? { background: "#1e1e1e", foreground: "#d4d4d4", cursor: "#d4d4d4" }
            : { background: "#f3f3f3", foreground: "#333", cursor: "#333" },
        })
        fit = new FitAddon()
        term.loadAddon(fit)
        term.open(ref.current!)
        fit.fit()
        // ponytail: resize PTY before shell starts so prompt doesn't wrap at wrong width
        fetch(`/api/terminal/${sessionId}/resize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cols: term.cols, rows: term.rows }),
        }).catch(() => {})
      } catch (err) {
        console.error("[terminal]", err)
        return
      }

      term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "c" && term.getSelection()) {
          navigator.clipboard.writeText(term.getSelection())
          return false
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "v") {
          navigator.clipboard.readText().then((text) => term.paste(text))
          return false
        }
        return true
      })

      term.onData((data: string) => {
        fetch(`/api/terminal/${sessionId}/input`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        }).catch(() => {})
      })

      ro = new ResizeObserver(() => {
        try {
          const dims = fit?.fit()
          if (dims && term) {
            fetch(`/api/terminal/${sessionId}/resize`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cols: term.cols, rows: term.rows }),
            }).catch(() => {})
          }
        } catch {}
      })
      ro.observe(ref.current)

      // ponytail: fetch + reader instead of EventSource for better error feedback
      const resp = await fetch(`/api/terminal/${sessionId}/stream`)
      if (!resp.ok || !resp.body) {
        console.error("[terminal] stream response:", resp.status, resp.statusText)
        term.write(`\r\n\x1b[31mFailed to connect (${resp.status})\x1b[0m\r\n`)
        return
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (cancelled || done) break

        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue
          try {
            const msg = JSON.parse(line.slice(6))
            if (msg.type === "output") term!.write(msg.data)
            else if (msg.type === "exit") {
              term!.write(`\r\n\x1b[33m[process exited with code ${msg.code}]\x1b[0m\r\n`)
              onExitRef.current()
              return
            }
          } catch { /* skip parse errors */ }
        }
      }
    }
    init()
    return () => {
      cancelled = true
      term?.dispose()
      ro?.disconnect()
      // ponytail: delayed kill to survive React StrictMode double-fire
      killTimerRef.current = setTimeout(() => {
        fetch(`/api/terminal/${sessionId}/kill`, { method: "POST" }).catch(() => {})
      }, 1000)
    }
  }, [sessionId])

  return <div ref={ref} className="h-full w-full" />
}
