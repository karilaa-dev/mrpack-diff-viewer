import { useMemo, useState } from "react"
import { CopyIcon, FolderOpenIcon, PackageSearchIcon } from "lucide-react"
import { toast } from "sonner"

import {
  DetailSheet,
  type DetailSelection,
  EnvironmentBadges,
} from "@/components/detail-sheet"
import { SearchField } from "@/components/search-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { metadataDisplayValue, metadataRows } from "@/lib/diff"
import { formatBytes, modVersionLabel, packDisplayName } from "@/lib/mrpack"
import type { AdditionalFile, PackData } from "@/lib/types"

function ViewHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="manifest-gutter flex flex-col gap-0.5">
      <p className="text-primary text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
        {eyebrow}
      </p>
      <h1 className="manifest-title text-2xl sm:text-3xl">{title}</h1>
      <p className="text-muted-foreground max-w-3xl text-xs leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function DetailsButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        <FolderOpenIcon data-icon="inline-start" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function OverviewView({ pack }: { pack: PackData }) {
  const rows = metadataRows(pack)
  const dependencies = pack.index.dependencies ?? {}

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader
        eyebrow="archive / overview"
        title={packDisplayName(pack)}
        description={
          pack.index.summary ??
          "Manifest metadata and dependency targets for the selected pack."
        }
      />
      <div className="flex flex-wrap gap-1.5">
        {dependencies.minecraft ? (
          <Badge>Minecraft {dependencies.minecraft}</Badge>
        ) : null}
        {dependencies["fabric-loader"] ? (
          <Badge variant="secondary">
            Fabric {dependencies["fabric-loader"]}
          </Badge>
        ) : null}
        {dependencies.forge ? (
          <Badge variant="secondary">Forge {dependencies.forge}</Badge>
        ) : null}
        {dependencies.neoforge ? (
          <Badge variant="secondary">NeoForge {dependencies.neoforge}</Badge>
        ) : null}
        <Badge variant="outline">{pack.mods.length} mods</Badge>
        <Badge variant="outline">
          {pack.additionalFiles.length} extra files
        </Badge>
      </div>
      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>Manifest</CardTitle>
          <CardDescription>
            Values read from the archive and its Modrinth index.
          </CardDescription>
          <CardAction>
            <Badge variant="success">Loaded locally</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption className="sr-only">
              Metadata for {packDisplayName(pack)}
            </TableCaption>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="w-40">
                    <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.06em] uppercase">
                      {row.key}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">
                      {metadataDisplayValue(row)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function ModsView({ pack }: { pack: PackData }) {
  const [query, setQuery] = useState("")
  const [selection, setSelection] = useState<DetailSelection | null>(null)
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return pack.mods
    return pack.mods.filter((mod) =>
      [mod.displayName, mod.path, mod.ids.projectId, mod.ids.versionId]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
  }, [pack.mods, query])

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader
        eyebrow="index / mods"
        title="Mods"
        description={`Browse ${pack.mods.length} indexed mods and open a record for paths, hashes, environments, and downloads.`}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          label="Filter mods"
          placeholder="Filter by mod, path, project, or version…"
          value={query}
          onChange={setQuery}
        />
        <Badge variant="outline">{filtered.length} shown</Badge>
      </div>
      {filtered.length ? (
        <Card size="sm">
          <CardContent>
            <Table className="min-w-[40rem]">
              <TableCaption className="sr-only">
                Mods in {packDisplayName(pack)}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Mod</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((mod) => (
                  <TableRow key={`${mod.key}-${mod.path}`}>
                    <TableCell>
                      <span className="flex max-w-sm flex-col gap-0.5">
                        <strong className="text-xs">{mod.displayName}</strong>
                        <span className="text-muted-foreground truncate font-mono text-[0.625rem]">
                          {mod.path}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{modVersionLabel(mod)}</Badge>
                    </TableCell>
                    <TableCell>
                      <EnvironmentBadges env={mod.env} />
                    </TableCell>
                    <TableCell>
                      <DetailsButton
                        label={`View details for ${mod.displayName}`}
                        onClick={() =>
                          setSelection({ kind: "mod", value: mod })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageSearchIcon />
            </EmptyMedia>
            <EmptyTitle>No matching mods</EmptyTitle>
            <EmptyDescription>
              Clear or broaden the filter to show more records.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <DetailSheet
        selection={selection}
        onOpenChange={(open) => !open && setSelection(null)}
      />
    </div>
  )
}

export function FilesView({ pack }: { pack: PackData }) {
  const [query, setQuery] = useState("")
  const [selection, setSelection] = useState<DetailSelection | null>(null)
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle
      ? pack.additionalFiles.filter((file) =>
          file.path.toLowerCase().includes(needle),
        )
      : pack.additionalFiles
  }, [pack.additionalFiles, query])

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader
        eyebrow="archive / files"
        title="Additional files"
        description="Review indexed non-mod files and files bundled directly inside override folders."
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          label="Filter additional files"
          placeholder="Filter by file path…"
          value={query}
          onChange={setQuery}
        />
        <Badge variant="outline">{filtered.length} shown</Badge>
      </div>
      {filtered.length ? (
        <Card size="sm">
          <CardContent>
            <Table className="min-w-[38rem]">
              <TableCaption className="sr-only">
                Additional files in {packDisplayName(pack)}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead>Source / environment</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((file: AdditionalFile) => (
                  <TableRow key={`${file.key}-${file.source ?? "index"}`}>
                    <TableCell>
                      <span
                        className="block max-w-xl truncate font-mono text-[0.6875rem]"
                        title={file.path}
                      >
                        {file.path}
                      </span>
                    </TableCell>
                    <TableCell>
                      {file.source ? (
                        <Badge variant="outline">{file.source}</Badge>
                      ) : (
                        <EnvironmentBadges env={file.env} />
                      )}
                    </TableCell>
                    <TableCell>{formatBytes(file.fileSize)}</TableCell>
                    <TableCell>
                      <DetailsButton
                        label={`View details for ${file.path}`}
                        onClick={() =>
                          setSelection({ kind: "file", value: file })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpenIcon />
            </EmptyMedia>
            <EmptyTitle>
              {pack.additionalFiles.length
                ? "No matching files"
                : "No additional files"}
            </EmptyTitle>
            <EmptyDescription>
              {pack.additionalFiles.length
                ? "Clear or broaden the filter to show more records."
                : "This archive has no indexed non-mod files or bundled overrides."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <DetailSheet
        selection={selection}
        onOpenChange={(open) => !open && setSelection(null)}
      />
    </div>
  )
}

export function RawView({ pack }: { pack: PackData }) {
  const raw = JSON.stringify(pack.rawIndex, null, 2)

  async function copyRawIndex() {
    try {
      await navigator.clipboard.writeText(raw)
      toast.success("Raw index copied.")
    } catch {
      toast.error(
        "The browser blocked clipboard access. Select and copy the JSON manually.",
      )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader
        eyebrow="source / raw"
        title="Raw index"
        description="The complete modrinth.index.json exactly as it was parsed from this archive."
      />
      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>modrinth.index.json</CardTitle>
          <CardDescription>
            {formatBytes(new Blob([raw]).size)} formatted JSON
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={copyRawIndex}>
              <CopyIcon data-icon="inline-start" />
              Copy JSON
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted/70 max-h-[70svh] overflow-auto rounded-sm border p-3 font-mono text-[0.6875rem] leading-relaxed">
            <code>{raw}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
