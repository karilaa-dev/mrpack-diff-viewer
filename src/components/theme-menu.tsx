import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ThemeMode } from "@/lib/types"

const labels: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
}

export function ThemeMenu() {
  const { theme = "system", setTheme } = useTheme()
  const current = theme as ThemeMode
  const CurrentIcon =
    current === "light" ? SunIcon : current === "dark" ? MoonIcon : MonitorIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Theme: ${labels[current]}`}
          />
        }
      >
        <CurrentIcon data-icon="inline-start" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Color mode</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={current}
            onValueChange={(value) => setTheme(value)}
          >
            <DropdownMenuRadioItem value="system">
              <MonitorIcon />
              System
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light">
              <SunIcon />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <MoonIcon />
              Dark
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
