"use client"

import { useTheme } from "next-themes"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react"

const MODEL = process.env.NEXT_PUBLIC_AI_MODEL ?? process.env.AI_MODEL

const themes = [
  { key: "light", icon: SunIcon, label: "Light" },
  { key: "dark", icon: MoonIcon, label: "Dark" },
  { key: "system", icon: MonitorIcon, label: "System" },
] as const

export function SettingsPanel() {
  const { theme, setTheme } = useTheme()

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
          <h3 className="text-[11px] font-medium uppercase text-muted-foreground">Terminal</h3>
          <p className="text-xs text-muted-foreground">Terminal settings coming soon</p>
        </section>
        <Separator />
        <section>
          <h3 className="text-[11px] font-medium uppercase text-muted-foreground">AI</h3>
          {MODEL ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground">Model:</span>
              <span className="text-[13px] font-medium">{MODEL}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Not configured</p>
          )}
        </section>
      </div>
    </div>
  )
}
