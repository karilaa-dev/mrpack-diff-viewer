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
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <span className="bg-sidebar-primary text-sidebar-primary-foreground grid size-9 shrink-0 place-items-center rounded-lg">
            <ArchiveIcon className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="archive-wordmark block truncate text-xl">
              MRPACK / DIFF
            </span>
            <span className="text-sidebar-foreground/75 block truncate text-xs">
              Archive workbench
            </span>
          </span>
        </div>
        <Button className="w-full" disabled={isLoading} onClick={onChooseFiles}>
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
          <SidebarGroupLabel>Loaded packs · {packs.length}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {packs.map((pack) => (
                <SidebarMenuItem key={pack.id}>
                  <SidebarMenuButton
                    size="lg"
                    isActive={pack.id === selectedId}
                    onClick={() => selectPack(pack.id)}
                    tooltip={packDisplayName(pack)}
                  >
                    <FileArchiveIcon />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-bold">
                        {packDisplayName(pack)}
                      </span>
                      <span className="text-sidebar-foreground/75 truncate text-xs">
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
      <SidebarFooter className="p-3">
        <div className="text-sidebar-foreground/70 flex items-center gap-2 px-1 text-xs">
          <ShieldCheckIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Files stay in this browser.</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={onLoadDemo}
          >
            <FlaskConicalIcon data-icon="inline-start" />
            Demo
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="outline" size="sm" disabled={isLoading} />
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
          Modrinth index + ZIP contents
        </Badge>
      </SidebarFooter>
    </Sidebar>
  )
}
