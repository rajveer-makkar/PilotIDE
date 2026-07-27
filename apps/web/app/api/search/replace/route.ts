import { NextResponse } from "next/server"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { getWorkspaceRoot } from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const root = getWorkspaceRoot()
    if (!root) return NextResponse.json({ error: "no workspace" }, { status: 400 })
    const { q, replacement, files } = await request.json()
    if (!q || replacement === undefined) return NextResponse.json({ error: "missing q or replacement" }, { status: 400 })

    const targetFiles: string[] = files ?? []
    const replaced: { file: string; count: number }[] = []

    for (const f of targetFiles) {
      const fullPath = path.join(root, f)
      const content = await readFile(fullPath, "utf-8")
      const newContent = content.replaceAll(q, replacement)
      if (newContent !== content) {
        await writeFile(fullPath, newContent, "utf-8")
        const count = content.split(q).length - 1
        replaced.push({ file: f, count })
      }
    }

    return NextResponse.json({ replaced })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
