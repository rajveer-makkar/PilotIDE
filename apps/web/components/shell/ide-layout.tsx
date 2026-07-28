"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import {
  FilesIcon,
  GitBranchIcon,
  SearchIcon,
  SettingsIcon,
  TerminalIcon,
  PanelLeftIcon,
  PanelRightIcon,
  BotIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useLayoutStore, type ActivityTab } from "@/stores/layout.store"
import { ProjectSelector } from "@/components/explorer/project-selector"
import { FileTree } from "@/components/explorer/file-tree"
import { EditorTabs } from "@/components/editor/editor-tabs"
import { CodeEditor } from "@/components/editor/code-editor"
import { GitPanel } from "@/components/git/git-panel"
import { SearchPanel } from "@/components/search/search-panel"
import { TerminalPanel } from "@/components/terminal/terminal-panel"
import { ProblemsPanel } from "@/components/problems/problems-panel"
import { OutputPanel } from "@/components/output/output-panel"
import { ChatPanel } from "@/components/ai/chat-panel"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { CommandPalette } from "@/components/command/command-palette"
import { TabBar, type Tab } from "@/components/ui/tab-bar"
import { useCommandStore, type Command } from "@/stores/command.store"
import { useEditorSettings } from "@/stores/editor-settings.store"
import { useEditorStore } from "@/stores/editor.store"

const activityItems: {
  tab: ActivityTab
  icon: typeof FilesIcon
  label: string
}[] = [
  { tab: "explorer", icon: FilesIcon, label: "Explorer" },
  { tab: "search", icon: SearchIcon, label: "Search" },
  { tab: "git", icon: GitBranchIcon, label: "Source Control" },
]

const sidebarTitle: Record<ActivityTab, string> = {
  explorer: "Explorer",
  search: "Search",
  git: "Source Control",
  terminal: "Terminal",
  settings: "Settings",
  chat: "AI Chat",
}

function ActivityBar({
  activeTab,
  onTabChange,
}: {
  activeTab: ActivityTab
  onTabChange: (t: ActivityTab) => void
}) {
  return (
    <TooltipProvider>
      <nav className="flex w-[48px] shrink-0 flex-col items-center gap-1 border-r bg-muted/60 py-2 backdrop-blur-sm">
        {activityItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.tab
          return (
            <Tooltip key={item.tab}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  data-active={isActive}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => onTabChange(item.tab)}
                >
                  <Icon className="size-5" />
                  <span className="sr-only">{item.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          )
        })}
        <Separator className="my-1 w-6" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => useLayoutStore.getState().toggleChat()}
            >
              <BotIcon className="size-5" />
              <span className="sr-only">AI Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">AI Chat</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                const s = useLayoutStore.getState()
                if (!s.bottomOpen) s.toggleBottom()
                s.setBottomTab("terminal")
              }}
            >
              <TerminalIcon className="size-5" />
              <span className="sr-only">Terminal</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Terminal</TooltipContent>
        </Tooltip>
        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  activeTab === "settings" && "bg-accent text-accent-foreground"
                )}
                onClick={() => onTabChange("settings")}
              >
                <SettingsIcon className="size-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  )
}

function StatusBar() {
  const [branch, setBranch] = useState("")
  const workspaceRoot = useLayoutStore((s) => s.workspaceRoot)
  const workspaceName = useLayoutStore((s) => s.workspaceName)
  const dirHandle = useLayoutStore((s) => s.dirHandle)
  useEffect(() => {
    if (dirHandle) {
      ;(async () => {
        try {
          const gitDir = await dirHandle.getDirectoryHandle(".git", {
            create: false,
          })
          const headFile = await gitDir.getFileHandle("HEAD", { create: false })
          const file = await headFile.getFile()
          const text = await file.text()
          setBranch(text.match(/^ref: refs\/heads\/(.+)$/m)?.[1] ?? "")
        } catch {
          setBranch("")
        }
      })()
      return
    }
    if (!workspaceRoot) return
    fetch("/api/git/status")
      .then((r) => r.json())
      .then((d) => setBranch(d.branch ?? ""))
      .catch(() => {})
  }, [workspaceRoot, dirHandle])
  return (
    <footer className="flex h-[22px] shrink-0 items-center border-t bg-muted/70 px-3 text-[11px] text-muted-foreground backdrop-blur-sm">
      {workspaceName && <span className="mr-2">{workspaceName}</span>}
      {branch && (
        <span className="flex items-center gap-1">
          <GitBranchIcon className="size-3" /> {branch}
        </span>
      )}
      <span className="ml-auto">Ln 1, Col 1</span>
      <span className="ml-4">TypeScript</span>
      <span className="ml-4">UTF-8</span>
      <span className="ml-4">Spaces: 2</span>
    </footer>
  )
}

