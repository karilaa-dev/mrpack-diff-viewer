import type { ReactNode } from "react"
import { ExternalLinkIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatBytes, modVersionLabel, parseModrinthIds } from "@/lib/mrpack"
import type { AdditionalFile, EnvironmentSupport, ModEntry } from "@/lib/types"

export type DetailSelection =
  { kind: "mod"; value: ModEntry } | { kind: "file"; value: AdditionalFile }

interface DetailSheetProps {
  selection: DetailSelection | null
  onOpenChange: (open: boolean) => void
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.06em] uppercase">
        {label}
      </dt>
      <dd className="min-w-0 text-xs break-words">{children}</dd>
    </div>
  )
}

function environmentVariant(value: EnvironmentSupport) {
  if (value === "required") return "success" as const
  if (value === "unsupported") return "destructive" as const
  if (value === "optional") return "warning" as const
  return "outline" as const
}

export function EnvironmentBadges({
  env,
}: {
  env?: Record<string, EnvironmentSupport>
}) {
  const entries = Object.entries(env ?? {})
  if (!entries.length) return <span className="text-muted-foreground">—</span>

  return (
    <span className="flex flex-wrap gap-1">
      {entries.map(([side, value]) => (
        <Badge key={side} variant={environmentVariant(value)}>
          {side}: {value}
        </Badge>
      ))}
    </span>
  )
}

export function DetailSheet({ selection, onOpenChange }: DetailSheetProps) {
  if (!selection) return null

  const item = selection.value
  const isMod = selection.kind === "mod"
  const ids = isMod ? parseModrinthIds(item) : null
  const title = isMod
    ? (item as ModEntry).displayName
    : item.path.split("/").pop() || item.path

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 sm:max-w-lg">
        <SheetHeader className="p-3">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {isMod
              ? "Indexed mod details from this archive."
              : "Additional file details from this archive."}
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <dl className="flex flex-col gap-3">
            <DetailRow label="Path">
              <span className="font-mono text-xs break-all">{item.path}</span>
            </DetailRow>
            {isMod ? (
              <>
                <DetailRow label="Version">
                  <span className="font-mono text-xs">
                    {modVersionLabel(item)}
                  </span>
                </DetailRow>
                <DetailRow label="Project ID">
                  <span className="font-mono text-xs">
                    {ids?.projectId ?? "—"}
                  </span>
                </DetailRow>
                <DetailRow label="Version ID">
                  <span className="font-mono text-xs">
                    {ids?.versionId ?? "—"}
                  </span>
                </DetailRow>
                <DetailRow label="Environment">
                  <EnvironmentBadges env={item.env} />
                </DetailRow>
              </>
            ) : (
              <DetailRow label="Source">
                <Badge variant="outline">
                  {(item as AdditionalFile).source ?? "index file"}
                </Badge>
              </DetailRow>
            )}
            <DetailRow label="Size">{formatBytes(item.fileSize)}</DetailRow>
            {Object.entries(item.hashes ?? {}).map(([algorithm, hash]) => (
              <DetailRow key={algorithm} label={algorithm}>
                <span className="font-mono text-xs break-all">{hash}</span>
              </DetailRow>
            ))}
            {(item.downloads ?? []).length ? (
              <DetailRow label="Downloads">
                <span className="flex flex-col items-start gap-1.5">
                  {item.downloads?.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex max-w-full items-center gap-1.5 text-xs underline-offset-4 hover:underline"
                    >
                      <span className="truncate">
                        {url.split("/").pop() || url}
                      </span>
                      <ExternalLinkIcon
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                  ))}
                </span>
              </DetailRow>
            ) : null}
          </dl>
        </div>
      </SheetContent>
    </Sheet>
  )
}
