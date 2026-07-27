import { rename } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { NextResponse } from "next/server"
import { assertWithinWorkspace, getWorkspaceRoot } from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const { path, newName }: { path: string; newName: string } = await request.json()
    if (!path || !newName) return NextResponse.json({ error: "path and newName required" }, { status: 400 })
    const absPath = assertWithinWorkspace(path)
    const parent = dirname(absPath)
    const absNewPath = resolve(parent, newName)
    const root = getWorkspaceRoot()
    if (!absNewPath.startsWith(root!)) {
      return NextResponse.json({ error: "Path outside workspace" }, { status: 400 })
    }
    await rename(absPath, absNewPath)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
