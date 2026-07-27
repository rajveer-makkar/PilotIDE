import { resolve, relative } from "node:path"

let _workspaceRoot = ""

export function setWorkspaceRoot(root: string) {
  _workspaceRoot = root
}

export function getWorkspaceRoot() {
  return _workspaceRoot
}

export function assertWithinWorkspace(requested: string) {
  if (!_workspaceRoot) throw new Error("No workspace open")
  const abs = resolve(_workspaceRoot, requested)
  const rel = relative(_workspaceRoot, abs)
  if (rel.startsWith("..") || resolve(rel) === rel) throw new Error(`Path outside workspace: ${requested}`)
  return abs
}
