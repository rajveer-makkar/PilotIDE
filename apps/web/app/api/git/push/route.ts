import { NextResponse } from "next/server"
import { git } from "@/lib/utils/git"
import { getWorkspaceRoot } from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const root = getWorkspaceRoot()
    if (!root) return NextResponse.json({ error: "no workspace" }, { status: 400 })
    const { remote, branch } = await request.json()
    const args = ["push", remote || "origin", branch || "HEAD"]
    await git(args, root)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
