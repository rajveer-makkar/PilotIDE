import { stat } from "node:fs/promises"
import { NextResponse } from "next/server"
import { setWorkspaceRoot, getWorkspaceRoot } from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const { path } = await request.json()
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "path required" }, { status: 400 })
    }
    const stats = await stat(path)
    if (!stats.isDirectory()) {
      return NextResponse.json({ error: "not a directory" }, { status: 400 })
    }
    setWorkspaceRoot(path)
    return NextResponse.json({ root: path, name: path.split("/").pop() || path })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function GET() {
  const root = getWorkspaceRoot()
  if (!root) return NextResponse.json({ root: null })
  return NextResponse.json({ root, name: root.split("/").pop() || root })
}
