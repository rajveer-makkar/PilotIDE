import { readdir, stat } from "node:fs/promises"
import { NextResponse } from "next/server"
import { assertWithinWorkspace } from "@/lib/utils/path-security"

const IGNORED = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", ".venv", "__pycache__"])

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reqPath = searchParams.get("path") || ""
    const absPath = assertWithinWorkspace(reqPath)
    const entries = await readdir(absPath, { withFileTypes: true })
    const files = await Promise.all(
      entries
        .filter((e) => !IGNORED.has(e.name) && !e.name.startsWith("."))
        .map(async (e) => {
          const fullPath = `${absPath}/${e.name}`
          let size = 0
          let modified = ""
          try {
            const s = await stat(fullPath)
            size = s.size
            modified = s.mtime.toISOString()
          } catch { /* stat can fail on symlinks or permissions */ }
          return {
            name: e.name,
            path: reqPath ? `${reqPath}/${e.name}` : e.name,
            type: e.isDirectory() ? "directory" as const : "file" as const,
            size,
            modified,
          }
        })
    )
    files.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return NextResponse.json({ files })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
