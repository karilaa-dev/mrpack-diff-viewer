import { useMemo, useState } from "react"
import {
  FolderOpenIcon,
  GitCompareArrowsIcon,
  PackageSearchIcon,
} from "lucide-react"

import {
  DetailSheet,
  type DetailSelection,
  EnvironmentBadges,
} from "@/components/detail-sheet"
import { SearchField } from "@/components/search-field"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldTitle } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { comparePacks, metadataDisplayValue } from "@/lib/diff"
import { formatBytes, modVersionLabel, packDisplayName } from "@/lib/mrpack"
import type {
  AdditionalFile,
  DiffKind,
  DiffRow,
  MetadataRow,
  ModEntry,
  PackData,
} from "@/lib/types"

type CompareFilter = "all" | "missing" | "version" | "details"
type SectionKind = "metadata" | "mods" | "files"
type AnyDiffRow =
  DiffRow<MetadataRow> | DiffRow<ModEntry> | DiffRow<AdditionalFile>

function statusLabel(kind: DiffKind) {
  return kind === "missing"
    ? "Missing"
    : kind === "version"
      ? "Version"
      : kind === "details"
        ? "Details"
        : "Changed"
}

function StatusBadge({ kind }: { kind: DiffKind }) {
  const variant =
    kind === "missing"
      ? "destructive"
      : kind === "version"
        ? "warning"
        : "secondary"
  return <Badge variant={variant}>{statusLabel(kind)}</Badge>
}

function matchesFilter(kind: DiffKind, filter: CompareFilter) {
  if (filter === "all") return true
  if (filter === "details") return kind === "details" || kind === "changed"
  return kind === filter
}

function renderValue(
  value: MetadataRow | ModEntry | AdditionalFile | undefined,
  section: SectionKind,
  onSelect: (selection: DetailSelection) => void,
) {
  if (!value) return <Badge variant="destructive">Missing</Badge>

  if (section === "metadata") {
    return (
      <span className="font-mono text-[0.6875rem] break-words">
        {metadataDisplayValue(value as MetadataRow)}
      </span>
    )
  }

  if (section === "mods") {
    const mod = value as ModEntry
    return (
      <span className="flex min-w-36 flex-col items-start gap-1.5">
        <Badge variant="secondary">{modVersionLabel(mod)}</Badge>
        <EnvironmentBadges env={mod.env} />
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onSelect({ kind: "mod", value: mod })}
        >
          <FolderOpenIcon data-icon="inline-start" />
          Details
        </Button>
      </span>
    )
  }

  const file = value as AdditionalFile
  return (
    <span className="flex min-w-32 flex-col items-start gap-1.5">
      <Badge variant="outline">{file.source ?? "index file"}</Badge>
      <span className="text-muted-foreground text-[0.6875rem]">
        {formatBytes(file.fileSize)}
      </span>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onSelect({ kind: "file", value: file })}
      >
        <FolderOpenIcon data-icon="inline-start" />
        Details
      </Button>
    </span>
  )
}

