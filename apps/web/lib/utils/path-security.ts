import { realpath } from "node:fs/promises"
import { isAbsolute, relative, resolve } from "node:path"

let _workspaceRoot = ""

function isOutside(base: string, requested: string) {
  const rel = relative(base, requested)
  return rel.startsWith("..") || isAbsolute(rel)
}

export async function setWorkspaceRoot(root: string) {
  _workspaceRoot = await realpath(root)
}

export function getWorkspaceRoot() {
  return _workspaceRoot
}

export function assertWithinWorkspace(requested: string) {
  if (!_workspaceRoot) throw new Error("No workspace open")
  const abs = resolve(_workspaceRoot, requested)
  if (isOutside(_workspaceRoot, abs)) {
    throw new Error(`Path outside workspace: ${requested}`)
  }
  return abs
}

export async function assertWorkspaceDirectory(requested: string) {
  if (!requested || typeof requested !== "string") {
    throw new Error("path required")
  }
  if (requested.includes("\0")) {
    throw new Error("invalid path")
  }
  return realpath(requested)
}
