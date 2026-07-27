import { NextResponse } from "next/server"
import { createSession } from "@/lib/utils/terminal-manager"

export async function POST() {
  const id = createSession()
  return NextResponse.json({ id })
}
