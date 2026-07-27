import { NextResponse } from "next/server"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

const API_URL = process.env.AI_API_URL ?? "https://api.openai.com/v1"
const API_KEY = process.env.AI_API_KEY ?? ""
const MODEL = process.env.AI_MODEL ?? "gpt-4o-mini"

export async function POST(request: Request) {
  const { messages, model }: { messages: Message[]; model?: string } = await request.json()

  if (!API_KEY) {
    return NextResponse.json({ error: "AI_API_KEY not configured" }, { status: 400 })
  }

  const systemMsg: Message = {
    role: "system",
    content:
      "You are a coding assistant in an IDE. Help the user write, debug, and understand code. Be concise and provide working solutions.",
  }

  const body = JSON.stringify({
    model: model ?? MODEL,
    messages: [systemMsg, ...messages],
    stream: true,
  })

  const res = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `AI API error: ${res.status} ${err}` }, { status: 502 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === "data: [DONE]") continue
            if (!trimmed.startsWith("data: ")) continue

            try {
              const parsed = JSON.parse(trimmed.slice(6))
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`))
              }
            } catch {
              /* skip malformed chunks */
            }
          }
        }
      } catch {
        /* stream cancelled */
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  })
}
