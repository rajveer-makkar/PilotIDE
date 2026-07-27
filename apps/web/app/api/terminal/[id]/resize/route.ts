import { NextResponse } from "next/server"
import { resizeSession } from "@/lib/utils/terminal-manager"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { cols, rows } = await request.json()
  resizeSession(id, cols, rows)
  return NextResponse.json({ ok: true })
}
