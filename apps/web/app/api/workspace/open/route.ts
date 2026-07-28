import { stat } from "node:fs/promises"
import { NextResponse } from "next/server"
import {
  assertWorkspaceDirectory,
  getWorkspaceRoot,
  setWorkspaceRoot,
} from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const { path } = (await request.json()) as { path?: unknown }
    const safePath = await assertWorkspaceDirectory(path as string)
    const stats = await stat(safePath)
    if (!stats.isDirectory()) {
      return NextResponse.json({ error: "not a directory" }, { status: 400 })
    }
    await setWorkspaceRoot(safePath)
    return NextResponse.json({
      root: safePath,
      name: safePath.split("/").pop() || safePath,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function GET() {
  const root = getWorkspaceRoot()
  if (!root) return NextResponse.json({ root: null })
  return NextResponse.json({ root, name: root.split("/").pop() || root })
}
