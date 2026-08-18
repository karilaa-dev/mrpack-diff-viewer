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
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-lg">
            <ArchiveIcon className="size-4" aria-hidden="true" />
          </span>
          <span className="archive-wordmark text-xl">MRPACK / DIFF</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="hidden sm:inline-flex">
            <ShieldCheckIcon data-icon="inline-start" />
            Browser only
          </Badge>
          <ThemeMenu />
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-4 py-12 sm:py-20">
        {errors.length ? (
          <Alert variant="destructive" className="mx-auto max-w-4xl">
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
        <Card className="archive-drop mx-auto w-full max-w-4xl">
          <CardHeader className="border-b">
            <CardTitle>Archive workbench</CardTitle>
            <CardDescription>
              Reads ZIP contents and modrinth.index.json without sending your
              files anywhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Empty className="min-h-[24rem] sm:min-h-[28rem]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FilesIcon />
                </EmptyMedia>
                <EmptyTitle
                  role="heading"
                  aria-level={1}
                  className="manifest-title text-4xl sm:text-6xl"
                >
                  Open a pack. See what changed.
                </EmptyTitle>
                <EmptyDescription className="max-w-lg text-base">
                  Drop one or more .mrpack files here to inspect an edition. Add
                  a second pack to compare only what differs.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    disabled={isLoading}
                    onClick={onChooseFiles}
                  >
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
                    size="lg"
                    variant="outline"
                    disabled={isLoading}
                    onClick={onLoadDemo}
                  >
                    <PlayIcon data-icon="inline-start" />
                    Load demo
                  </Button>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  Accepts .mrpack and .zip files. You can select several
                  editions at once.
                </p>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