function ComparisonLedger({
  rows,
  packs,
  section,
  onSelect,
}: {
  rows: AnyDiffRow[]
  packs: PackData[]
  section: SectionKind
  onSelect: (selection: DetailSelection) => void
}) {
  return (
    <>
      <div className="archive-ledger hidden md:block">
        <Table className="min-w-max">
          <TableCaption className="sr-only">
            {section} differences across loaded packs
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-52">Change</TableHead>
              {packs.map((pack) => (
                <TableHead key={pack.id} className="min-w-48">
                  <span className="pack-tab max-w-44 truncate">
                    {packDisplayName(pack)}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="max-w-64">
                  <span className="flex flex-col items-start gap-1.5">
                    <strong className="max-w-60 break-words">
                      {row.label}
                    </strong>
                    <StatusBadge kind={row.kind} />
                  </span>
                </TableCell>
                {packs.map((pack, index) => (
                  <TableCell key={pack.id}>
                    {renderValue(row.vals[index], section, onSelect)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => (
          <Card
            key={row.key}
            size="sm"
            className="border-l-primary/60 border-l-2"
          >
            <CardHeader>
              <CardTitle className="break-words">{row.label}</CardTitle>
              <CardDescription>
                <StatusBadge kind={row.kind} />
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {packs.map((pack, index) => (
                <div key={pack.id} className="flex flex-col gap-1.5">
                  {index ? <Separator /> : null}
                  <strong className="text-[0.625rem] tracking-[0.06em] uppercase">
                    {packDisplayName(pack)}
                  </strong>
                  {renderValue(row.vals[index], section, onSelect)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

function ComparisonSection({
  value,
  title,
  rows,
  packs,
  section,
  onSelect,
}: {
  value: string
  title: string
  rows: AnyDiffRow[]
  packs: PackData[]
  section: SectionKind
  onSelect: (selection: DetailSelection) => void
}) {
  if (!rows.length) return null

  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="py-2.5">
        <span className="flex items-center gap-1.5">
          <span className="font-heading text-sm font-semibold">{title}</span>
          <Badge variant="outline">{rows.length}</Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <ComparisonLedger
          rows={rows}
          packs={packs}
          section={section}
          onSelect={onSelect}
        />
      </AccordionContent>
    </AccordionItem>
  )
}

export function CompareView({ packs }: { packs: PackData[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<CompareFilter>("all")
  const [selection, setSelection] = useState<DetailSelection | null>(null)
  const diff = useMemo(() => comparePacks(packs), [packs])
  const needle = query.trim().toLowerCase()

  function filterRows<T>(rows: DiffRow<T>[]) {
    return rows.filter(
      (row) =>
        matchesFilter(row.kind, filter) &&
        (!needle || row.label.toLowerCase().includes(needle)),
    )
  }

  const metadata = filterRows(diff.metadata)
  const mods = filterRows(diff.mods)
  const files = filterRows(diff.files)
  const visibleTotal = metadata.length + mods.length + files.length
  const total = diff.metadata.length + diff.mods.length + diff.files.length

  return (
    <div className="flex flex-col gap-4">
      <div className="manifest-gutter flex flex-col gap-0.5">
        <p className="text-primary text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
          compare / diff
        </p>
        <h1 className="manifest-title text-2xl sm:text-3xl">
          Differences only
        </h1>
        <p className="text-muted-foreground max-w-3xl text-xs leading-relaxed">
          Every loaded pack is compared side by side. Missing mods appear first,
          followed by version and detail changes.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge>{packs.length} packs</Badge>
        <Badge variant="outline">{diff.metadata.length} metadata</Badge>
        <Badge variant="outline">{diff.mods.length} mods</Badge>
        <Badge variant="outline">{diff.files.length} files</Badge>
      </div>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <SearchField
          label="Filter differences"
          placeholder="Filter by mod, file, or metadata name…"
          value={query}
          onChange={setQuery}
        />
        <Field orientation="responsive">
          <FieldTitle id="diff-filter-label">Change type</FieldTitle>
          <ToggleGroup
            aria-labelledby="diff-filter-label"
            variant="outline"
            size="sm"
            spacing={1}
            value={[filter]}
            onValueChange={(values) =>
              values[0] && setFilter(values[0] as CompareFilter)
            }
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="missing">Missing</ToggleGroupItem>
            <ToggleGroupItem value="version">Version</ToggleGroupItem>
            <ToggleGroupItem value="details">Details</ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </div>

      {visibleTotal ? (
        <Accordion multiple defaultValue={["metadata", "mods", "files"]}>
          <ComparisonSection
            value="metadata"
            title="Metadata"
            rows={metadata}
            packs={packs}
            section="metadata"
            onSelect={setSelection}
          />
          <ComparisonSection
            value="mods"
            title="Mods"
            rows={mods}
            packs={packs}
            section="mods"
            onSelect={setSelection}
          />
          <ComparisonSection
            value="files"
            title="Additional files"
            rows={files}
            packs={packs}
            section="files"
            onSelect={setSelection}
          />
        </Accordion>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {total ? <PackageSearchIcon /> : <GitCompareArrowsIcon />}
            </EmptyMedia>
            <EmptyTitle>
              {total ? "No matching differences" : "These packs match"}
            </EmptyTitle>
            <EmptyDescription>
              {total
                ? "Clear the search or choose another change type."
                : "No metadata, mod, or additional-file differences were found."}
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
