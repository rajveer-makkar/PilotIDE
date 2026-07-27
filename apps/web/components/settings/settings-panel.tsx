"use client"

import { useTheme } from "next-themes"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react"
import { useEditorSettings } from "@/stores/editor-settings.store"
import { useAISettings } from "@/stores/ai-settings.store"
import { useTerminalSettings } from "@/stores/terminal-settings.store"

const themes = [
  { key: "light", icon: SunIcon, label: "Light" },
  { key: "dark", icon: MoonIcon, label: "Dark" },
  { key: "system", icon: MonitorIcon, label: "System" },
] as const

export function SettingsPanel() {
  const { theme, setTheme } = useTheme()
  const { minimap, formatOnSave, autoSave, setMinimap, setFormatOnSave, setAutoSave } = useEditorSettings()
  const { apiUrl, apiKey, model, setApiUrl, setApiKey, setModel } = useAISettings()
  const { fontSize, fontFamily, shellPath, setFontSize, setFontFamily, setShellPath } = useTerminalSettings()

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-auto gap-6 p-4">
        <section>
          <h3 className="text-[11px] font-medium uppercase text-muted-foreground">Appearance</h3>
          <div className="flex gap-1">
            {themes.map((t) => {
              const Icon = t.icon
              return (
                <Button
                  key={t.key}
                  variant="outline"
                  size="xs"
                  className={theme === t.key ? "bg-accent" : ""}
                  onClick={() => setTheme(t.key)}
                >
                  <Icon className="size-3.5 mr-1" />
                  {t.label}
                </Button>
              )
            })}
          </div>
        </section>
        <Separator />
        <section>
          <h3 className="text-[11px] font-medium uppercase text-muted-foreground mb-2">Editor</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="size-3.5 accent-foreground"
                checked={minimap}
                onChange={(e) => setMinimap(e.target.checked)}
              />
              Minimap
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="size-3.5 accent-foreground"
                checked={formatOnSave}
                onChange={(e) => setFormatOnSave(e.target.checked)}
              />
              Format on Save
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="size-3.5 accent-foreground"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
              Auto Save (on blur)
            </label>
          </div>
        </section>
        <Separator />
        <section>
          <h3 className="text-[11px] font-medium uppercase text-muted-foreground mb-2">Terminal</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground">Font Size</label>
              <Input
                type="number"
                min={10}
                max={24}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value) || 13)}
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Font Family</label>
              <Input
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                placeholder="Menlo, monospace"
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Shell Path</label>
              <Input
                value={shellPath}
                onChange={(e) => setShellPath(e.target.value)}
                placeholder="/bin/bash"
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
        </section>
        <Separator />
        <section>
          <h3 className="text-[11px] font-medium uppercase text-muted-foreground mb-2">AI</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground">API URL</label>
              <Input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">API Key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Model</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
