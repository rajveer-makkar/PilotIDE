import { NextResponse } from "next/server"
import { git } from "@/lib/utils/git"
import { getWorkspaceRoot } from "@/lib/utils/path-security"

export async function POST(request: Request) {
  try {
    const root = getWorkspaceRoot()
    if (!root) return NextResponse.json({ error: "no workspace" }, { status: 400 })
    const { message } = await request.json()
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "commit message required" }, { status: 400 })
    }
    await git(["commit", "-m", message], root)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
