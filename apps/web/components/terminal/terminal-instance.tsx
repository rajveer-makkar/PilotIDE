"use client"

import { useEffect, useRef } from "react"
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
  const errRef = useRef<HTMLDivElement | null>(null)

  const { fontSize, fontFamily } = useTerminalSettings()

  useEffect(() => {
    clearTimeout(killTimerRef.current)
    let cancelled = false
    let term: any = null
    let fit: { fit: () => void } | null = null
    let ro: ResizeObserver | null = null
    const errEl = errRef.current

    async function init() {
      try {
        const [{ Terminal }, { FitAddon }] = await Promise.all([
          import("xterm"),
          import("xterm-addon-fit"),
        ])
        if (cancelled || !ref.current) return

        errEl?.remove()

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
        if (errEl) {
          errEl.textContent = `xterm error: ${(err as Error).message}`
          errEl.style.display = "flex"
        }
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

  return (
    <>
      <style>{`
.xterm{ cursor:text; position:relative; user-select:none; -ms-user-select:none; -webkit-user-select:none }
.xterm.focus,.xterm:focus{ outline:none }
.xterm .xterm-viewport{ background-color:#000; overflow-y:scroll; cursor:default; position:absolute; right:0; left:0; top:0; bottom:0 }
.xterm .xterm-screen{ position:relative }
.xterm .xterm-screen canvas{ position:absolute; left:0; top:0 }
.xterm .xterm-helper-textarea{ position:absolute; opacity:0; left:-9999em; top:0; width:0; height:0; z-index:-5; white-space:nowrap; overflow:hidden; resize:none; border:0; padding:0; margin:0 }
.xterm .composition-view{ display:none; position:absolute; white-space:nowrap; z-index:1 }
.xterm .composition-view.active{ display:block }
.xterm .xterm-accessibility,.xterm .xterm-message{ position:absolute; left:0; top:0; bottom:0; right:0; z-index:10; color:transparent; pointer-events:none }
.xterm-char-measure-element{ display:inline-block; visibility:hidden; position:absolute; top:0; left:-9999em; line-height:normal }
`}</style>
      <div
        ref={errRef}
        className="hidden h-full w-full items-center justify-center text-xs text-destructive"
      />
      <div ref={ref} className="h-full w-full" />
    </>
  )
}