function SidebarPanel({ activeTab }: { activeTab: ActivityTab }) {
  const workspaceRoot = useLayoutStore((s) => s.workspaceRoot)
  const workspaceName = useLayoutStore((s) => s.workspaceName)
  const dirHandle = useLayoutStore((s) => s.dirHandle)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[36px] shrink-0 items-center gap-2 border-b bg-muted/30 px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase backdrop-blur-sm">
        {sidebarTitle[activeTab]}
        {workspaceName && activeTab === "explorer" && (
          <span className="truncate text-[11px] font-normal normal-case opacity-60">
            {workspaceName}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-auto">
        {activeTab === "explorer" &&
          (workspaceRoot || dirHandle ? (
            <FileTree rootPath={workspaceRoot ?? ""} />
          ) : (
            <ProjectSelector />
          ))}
        {activeTab === "search" && <SearchPanel />}
        {activeTab === "git" && (workspaceRoot ? <GitPanel /> : null)}
        {activeTab === "settings" && <SettingsPanel />}
      </div>
    </div>
  )
}

export function IDELayout() {
  const {
    activeTab,
    sidebarOpen,
    bottomOpen,
    bottomTab,
    chatOpen,
    workspaceRoot,
    setActiveTab,
    toggleSidebar,
    toggleBottom,
  } = useLayoutStore()
  const register = useCommandStore((s) => s.register)
  const setBottomTab = useLayoutStore((s) => s.setBottomTab)
  const toggleChat = useLayoutStore((s) => s.toggleChat)
  const toggleCmd = useCommandStore((s) => s.toggle)

  useEffect(() => {
    const cmds: Command[] = [
      {
        id: "toggle.sidebar",
        label: "Toggle Sidebar",
        keybinding: "Ctrl+B",
        handler: toggleSidebar,
      },
      {
        id: "toggle.bottom",
        label: "Toggle Bottom Panel",
        keybinding: "Ctrl+J",
        handler: toggleBottom,
      },
      { id: "toggle.chat", label: "Toggle AI Chat", handler: toggleChat },
      {
        id: "show.terminal",
        label: "Show Terminal",
        handler: () => {
          toggleBottom()
          setBottomTab("terminal")
        },
      },
      {
        id: "show.problems",
        label: "Show Problems",
        handler: () => {
          toggleBottom()
          setBottomTab("problems")
        },
      },
      {
        id: "show.output",
        label: "Show Output",
        handler: () => {
          toggleBottom()
          setBottomTab("output")
        },
      },
      {
        id: "show.explorer",
        label: "Show Explorer",
        handler: () => setActiveTab("explorer"),
      },
      {
        id: "show.search",
        label: "Show Search",
        handler: () => setActiveTab("search"),
      },
      {
        id: "show.git",
        label: "Show Source Control",
        handler: () => setActiveTab("git"),
      },
      {
        id: "show.settings",
        label: "Show Settings",
        handler: () => setActiveTab("settings"),
      },
      {
        id: "toggle.minimap",
        label: "Toggle Minimap",
        handler: () =>
          useEditorSettings
            .getState()
            .setMinimap(!useEditorSettings.getState().minimap),
      },
    ]
    cmds.forEach((c) => register(c))
  }, [
    toggleSidebar,
    toggleBottom,
    toggleChat,
    setBottomTab,
    setActiveTab,
    register,
  ])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "p") {
        e.preventDefault()
        toggleCmd()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault()
        const { activePath, closeFile } = useEditorStore.getState()
        if (activePath) closeFile(activePath)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [toggleCmd])

  return (
    <>
      <CommandPalette />
      <div className="flex h-dvh flex-col bg-background/80 text-foreground backdrop-blur-sm">
        <div className="flex flex-1 overflow-hidden">
          <ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />

          <ResizablePanelGroup orientation="horizontal" className="flex-1">
            {sidebarOpen && (
              <>
                <ResizablePanel defaultSize={300} minSize={10}>
                  <SidebarPanel activeTab={activeTab} />
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            <ResizablePanel minSize={30}>
              <ResizablePanelGroup orientation="vertical">
                <ResizablePanel defaultSize={75} minSize={20}>
                  <div className="flex h-full flex-col">
                    <div className="flex shrink-0 items-center border-b bg-muted/30 backdrop-blur-sm">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="ml-1 shrink-0 text-muted-foreground"
                        onClick={toggleSidebar}
                      >
                        <PanelLeftIcon className="size-4" />
                        <span className="sr-only">Toggle Sidebar</span>
                      </Button>
                      <EditorTabs />
                    </div>
                    <CodeEditor workspaceRoot={workspaceRoot} />
                  </div>
                </ResizablePanel>

                {bottomOpen && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={45} minSize={10}>
                      <div className="flex h-full flex-col">
                        <div className="flex h-[35px] items-center border-b bg-muted/30 px-0 backdrop-blur-sm">
                          <TabBar
                            tabs={[
                              { id: "terminal", label: "TERMINAL" },
                              { id: "problems", label: "PROBLEMS" },
                              { id: "output", label: "OUTPUT" },
                            ]}
                            activeId={bottomTab}
                            onChange={(id) => useLayoutStore.getState().setBottomTab(id as any)}
                            size="sm"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="ml-auto text-muted-foreground"
                            onClick={toggleBottom}
                          >
                            <PanelRightIcon className="size-4 rotate-90" />
                            <span className="sr-only">Toggle Panel</span>
                          </Button>
                        </div>
                        <div className="flex flex-1 flex-col">
                          {bottomTab === "terminal" && <TerminalPanel />}
                          {bottomTab === "problems" && <ProblemsPanel />}
                          {bottomTab === "output" && <OutputPanel />}
                        </div>
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {chatOpen && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={400} minSize={12}>
                  <div className="flex h-full flex-col">
                    <div className="flex h-[36px] shrink-0 items-center gap-2 border-b bg-muted/30 px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase backdrop-blur-sm">
                      AI Chat
                    </div>
                    <ChatPanel />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        <StatusBar />
      </div>
    </>
  )
}
