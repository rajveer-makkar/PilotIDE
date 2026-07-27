import { execFile } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execFile)

export async function git(args: string[], cwd: string) {
  const { stdout } = await exec("git", args, { cwd })
  return stdout
}

export interface GitFile {
  path: string
  staged: boolean
  status: "added" | "modified" | "deleted" | "renamed" | "untracked"
}

export function parseStatus(raw: string): { branch: string; files: GitFile[] } {
  const lines = raw.split("\n").filter((l): l is string => !!l)
  const branch = lines[0]?.replace("## ", "").split(" ")[0] ?? "unknown"
  const files: GitFile[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!
    if (line.startsWith("??")) {
      files.push({ path: line.slice(3), staged: false, status: "untracked" })
      continue
    }
    const staged = line[0] !== " "
    const unstaged = line[1] !== " "
    if (staged || unstaged) {
      const path = line.slice(3)
      const code = staged ? line[0] : line[1]
      const status = code === "M" ? "modified" : code === "A" ? "added" : code === "D" ? "deleted" : code === "R" ? "renamed" : "modified"
      files.push({ path, staged: staged && !unstaged, status })
    }
  }
  return { branch, files }
}
