import { randomUUID } from "node:crypto"
import { homedir } from "node:os"
import { getWorkspaceRoot } from "./path-security"

// ponytail: minimal node-pty interface, full types when needed
interface PtyTerminal {
  onData(cb: (data: string) => void): void
  onExit(cb: (result: { exitCode: number }) => void): void
  write(data: string): void
  kill(signal?: string): void
  resize(cols: number, rows: number): void
}

function loadPty(): (file: string, args: string[], options: {
  name: string; cwd?: string; env?: Record<string, string | undefined>; cols: number; rows: number
}) => PtyTerminal {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("node-pty").spawn
}

type OutputCallback = (data: string) => void
type ExitCallback = (code: number | null) => void

interface Session {
  process: PtyTerminal
  onOutput: OutputCallback | null
  onExit: ExitCallback | null
  buffer: string[]
}

const sessions = new Map<string, Session>()
const ptySpawn = loadPty()

export function createSession(shell?: string): string {
  const root = getWorkspaceRoot()
  const id = randomUUID()
  const term = ptySpawn(shell || process.env.SHELL || "/bin/bash", [], {
    name: "xterm-256color",
    cwd: root || homedir(),
    env: { ...process.env, TERM: "xterm-256color" },
    cols: 80,
    rows: 24,
  })
  const session: Session = { process: term, onOutput: null, onExit: null, buffer: [] }
  term.onData((data: string) => {
    if (session.onOutput) session.onOutput(data)
    else session.buffer.push(data)
  })
  term.onExit(({ exitCode }: { exitCode: number }) => {
    session.onExit?.(exitCode)
    sessions.delete(id)
  })
  sessions.set(id, session)
  return id
}

export function getSession(id: string) {
  const s = sessions.get(id)
  return s
}

export function writeInput(id: string, data: string) {
  const s = sessions.get(id)
  if (s) s.process.write(data)
}

export function resizeSession(id: string, cols: number, rows: number) {
  const s = sessions.get(id)
  if (s) s.process.resize(cols, rows)
}

export function destroySession(id: string) {
  const s = sessions.get(id)
  if (s) {
    s.process.kill()
    sessions.delete(id)
  }
}
