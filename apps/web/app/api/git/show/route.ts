import { NextResponse } from "next/server"
import { git } from "@/lib/utils/git"
import { getWorkspaceRoot, assertWithinWorkspace } from "@/lib/utils/path-security"

export async function GET(request: Request) {
  try {
    const root = getWorkspaceRoot()
    if (!root) return NextResponse.json({ error: "no workspace" }, { status: 400 })
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")
    if (!path) return NextResponse.json({ error: "path required" }, { status: 400 })
    assertWithinWorkspace(path)
    const output = await git(["show", `HEAD:${path}`], root)
    return NextResponse.json({ content: output })
  } catch {
    return NextResponse.json({ content: "" })
  }
}
