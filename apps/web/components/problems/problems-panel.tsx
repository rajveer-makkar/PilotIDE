"use client"

import { useProblemsStore, type Problem } from "@/stores/problems.store"
import { useEditorStore } from "@/stores/editor.store"
import { FileIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const severityIcon = {
  error: AlertCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
}

const severityColor = {
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
}

function ProblemRow({ problem }: { problem: Problem }) {
  const openFile = useEditorStore((s) => s.openFile)

  async function handleClick() {
    const res = await fetch(`/api/files/read?path=${encodeURIComponent(problem.file)}`)
    const data = await res.json()
    if (data.content !== undefined) openFile(problem.file, problem.file.split("/").pop() ?? problem.file, data.content)
  }

  const Icon = severityIcon[problem.severity]

  return (
    <button
      className="flex w-full items-start gap-2 px-3 py-1 text-xs hover:bg-accent"
      onClick={handleClick}
    >
      <Icon className={cn("mt-0.5 size-3.5 shrink-0", severityColor[problem.severity])} />
      <span className="truncate text-foreground/80">{problem.message}</span>
      <span className="ml-auto shrink-0 text-muted-foreground">
        {problem.file.split("/").pop()}:{problem.line}:{problem.column}
      </span>
    </button>
  )
}

export function ProblemsPanel() {
  const problems = useProblemsStore((s) => s.problems)

  const grouped = problems.reduce<Record<string, Problem[]>>((acc, p) => {
    ;(acc[p.file] ??= []).push(p)
    return acc
  }, {})

  if (problems.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-muted-foreground">No problems detected</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {Object.entries(grouped).map(([file, fileProblems]) => (
        <div key={file}>
          <div className="flex items-center gap-1 px-3 py-1 text-[11px] text-muted-foreground">
            <FileIcon className="size-3 shrink-0" />
            <span className="truncate">{file}</span>
            <span className="ml-auto">{fileProblems.length}</span>
          </div>
          {fileProblems.map((p, i) => (
            <ProblemRow key={`${p.file}-${p.line}-${p.column}-${i}`} problem={p} />
          ))}
        </div>
      ))}
    </div>
  )
}
