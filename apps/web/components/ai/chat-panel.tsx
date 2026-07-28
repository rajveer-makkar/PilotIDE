"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { useChatStore, type ChatMessage } from "@/stores/chat.store"
import { useAISettings } from "@/stores/ai-settings.store"
import { useEditorStore } from "@/stores/editor.store"
import { useLayoutStore } from "@/stores/layout.store"
import { renderMarkdown } from "@/lib/utils/markdown"
import { SendIcon, Trash2Icon, BotIcon, UserIcon } from "lucide-react"

function ChatBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className={`flex gap-2 px-3 py-2 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}>
      <div className="mt-0.5 shrink-0">
        {msg.role === "assistant" ? (
          <BotIcon className="size-4 text-muted-foreground" />
        ) : (
          <UserIcon className="size-4 text-muted-foreground" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm leading-relaxed ${
          msg.role === "assistant"
            ? "bg-muted/80 text-foreground backdrop-blur-sm"
            : "bg-primary text-primary-foreground"
        }`}
      >
        <div
          className="prose prose-sm dark:prose-invert max-w-none [&_pre]:overflow-auto [&_pre]:rounded [&_pre]:bg-black/10 [&_pre]:p-2 [&_pre]:text-xs [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1"
          dangerouslySetInnerHTML={{
            __html: msg.role === "assistant" ? renderMarkdown(msg.content) : escapeHtml(msg.content),
          }}
        />
      </div>
    </div>
  )
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

const estimateTokens = (s: string) => Math.ceil(s.length / 4)

function formatTokenCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function modelMaxTokens(model: string): number {
  const m = model.toLowerCase()
  if (m.includes("claude-3-5-sonnet") || m.includes("claude-4")) return 200000
  if (m.startsWith("gpt-4o")) return 128000
  if (m.startsWith("gpt-4-turbo")) return 128000
  if (m.startsWith("gpt-4")) return 8192
  if (m.startsWith("gpt-3.5")) return 16384
  if (m.includes("gemini") || m.includes("llama") || m.includes("mistral")) return 128000
  return 500000
}

export function ChatPanel() {
  const { messages, isStreaming, addMessage, appendToLast, setStreaming, clearMessages } = useChatStore()
  const [input, setInput] = useState("")
  const [contextTokens, setContextTokens] = useState(0)
  const [maxTokens, setMaxTokens] = useState(500000)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const buildContext = useCallback(async () => {
    const { workspaceRoot, workspaceName } = useLayoutStore.getState()
    const { files } = useEditorStore.getState()
    const openFiles = Object.values(files)

    const model = useAISettings.getState().model
    const maxCtx = modelMaxTokens(model)
    setMaxTokens(maxCtx)

    let ctx = ""
    const add = (s: string) => { ctx += s + "\n" }

    const proj = workspaceName || workspaceRoot
    if (proj) {
      add(`Project: ${proj}`)
      try {
        const res = await fetch(`/api/files/list?path=`)
        const data = await res.json()
        if (data.files) {
          const tree = data.files.map((f: any) => `  ${f.type === "directory" ? "📁" : "📄"} ${f.name}`)
          add(`Files:\n${tree.join("\n")}`)
        }
      } catch { /* skip tree on error */ }
    }

    if (openFiles.length > 0) {
      add(`\nOpen files:`)
      for (const f of openFiles) {
        add(`\n${f.path}:\n\`\`\`\n${f.content}\n\`\`\``)
      }
    }

    ctx += "\n\n---\n\n"
    setContextTokens(estimateTokens(ctx))
    return ctx
  }, [])

  async function send() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput("")

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text }
    addMessage(userMsg)

    const assistantId = crypto.randomUUID()
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "" }
    addMessage(assistantMsg)

    setStreaming(true)
    abortRef.current = new AbortController()

    try {
      const contextMsg = await buildContext()

      const apiMessages = [...messages, { ...userMsg, content: contextMsg + userMsg.content }].map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const aiConfig = useAISettings.getState()
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          aiConfig: {
            apiUrl: aiConfig.apiUrl || undefined,
            apiKey: aiConfig.apiKey || undefined,
            model: aiConfig.model || undefined,
          },
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        appendToLast(`\n\nError: ${err.error ?? res.statusText}`)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.content) appendToLast(parsed.content)
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        appendToLast(`\n\nError: ${err.message}`)
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
    setStreaming(false)
  }

  return (
    <div className="flex h-full flex-col">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <BotIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Ask me anything about your code.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto py-2">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex items-end gap-2 border-t bg-muted/20 p-2 backdrop-blur-sm">
        <Textarea
          placeholder="Ask about your code..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          className="min-h-[36px] max-h-[120px] resize-none text-xs"
          rows={1}
        />
        <div className="flex flex-col items-end gap-1">
          {contextTokens > 0 && (
            <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
              ~{formatTokenCount(contextTokens)} / {formatTokenCount(maxTokens)}
            </span>
          )}
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={clearMessages}>
                <Trash2Icon className="size-3.5" />
              </Button>
            )}
            {isStreaming ? (
              <Button size="xs" variant="outline" onClick={stop}>
                Stop
              </Button>
            ) : (
              <Button size="icon-xs" onClick={send} disabled={!input.trim()}>
                <SendIcon className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
