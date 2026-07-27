import { NextResponse } from "next/server"
import { git } from "@/lib/utils/git"
import { getWorkspaceRoot, assertWithinWorkspace } from "@/lib/utils/path-security"

export async function GET(request: Request) {
  try {
    const root = getWorkspaceRoot()
    if (!root) return NextResponse.json({ error: "no workspace" }, { status: 400 })
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")
    const cached = searchParams.get("cached") === "true"
    const args = ["diff", "--no-color"]
    if (cached) args.push("--cached")
    if (path) {
      assertWithinWorkspace(path)
      args.push("--", path)
    }
    const output = await git(args, root)
    return NextResponse.json({ diff: output })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
