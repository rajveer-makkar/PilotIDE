import { getSession, destroySession } from "@/lib/utils/terminal-manager"

function event(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = getSession(id)
  if (!session) return new Response("session not found", { status: 404 })

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of session.buffer) {
        controller.enqueue(encoder.encode(event({ type: "output", data: chunk })))
      }
      session.buffer = []

      session.onOutput = (data: string) => {
        if (closed) return
        try { controller.enqueue(encoder.encode(event({ type: "output", data }))) } catch { /* drop */ }
      }

      session.onExit = (code: number | null) => {
        if (closed) return
        closed = true
        try {
          controller.enqueue(encoder.encode(event({ type: "exit", code })))
          controller.close()
        } catch { /* stream closed */ }
      }
    },

    cancel() {
      closed = true
      destroySession(id)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  })
}
