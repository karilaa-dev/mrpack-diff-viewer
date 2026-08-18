import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { ArchiveIcon, CircleAlertIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { ArchiveHeader } from "@/components/archive-header"
import { ArchiveSidebar } from "@/components/archive-sidebar"
import { EmptyWorkspace } from "@/components/empty-workspace"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilesView, ModsView, OverviewView, RawView } from "@/views/pack-views"
import { makeDemoPacks } from "@/lib/demo"
import { loadPack } from "@/lib/mrpack"
import type { PackData, ViewId } from "@/lib/types"

const acceptedExtension = /\.(mrpack|zip)$/i
const CompareView = lazy(() =>
  import("@/views/compare-view").then((module) => ({
    default: module.CompareView,
  })),
)

export default function App() {
  const [packs, setPacks] = useState<PackData[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [view, setView] = useState<ViewId>("overview")
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const workspaceHeadingRef = useRef<HTMLDivElement>(null)

  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === selectedId) ?? packs[0],
    [packs, selectedId],
  )

  useEffect(() => {
    function hasFiles(event: DragEvent) {
      return Array.from(event.dataTransfer?.types ?? []).includes("Files")
    }

    function onDragEnter(event: DragEvent) {
      if (!hasFiles(event)) return
      event.preventDefault()
      dragDepth.current += 1
      setIsDragging(true)
    }

    function onDragOver(event: DragEvent) {
      if (!hasFiles(event)) return
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy"
    }

    function onDragLeave(event: DragEvent) {
      if (!hasFiles(event)) return
      event.preventDefault()
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (!dragDepth.current) setIsDragging(false)
    }

    function onDrop(event: DragEvent) {
      if (!hasFiles(event)) return
      event.preventDefault()
      dragDepth.current = 0
      setIsDragging(false)
      void handleFiles(Array.from(event.dataTransfer?.files ?? []))
    }

    window.addEventListener("dragenter", onDragEnter)
    window.addEventListener("dragover", onDragOver)
    window.addEventListener("dragleave", onDragLeave)
    window.addEventListener("drop", onDrop)
    return () => {
      window.removeEventListener("dragenter", onDragEnter)
      window.removeEventListener("dragover", onDragOver)
      window.removeEventListener("dragleave", onDragLeave)
      window.removeEventListener("drop", onDrop)
    }
  })

  async function handleFiles(files: File[]) {
    if (isLoading || !files.length) return
    const supported = files.filter((file) => acceptedExtension.test(file.name))
    const unsupported = files.filter(
      (file) => !acceptedExtension.test(file.name),
    )
    const nextErrors = unsupported.map(
      (file) => `${file.name}: choose a .mrpack or .zip file`,
    )

    if (!supported.length) {
      setErrors(nextErrors)
      return
    }

    setIsLoading(true)
    setErrors([])
    const loaded: PackData[] = []

    for (const [index, file] of supported.entries()) {
      setProgress({ current: index + 1, total: supported.length })
      try {
        loaded.push(await loadPack(file))
      } catch (error) {
        nextErrors.push(
          error instanceof Error
            ? error.message
            : `${file.name}: could not read this file`,
        )
      }
    }

    setPacks((current) => [...current, ...loaded])
    if (!packs.length && loaded.length) {
      setSelectedId(loaded[0].id)
      requestAnimationFrame(() => workspaceHeadingRef.current?.focus())
    }
    setErrors(nextErrors)
    setProgress(null)
    setIsLoading(false)

    if (loaded.length)
      toast.success(
        `${loaded.length} ${loaded.length === 1 ? "pack" : "packs"} loaded.`,
      )
    if (nextErrors.length)
      toast.error(
        `${nextErrors.length} ${nextErrors.length === 1 ? "file" : "files"} could not be loaded.`,
      )
  }

  function chooseFiles() {
    fileInputRef.current?.click()
  }

  function loadDemo() {
    const demo = makeDemoPacks()
    setPacks(demo)
    setSelectedId(demo[0].id)
    setView("overview")
    setErrors([])
    toast.success("Demo comparison loaded.")
  }

  function removePack(pack: PackData) {
    const index = packs.findIndex((candidate) => candidate.id === pack.id)
    const next = packs.filter((candidate) => candidate.id !== pack.id)
    setPacks(next)
    if (selectedId === pack.id) {
      setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? "")
    }
    if (next.length < 2 && view === "compare") setView("overview")

    toast("Pack removed.", {
      action: {
        label: "Undo",
        onClick: () => {
          setPacks((current) => {
            if (current.some((candidate) => candidate.id === pack.id))
              return current
            const restored = [...current]
            restored.splice(Math.min(index, restored.length), 0, pack)
            return restored
          })
          setSelectedId(pack.id)
        },
      },
    })
  }

  function clearAll() {
    setPacks([])
    setSelectedId("")
    setView("overview")
    setErrors([])
    toast.success("All packs cleared.")
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mrpack,.zip"
        multiple
        tabIndex={-1}
        className="sr-only"
        aria-label="Choose mrpack files"
        onChange={(event) => {
          void handleFiles(Array.from(event.target.files ?? []))
          event.currentTarget.value = ""
        }}
      />

      {selectedPack ? (
        <SidebarProvider
          style={
            {
              "--sidebar-width": "16.5rem",
              "--sidebar-width-mobile": "18rem",
            } as React.CSSProperties
          }
        >
          <ArchiveSidebar
            packs={packs}
            selectedId={selectedPack.id}
            isLoading={isLoading}
            progress={progress}
            onSelect={setSelectedId}
            onChooseFiles={chooseFiles}
            onRemove={removePack}
            onClear={clearAll}
            onLoadDemo={loadDemo}
          />
          <SidebarInset>
            <ArchiveHeader
              pack={selectedPack}
              isLoading={isLoading}
              progress={progress}
              onChooseFiles={chooseFiles}
            />
            <div
              ref={workspaceHeadingRef}
              tabIndex={-1}
              className="outline-none"
            >
              {errors.length ? (
                <div className="px-3 pt-3 sm:px-4">
                  <Alert variant="destructive">
                    <CircleAlertIcon />
                    <AlertTitle>Some files could not be loaded</AlertTitle>
                    <AlertDescription>
                      <ul className="flex list-disc flex-col gap-1 pl-4">
                        {errors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                    <AlertAction>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setErrors([])}
                        aria-label="Dismiss errors"
                      >
                        <XIcon data-icon="inline-start" />
                      </Button>
                    </AlertAction>
                  </Alert>
                </div>
              ) : null}
              <Tabs
                value={view}
                onValueChange={(value) => {
                  if (value === "compare" && packs.length < 2) return
                  setView(value as ViewId)
                }}
                className="gap-0"
              >
                <div className="overflow-x-auto border-b px-2 sm:px-4">
                  <TabsList variant="line" className="h-9 min-w-max">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="mods">
                      Mods{" "}
                      <span className="bg-muted text-muted-foreground rounded-sm px-1 py-0.5 text-[0.625rem]">
                        {selectedPack.mods.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="files">
                      Additional files{" "}
                      <span className="bg-muted text-muted-foreground rounded-sm px-1 py-0.5 text-[0.625rem]">
                        {selectedPack.additionalFiles.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="raw">Raw index</TabsTrigger>
                    <TabsTrigger
                      value="compare"
                      disabled={packs.length < 2}
                      title={
                        packs.length < 2
                          ? "Add another pack to compare"
                          : undefined
                      }
                    >
                      Compare{" "}
                      <span className="bg-muted text-muted-foreground rounded-sm px-1 py-0.5 text-[0.625rem]">
                        {packs.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="mx-auto w-full max-w-[100rem] p-3 sm:p-4 lg:p-5">
                  <TabsContent value="overview">
                    <OverviewView pack={selectedPack} />
                  </TabsContent>
                  <TabsContent value="mods">
                    <ModsView pack={selectedPack} />
                  </TabsContent>
                  <TabsContent value="files">
                    <FilesView pack={selectedPack} />
                  </TabsContent>
                  <TabsContent value="raw">
                    <RawView pack={selectedPack} />
                  </TabsContent>
                  <TabsContent value="compare">
                    <Suspense
                      fallback={
                        <div
                          className="text-muted-foreground flex min-h-48 items-center justify-center gap-2 text-xs"
                          role="status"
                        >
                          <Spinner />
                          Opening comparison ledger…
                        </div>
                      }
                    >
                      <CompareView packs={packs} />
                    </Suspense>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <EmptyWorkspace
          isLoading={isLoading}
          progress={progress}
          errors={errors}
          onChooseFiles={chooseFiles}
          onLoadDemo={loadDemo}
          onDismissErrors={() => setErrors([])}
        />
      )}

      {isDragging ? (
        <div className="drag-overlay" aria-hidden="true">
          <div className="flex flex-col items-center gap-2 text-center">
            <ArchiveIcon className="text-primary size-8" />
            <strong className="font-heading text-xl">Drop to add packs</strong>
            <span className="text-muted-foreground text-xs">
              .mrpack and .zip files stay in this browser
            </span>
          </div>
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {isLoading && progress
          ? `Reading pack ${progress.current} of ${progress.total}`
          : ""}
      </span>
    </>
  )
}
