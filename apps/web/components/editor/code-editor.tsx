"use client"

import dynamic from "next/dynamic"
import { useCallback } from "react"
import { useEditorStore } from "@/stores/editor.store"

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false })

function langFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  if (ext === "ts" || ext === "tsx") return "typescript"
  if (ext === "js" || ext === "jsx") return "javascript"
  if (ext === "css" || ext === "scss" || ext === "less") return "css"
  if (ext === "json") return "json"
  if (ext === "md" || ext === "mdx") return "markdown"
  if (ext === "html") return "html"
  if (ext === "py") return "python"
  if (ext === "rs") return "rust"
  if (ext === "go") return "go"
  if (ext === "rb") return "ruby"
  if (ext === "php") return "php"
  if (ext === "yaml" || ext === "yml") return "yaml"
  if (ext === "xml") return "xml"
  if (ext === "sh" || ext === "bash" || ext === "zsh") return "shell"
  if (ext === "sql") return "sql"
  if (ext === "graphql" || ext === "gql") return "graphql"
  return "plaintext"
}

export function CodeEditor() {
  const activePath = useEditorStore((s) => s.activePath)
  const files = useEditorStore((s) => s.files)
  const updateContent = useEditorStore((s) => s.updateContent)
  const saveCurrent = useEditorStore((s) => s.saveCurrent)

  const file = activePath ? files[activePath] : null

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activePath && value !== undefined) {
        updateContent(activePath, value)
      }
    },
    [activePath, updateContent]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        saveCurrent()
      }
    },
    [saveCurrent]
  )

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Open a file to start editing</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1" onKeyDown={handleKeyDown}>
      <Monaco
        key={file.path}
        defaultLanguage={langFromPath(file.path)}
        defaultValue={file.originalContent}
        theme="vs-dark"
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: "off",
          automaticLayout: true,
        }}
      />
    </div>
  )
}
