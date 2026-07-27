"use client"

import dynamic from "next/dynamic"
import { useCallback, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { useEditorStore } from "@/stores/editor.store"
import { useProblemsStore } from "@/stores/problems.store"
import { useDiffStore } from "@/stores/diff.store"
import { useEditorSettings } from "@/stores/editor-settings.store"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeftIcon, EyeIcon, EditIcon } from "lucide-react"
import { WelcomePanel } from "@/components/welcome/welcome-panel"
import { MarkdownPreview } from "./markdown-preview"

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), { ssr: false })
const MonacoDiffEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.DiffEditor), { ssr: false })

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

function BreadcrumbBar({ path, showPreview, onTogglePreview }: { path: string; showPreview?: boolean; onTogglePreview?: () => void }) {
  const segments = path.split("/")
  const isMd = path.endsWith(".md") || path.endsWith(".mdx")
  return (
    <div className="flex h-[22px] shrink-0 items-center gap-1 border-b bg-muted/20 px-3 text-[11px] text-muted-foreground backdrop-blur-sm">
      {segments.map((s, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-40">/</span>}
          <span className={i === segments.length - 1 ? "text-foreground" : ""}>{s}</span>
        </span>
      ))}
      {isMd && onTogglePreview && (
        <button
          className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] hover:bg-accent"
          onClick={onTogglePreview}
        >
          {showPreview ? <EditIcon className="size-3" /> : <EyeIcon className="size-3" />}
          {showPreview ? "Edit" : "Preview"}
        </button>
      )}
    </div>
  )
}

interface CodeEditorProps {
  workspaceRoot?: string | null
}

export function CodeEditor({ workspaceRoot }: CodeEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const activePath = useEditorStore((s) => s.activePath)
  const files = useEditorStore((s) => s.files)
  const updateContent = useEditorStore((s) => s.updateContent)
  const saveCurrent = useEditorStore((s) => s.saveCurrent)
  const setProblems = useProblemsStore((s) => s.setProblems)
  const { diffFile, original, modified, closeDiff } = useDiffStore()
  const { minimap, formatOnSave, autoSave } = useEditorSettings()
  const { resolvedTheme } = useTheme()
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs"
  const editorRef = useRef<any>(null)

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
        if (formatOnSave && editorRef.current) {
          editorRef.current.getAction("editor.action.formatDocument")?.run()
        }
        saveCurrent()
      }
    },
    [saveCurrent, formatOnSave]
  )

  const handleMount = useCallback(
    (_editor: any, monaco: any) => {
      editorRef.current = _editor
      _editor.onDidBlurEditorText(() => {
        if (autoSave && activePath) saveCurrent()
      })
      monaco.editor.onDidChangeMarkers(() => {
        const markers = monaco.editor.getModelMarkers({})
        const problems = markers
          .filter((m: any) => m.severity >= 4)
          .map((m: any) => ({
            file: (m.resource?.path ?? "").replace(/^\//, ""),
            line: m.startLineNumber,
            column: m.startColumn,
            message: m.message,
            severity: m.severity === 8 ? "error" as const : m.severity === 4 ? "warning" as const : "info" as const,
          }))
        setProblems(problems)
      })
    },
    [setProblems]
  )

  if (diffFile) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex h-[35px] items-center gap-2 border-b bg-muted/30 px-2 text-xs backdrop-blur-sm">
          <Button variant="ghost" size="icon-xs" onClick={closeDiff}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <span className="text-muted-foreground">Diff:</span>
          <span className="font-medium">{diffFile}</span>
        </div>
        <div className="flex flex-1">
          <MonacoDiffEditor
            original={original}
            modified={modified}
            language={langFromPath(diffFile)}
            theme={monacoTheme}
            options={{
              fontSize: 13,
              minimap: { enabled: minimap },
              bracketPairColorization: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    )
  }

  if (!file) {
    if (!workspaceRoot) return <WelcomePanel />
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Open a file to start editing</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col" onKeyDown={handleKeyDown}>
      <BreadcrumbBar path={file.path} showPreview={showPreview} onTogglePreview={() => setShowPreview(!showPreview)} />
      <div className="flex flex-1">
        {showPreview ? (
          <MarkdownPreview content={file.content} />
        ) : (
          <MonacoEditor
            key={file.path}
            defaultLanguage={langFromPath(file.path)}
            defaultValue={file.originalContent}
            theme={monacoTheme}
            onChange={handleChange}
            onMount={handleMount}
            options={{
              minimap: { enabled: minimap },
              bracketPairColorization: { enabled: true },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: "off",
              automaticLayout: true,
            }}
          />
        )}
      </div>
    </div>
  )
}
