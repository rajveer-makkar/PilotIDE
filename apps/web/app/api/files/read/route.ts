import { readFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { assertWithinWorkspace } from "@/lib/utils/path-security"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reqPath = searchParams.get("path")
    if (!reqPath) return NextResponse.json({ error: "path required" }, { status: 400 })
    const absPath = assertWithinWorkspace(reqPath)
    const content = await readFile(absPath, "utf-8")
    return NextResponse.json({ content })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
