import {
  ArchiveIcon,
  CircleAlertIcon,
  FilesIcon,
  PlayIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { ThemeMenu } from "@/components/theme-menu"

interface EmptyWorkspaceProps {
  isLoading: boolean
  progress: { current: number; total: number } | null
  errors: string[]
  onChooseFiles: () => void
  onLoadDemo: () => void
  onDismissErrors: () => void
}

export function EmptyWorkspace({
  isLoading,
  progress,
  errors,
  onChooseFiles,
  onLoadDemo,
  onDismissErrors,
}: EmptyWorkspaceProps) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-3 py-3 sm:px-5 sm:py-4">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-sm">
            <ArchiveIcon className="size-3.5" aria-hidden="true" />
          </span>
          <span className="archive-wordmark text-sm">mrpack.diff</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="hidden sm:inline-flex">
            <ShieldCheckIcon data-icon="inline-start" />
            Browser only
          </Badge>
          <ThemeMenu />
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-3 py-6 sm:py-10">
        {errors.length ? (
          <Alert variant="destructive" className="mx-auto max-w-5xl">
            <CircleAlertIcon />
            <AlertTitle>The archive could not be loaded</AlertTitle>
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
                onClick={onDismissErrors}
                aria-label="Dismiss errors"
              >
                <XIcon data-icon="inline-start" />
              </Button>
            </AlertAction>
          </Alert>
        ) : null}
        <Card size="sm" className="archive-drop mx-auto w-full max-w-5xl">
          <CardHeader className="border-b">
            <CardTitle>Local archive session</CardTitle>
            <CardDescription>
              Reads ZIP contents and modrinth.index.json entirely in this
              browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Empty className="min-h-[18rem] sm:min-h-[20rem]">
              <EmptyHeader className="max-w-xl">
                <EmptyMedia variant="icon">
                  <FilesIcon />
                </EmptyMedia>
                <EmptyTitle
                  role="heading"
                  aria-level={1}
                  className="manifest-title text-2xl sm:text-3xl"
                >
                  Open a pack. See what changed.
                </EmptyTitle>
                <EmptyDescription className="max-w-xl text-sm">
                  Drop one or more .mrpack files to inspect an edition. Add a
                  second pack to isolate manifest, mod, and override changes.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                  <Button disabled={isLoading} onClick={onChooseFiles}>
                    {isLoading ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <ArchiveIcon data-icon="inline-start" />
                    )}
                    {isLoading && progress
                      ? `Reading ${progress.current} of ${progress.total}`
                      : "Choose packs"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={onLoadDemo}
                  >
                    <PlayIcon data-icon="inline-start" />
                    Load demo
                  </Button>
                </div>
                <p className="text-muted-foreground mt-1 text-[0.6875rem]">
                  Accepts .mrpack and .zip · multiple editions supported · no
                  uploads
                </p>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
