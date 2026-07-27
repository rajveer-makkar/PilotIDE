import { NextResponse } from "next/server"
import { createSession } from "@/lib/utils/terminal-manager"

export async function POST(request: Request) {
  const { shell } = await request.json().catch(() => ({ shell: "" }))
  const id = createSession(shell || undefined)
  return NextResponse.json({ id })
}
