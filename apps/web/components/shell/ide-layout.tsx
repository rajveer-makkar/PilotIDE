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
import { ChatPanel } from "@/components/ai/chat-panel"
import { SettingsPanel } from "@/components/settings/settings-panel"

const activityItems: { tab: ActivityTab; icon: typeof FilesIcon; label: string }[] = [
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

function ActivityBar({ activeTab, onTabChange }: { activeTab: ActivityTab; onTabChange: (t: ActivityTab) => void }) {
  return (
    <TooltipProvider>
      <nav className="flex w-[48px] shrink-0 flex-col items-center gap-1 border-r bg-muted py-2">
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
                    isActive && "bg-accent text-accent-foreground",
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
  useEffect(() => {
    if (!workspaceRoot) return
    fetch("/api/git/status").then(r => r.json()).then(d => setBranch(d.branch ?? "")).catch(() => {})
  }, [workspaceRoot])
  return (
    <footer className="flex h-[22px] shrink-0 items-center border-t bg-muted px-3 text-[11px] text-muted-foreground">
      {branch && <span className="flex items-center gap-1">
        <GitBranchIcon className="size-3" /> {branch}
      </span>}
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[35px] items-center gap-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {sidebarTitle[activeTab]}
        {workspaceName && activeTab === "explorer" && (
          <span className="truncate text-[11px] font-normal normal-case opacity-60">{workspaceName}</span>
        )}
      </div>
      <Separator />
      <div className="flex flex-1 flex-col overflow-auto">
        {activeTab === "explorer" && (
          workspaceRoot ? <FileTree rootPath={workspaceRoot} /> : <ProjectSelector />
        )}
        {activeTab === "search" && <SearchPanel />}
        {activeTab === "git" && (workspaceRoot ? <GitPanel /> : null)}
        {activeTab === "settings" && <SettingsPanel />}
      </div>
    </div>
  )
}

export function IDELayout() {
  const { activeTab, sidebarOpen, bottomOpen, bottomTab, chatOpen, setActiveTab, toggleSidebar, toggleBottom } =
    useLayoutStore()

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />

        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={18} minSize={10}>
                <SidebarPanel activeTab={activeTab} />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          <ResizablePanel minSize={30}>
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize={75} minSize={20}>
                <div className="flex h-full flex-col">
                  <div className="flex shrink-0 items-center border-b bg-muted/30">
                    <Button variant="ghost" size="icon-xs" className="ml-1 shrink-0 text-muted-foreground" onClick={toggleSidebar}>
                      <PanelLeftIcon className="size-4" />
                      <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                    <EditorTabs />
                  </div>
                  <CodeEditor />
                </div>
              </ResizablePanel>

              {bottomOpen && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={25} minSize={10}>
                    <div className="flex h-full flex-col">
                      <div className="flex h-[35px] items-center border-b bg-muted/30 px-2">
                        <div className="flex items-center gap-1 text-xs">
                          <button
                            className={cn(
                              "rounded px-2 py-1",
                              bottomTab === "terminal" && "bg-background"
                            )}
                            onClick={() => useLayoutStore.getState().setBottomTab("terminal")}
                          >
                            TERMINAL
                          </button>
                          <button
                            className={cn(
                              "rounded px-2 py-1",
                              bottomTab === "problems" && "bg-background"
                            )}
                            onClick={() => useLayoutStore.getState().setBottomTab("problems")}
                          >
                            PROBLEMS
                          </button>
                        </div>
                        <Button variant="ghost" size="icon-xs" className="ml-auto text-muted-foreground" onClick={toggleBottom}>
                          <PanelRightIcon className="size-4 rotate-90" />
                          <span className="sr-only">Toggle Panel</span>
                        </Button>
                      </div>
                      <div className="flex flex-1 flex-col">
                        {bottomTab === "terminal" && <TerminalPanel />}
                        {bottomTab === "problems" && (
                          <div className="flex flex-1 items-center justify-center">
                            <p className="text-xs text-muted-foreground">No problems detected</p>
                          </div>
                        )}
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
              <ResizablePanel defaultSize={22} minSize={12}>
                <div className="flex h-full flex-col">
                  <div className="flex h-[35px] items-center gap-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    AI Chat
                  </div>
                  <Separator />
                  <ChatPanel />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <StatusBar />
    </div>
  )
}
