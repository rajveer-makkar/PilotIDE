import { NextResponse } from "next/server"
import { git, parseStatus } from "@/lib/utils/git"
import { getWorkspaceRoot } from "@/lib/utils/path-security"

export async function GET() {
  try {
    const root = getWorkspaceRoot()
    if (!root) return NextResponse.json({ error: "no workspace" }, { status: 400 })
    const raw = await git(["status", "--porcelain", "-b"], root)
    return NextResponse.json(parseStatus(raw))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, branch: "unknown", files: [] }, { status: 500 })
  }
}
