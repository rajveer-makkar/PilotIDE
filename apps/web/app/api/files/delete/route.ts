import { rm } from "node:fs/promises"
import { NextResponse } from "next/server"
import { assertWithinWorkspace } from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const { path }: { path: string } = await request.json()
    if (!path) return NextResponse.json({ error: "path required" }, { status: 400 })
    const absPath = assertWithinWorkspace(path)
    await rm(absPath, { recursive: true, force: true })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
