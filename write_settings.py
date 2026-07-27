import pathlib
content = '''"use client"

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
          <h3 className="text-[11px] font-medium uppercase text-muted