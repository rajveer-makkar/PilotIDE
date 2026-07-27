import { writeFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { assertWithinWorkspace } from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const { path, content } = await request.json()
    if (!path || typeof content !== "string") {
      return NextResponse.json({ error: "path and content required" }, { status: 400 })
    }
    const absPath = assertWithinWorkspace(path)
    await writeFile(absPath, content, "utf-8")
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
