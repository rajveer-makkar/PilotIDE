import { NextResponse } from "next/server"
import { git } from "@/lib/utils/git"
import { getWorkspaceRoot, assertWithinWorkspace } from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const root = getWorkspaceRoot()
    if (!root) return NextResponse.json({ error: "no workspace" }, { status: 400 })
    const { paths } = await request.json()
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: "paths array required" }, { status: 400 })
    }
    const safe = paths.map((p: string) => assertWithinWorkspace(p))
    await git(["add", "--", ...safe], root)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
