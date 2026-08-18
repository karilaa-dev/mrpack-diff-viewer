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
    <header className="bg-background/92 sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-5">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{packDisplayName(pack)}</p>
        <p className="text-muted-foreground truncate text-xs">
          {pack.index.versionId ?? "No version ID"} · {pack.mods.length} mods
        </p>
      </div>
      <Badge variant="success" className="hidden lg:inline-flex">
        <ShieldCheckIcon data-icon="inline-start" />
        Browser only
      </Badge>
      <Button
        variant="outline"
        size="sm"
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
