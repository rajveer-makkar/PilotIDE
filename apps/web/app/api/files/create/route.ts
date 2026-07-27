import { mkdir, writeFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { assertWithinWorkspace } from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const { path, type }: { path: string; type: "file" | "directory" } = await request.json()
    if (!path) return NextResponse.json({ error: "path required" }, { status: 400 })
    const absPath = assertWithinWorkspace(path)
    if (type === "directory") {
      await mkdir(absPath, { recursive: true })
    } else {
      await writeFile(absPath, "", "utf-8")
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
