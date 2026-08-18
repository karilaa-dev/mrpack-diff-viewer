import {
  ArchiveIcon,
  EllipsisIcon,
  FileArchiveIcon,
  FlaskConicalIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { packDisplayName } from "@/lib/mrpack"
import type { PackData } from "@/lib/types"

interface ArchiveSidebarProps {
  packs: PackData[]
  selectedId: string
  isLoading: boolean
  progress: { current: number; total: number } | null
  onSelect: (id: string) => void
  onChooseFiles: () => void
  onRemove: (pack: PackData) => void
  onClear: () => void
  onLoadDemo: () => void
}

export function ArchiveSidebar({
  packs,
  selectedId,
  isLoading,
  progress,
  onSelect,
  onChooseFiles,
  onRemove,
  onClear,
  onLoadDemo,
}: ArchiveSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  function selectPack(id: string) {
    onSelect(id)
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-2 px-1 py-0.5">
          <span className="bg-sidebar-primary text-sidebar-primary-foreground grid size-7 shrink-0 place-items-center rounded-sm">
            <ArchiveIcon className="size-3.5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="archive-wordmark block truncate text-sm">
              mrpack.diff
            </span>
            <span className="text-sidebar-foreground/70 block truncate text-[0.625rem]">
              local archive workbench
            </span>
          </span>
        </div>
        <Button
          size="sm"
          className="w-full"
          disabled={isLoading}
          onClick={onChooseFiles}
        >
          {isLoading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <PlusIcon data-icon="inline-start" />
          )}
          {isLoading && progress
            ? `Reading ${progress.current} of ${progress.total}`
            : "Add packs"}
        </Button>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[0.625rem] tracking-[0.08em] uppercase">
            Loaded packs · {packs.length}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {packs.map((pack) => (
                <SidebarMenuItem key={pack.id}>
                  <SidebarMenuButton
                    size="lg"
                    className="data-active:border-l-sidebar-primary h-10 rounded-sm border-l-2 border-l-transparent"
                    isActive={pack.id === selectedId}
                    onClick={() => selectPack(pack.id)}
                    tooltip={packDisplayName(pack)}
                  >
                    <FileArchiveIcon />
                    <span className="flex min-w-0 flex-col gap-0">
                      <span className="truncate text-xs font-semibold">
                        {packDisplayName(pack)}
                      </span>
                      <span className="text-sidebar-foreground/70 truncate text-[0.625rem]">
                        {pack.index.dependencies?.minecraft ?? "Unknown MC"} ·{" "}
                        {pack.mods.length} mods
                      </span>
                    </span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <SidebarMenuAction
                          showOnHover
                          aria-label={`Actions for ${packDisplayName(pack)}`}
                        />
                      }
                    >
                      <EllipsisIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onRemove(pack)}
                        >
                          <Trash2Icon />
                          Remove pack
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-2">
        <div className="text-sidebar-foreground/70 flex items-center gap-1.5 px-1 text-[0.625rem]">
          <ShieldCheckIcon className="size-3 shrink-0" aria-hidden="true" />
          <span>Files stay in this browser.</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="xs"
            disabled={isLoading}
            onClick={onLoadDemo}
          >
            <FlaskConicalIcon data-icon="inline-start" />
            Demo
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="outline" size="xs" disabled={isLoading} />
              }
            >
              <Trash2Icon data-icon="inline-start" />
              Clear all
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear every loaded pack?</AlertDialogTitle>
                <AlertDialogDescription>
                  The browser will forget all {packs.length} loaded packs. You
                  will need to choose the files again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep packs</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onClear}>
                  Clear all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Badge variant="outline" className="justify-center">
          ZIP + modrinth.index
        </Badge>
      </SidebarFooter>
    </Sidebar>
  )
}
