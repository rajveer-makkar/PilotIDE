import { NextResponse } from "next/server"
import { writeInput } from "@/lib/utils/terminal-manager"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await request.json()
  writeInput(id, data)
  return NextResponse.json({ ok: true })
}
