import { NextResponse } from "next/server"
import { resolveAiApiUrl } from "@/lib/utils/api-security"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

const ENV_API_KEY = process.env.AI_API_KEY ?? ""
const ENV_MODEL = process.env.AI_MODEL ?? "gpt-4o-mini"

export async function POST(request: Request) {
  const {
    messages,
    model: bodyModel,
    aiConfig,
  }: {
    messages: Message[]
    model?: string
    aiConfig?: { apiUrl?: string; apiKey?: string; model?: string }
  } = await request.json()

  const apiUrl = resolveAiApiUrl(aiConfig?.apiUrl)
  const apiKey = aiConfig?.apiKey || ENV_API_KEY
  const model = bodyModel || aiConfig?.model || ENV_MODEL

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI_API_KEY not configured" },
      { status: 400 }
    )
  }

  const systemMsg: Message = {
    role: "system",
    content:
      "You are a coding assistant in an IDE. Help the user write, debug, and understand code. Be concise and provide working solutions.",
  }

  const body = JSON.stringify({
    model,
    messages: [systemMsg, ...messages],
    stream: true,
  })

  const endpoint = new URL("/chat/completions", `${apiUrl}/`).toString()
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json(
      { error: `AI API error: ${res.status} ${err}` },
      { status: 502 }
    )
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
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ content: delta })}\n\n`
                  )
                )
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
