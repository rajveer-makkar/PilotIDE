import { NextResponse } from "next/server"
import { destroySession } from "@/lib/utils/terminal-manager"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  destroySession(id)
  return NextResponse.json({ ok: true })
}
