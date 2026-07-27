import { NextResponse } from "next/server"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { getWorkspaceRoot } from "@/lib/utils/path-security"

const exec = promisify(execFile)

export interface SearchMatch {
  file: string
  line: number
  content: string
}

export async function GET(request: Request) {
  try {
    const root = getWorkspaceRoot()
    if (!root) return NextResponse.json({ error: "no workspace" }, { status: 400 })
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    if (!query) return NextResponse.json({ matches: [] })
    const regex = searchParams.get("regex") === "true"
    const caseSensitive = searchParams.get("caseSensitive") === "true"

    const args = ["-rn", "--no-color"]
    if (!caseSensitive) args.push("-i")
    if (regex) args.push("-E")
    args.push("--exclude-dir=node_modules", "--exclude-dir=.git", "--exclude-dir=.next", "--exclude-dir=dist", "--exclude-dir=build", "--exclude-dir=coverage")
    args.push(query, root)

    const { stdout } = await exec("grep", args, { timeout: 10000 }).catch(() => ({ stdout: "" }))
    const matches: SearchMatch[] = []
    for (const line of stdout.split("\n")) {
      if (!line.trim()) continue
      const relative = line.slice(root.length + 1)
      const sep1 = relative.indexOf(":")
      const sep2 = relative.indexOf(":", sep1 + 1)
      if (sep1 === -1 || sep2 === -1) continue
      matches.push({
        file: relative.slice(0, sep1),
        line: Number.parseInt(relative.slice(sep1 + 1, sep2), 10),
        content: relative.slice(sep2 + 1).trim(),
      })
    }
    return NextResponse.json({ matches })
  } catch {
    return NextResponse.json({ matches: [] })
  }
}
