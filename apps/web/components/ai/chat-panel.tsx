"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { useChatStore, type ChatMessage } from "@/stores/chat.store"
import { useAISettings } from "@/stores/ai-settings.store"
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
        <span className="whitespace-pre-wrap">{msg.content}</span>
      </div>
    </div>
  )
}

export function ChatPanel() {
  const { messages, isStreaming, addMessage, appendToLast, setStreaming, clearMessages } = useChatStore()
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
      const apiMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
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
  )
}
