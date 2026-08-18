import { modNameFromPath, modVersionLabel, packDisplayName } from "@/lib/mrpack"
import type {
  AdditionalFile,
  DiffKind,
  DiffRow,
  MetadataRow,
  ModEntry,
  PackData,
  PackDiff,
} from "@/lib/types"

export function metadataRows(pack: PackData): MetadataRow[] {
  const dependencies = pack.index.dependencies ?? {}
  return [
    { key: "Pack name", value: pack.index.name },
    { key: "Version ID", value: pack.index.versionId },
    { key: "Game", value: pack.index.game },
    { key: "Format", value: pack.index.formatVersion },
    { key: "Minecraft", value: dependencies.minecraft },
    { key: "Fabric Loader", value: dependencies["fabric-loader"] },
    { key: "Forge", value: dependencies.forge },
    { key: "NeoForge", value: dependencies.neoforge },
    { key: "Uploaded file", value: packDisplayName(pack) },
    { key: "File size", value: pack.fileSize },
    { key: "Mods", value: pack.mods.length },
    { key: "Additional files", value: pack.additionalFiles.length },
  ].filter(
    (row) => row.value !== null && row.value !== undefined && row.value !== "",
  )
}

export function metadataDisplayValue(row: MetadataRow): string {
  if (row.key === "File size" && typeof row.value === "number") {
    const units = ["B", "KB", "MB", "GB"]
    let size = row.value
    let unit = 0
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024
      unit += 1
    }
    return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`
  }

  return typeof row.value === "object"
    ? JSON.stringify(row.value)
    : String(row.value ?? "—")
}

function compactMod(entry: ModEntry) {
  return {
    path: entry.path,
    fileSize: entry.fileSize,
    env: entry.env ?? {},
    projectId: entry.ids.projectId,
    versionId: entry.ids.versionId,
    sha1: entry.hashes?.sha1,
    sha512: entry.hashes?.sha512,
    downloads: entry.downloads ?? [],
  }
}

function modDiffKind(values: Array<ModEntry | undefined>): DiffKind {
  if (values.some((value) => !value)) return "missing"
  if (new Set(values.map((value) => modVersionLabel(value))).size > 1)
    return "version"
  return "details"
}

export function modDiffRank(row: DiffRow<ModEntry>): number {
  return row.kind === "missing" ? 0 : row.kind === "version" ? 1 : 2
}

function metadataDiffs(packs: PackData[]): DiffRow<MetadataRow>[] {
  const labels = [
    ...new Set(
      packs.flatMap((pack) => metadataRows(pack).map((row) => row.key)),
    ),
  ]

  return labels.flatMap((key) => {
    const vals = packs.map((pack) =>
      metadataRows(pack).find((row) => row.key === key),
    )
    const signatures = new Set(vals.map((row) => JSON.stringify(row?.value)))
    if (signatures.size < 2) return []
    return [{ key, label: key, vals, kind: "changed" as const }]
  })
}

function modDiffs(packs: PackData[]): DiffRow<ModEntry>[] {
  const maps = packs.map(
    (pack) => new Map(pack.mods.map((mod) => [mod.key, mod])),
  )
  const keys = [...new Set(maps.flatMap((map) => [...map.keys()]))]
  const diffs = keys.flatMap((key) => {
    const vals = maps.map((map) => map.get(key))
    const signatures = vals.map((value) =>
      value ? JSON.stringify(compactMod(value)) : "∅",
    )
    if (new Set(signatures).size < 2) return []

    const first = vals.find(Boolean)
    return [
      {
        key,
        label: first?.displayName ?? modNameFromPath(first?.path) ?? key,
        vals,
        kind: modDiffKind(vals),
      },
    ]
  })

  return diffs.sort(
    (left, right) =>
      modDiffRank(left) - modDiffRank(right) ||
      left.label.localeCompare(right.label),
  )
}

function fileDiffs(packs: PackData[]): DiffRow<AdditionalFile>[] {
  const maps = packs.map(
    (pack) => new Map(pack.additionalFiles.map((file) => [file.key, file])),
  )
  const keys = [...new Set(maps.flatMap((map) => [...map.keys()]))].sort()

  return keys.flatMap((key) => {
    const vals = maps.map((map) => map.get(key))
    const signatures = vals.map((value) =>
      value ? JSON.stringify(value) : "∅",
    )
    if (new Set(signatures).size < 2) return []
    return [
      {
        key,
        label: key,
        vals,
        kind: vals.some((value) => !value)
          ? ("missing" as const)
          : ("changed" as const),
      },
    ]
  })
}

export function comparePacks(packs: PackData[]): PackDiff {
  return {
    metadata: metadataDiffs(packs),
    mods: modDiffs(packs),
    files: fileDiffs(packs),
  }
}
