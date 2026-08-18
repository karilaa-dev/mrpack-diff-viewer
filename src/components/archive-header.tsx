import { PlusIcon, ShieldCheckIcon } from "lucide-react"

import { ThemeMenu } from "@/components/theme-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { packDisplayName } from "@/lib/mrpack"
import type { PackData } from "@/lib/types"

interface ArchiveHeaderProps {
  pack: PackData
  isLoading: boolean
  progress: { current: number; total: number } | null
  onChooseFiles: () => void
}

export function ArchiveHeader({
  pack,
  isLoading,
  progress,
  onChooseFiles,
}: ArchiveHeaderProps) {
  return (
    <header className="bg-background/94 sticky top-0 z-30 flex min-h-11 items-center gap-1.5 border-b px-2 backdrop-blur-md sm:px-3">
      <SidebarTrigger className="size-7" />
      <Separator orientation="vertical" className="mx-0.5 h-4" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">
          workspace / {packDisplayName(pack)}
        </p>
        <p className="text-muted-foreground truncate text-[0.625rem]">
          {pack.index.versionId ?? "no-version"} · {pack.mods.length} mods
        </p>
      </div>
      <Badge variant="success" className="hidden lg:inline-flex">
        <ShieldCheckIcon data-icon="inline-start" />
        local
      </Badge>
      <Button
        variant="outline"
        size="xs"
        disabled={isLoading}
        onClick={onChooseFiles}
        aria-label={
          isLoading
            ? progress
              ? `Reading ${progress.current} of ${progress.total}`
              : "Reading packs"
            : "Add packs"
        }
      >
        {isLoading ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <PlusIcon data-icon="inline-start" />
        )}
        <span className="hidden sm:inline">
          {isLoading && progress
            ? `${progress.current} / ${progress.total}`
            : "Add packs"}
        </span>
      </Button>
      <ThemeMenu />
    </header>
  )
}
