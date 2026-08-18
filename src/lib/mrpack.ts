import type JSZip from "jszip"

import type {
  AdditionalFile,
  ModEntry,
  ModrinthFile,
  ModrinthIds,
  ModrinthIndex,
  PackData,
} from "@/lib/types"

export function formatBytes(value: number | undefined | null): string {
  if (!Number.isFinite(value)) return "—"

  const units = ["B", "KB", "MB", "GB"]
  let size = value as number
  let unit = 0

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }

  return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`
}

export function parseModrinthIds(
  entry: Pick<ModrinthFile, "downloads">,
): ModrinthIds {
  for (const url of entry.downloads ?? []) {
    const match = String(url).match(/\/data\/([^/]+)\/versions\/([^/]+)\//)
    if (match) {
      return { projectId: match[1], versionId: match[2] }
    }
  }

  return { projectId: null, versionId: null }
}

export function modNameFromPath(path: string | undefined): string {
  return String(path ?? "")
    .split("/")
    .pop()!
    .replace(/\.jar$/i, "")
    .replace(/\+mc\d+(?:\.\d+){0,3}.*$/i, "")
    .replace(/[-_]fabric[-_]?/gi, "-")
    .replace(/[-_]\d+(?:\.\d+)+(?:[-+][\w.-]+)?$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function packDisplayName(pack: Pick<PackData, "fileName">): string {
  return pack.fileName.replace(/\.mrpack$/i, "")
}

export function modVersionLabel(entry: ModrinthFile | undefined): string {
  if (!entry) return "—"
  const ids = parseModrinthIds(entry)
  return (
    ids.versionId ??
    String(entry.path ?? "")
      .split("/")
      .pop()
      ?.replace(/\.jar$/i, "") ??
    "—"
  )
}

export function modKey(entry: ModrinthFile): string {
  const ids = parseModrinthIds(entry)
  if (ids.projectId) return `project:${ids.projectId}`

  return `path:${String(entry.path ?? "")
    .toLowerCase()
    .replace(/[-_]?\d[\w.+-]*/g, "")}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeIndex(value: unknown, fileName: string): ModrinthIndex {
  if (!isRecord(value)) {
    throw new Error(
      `${fileName}: modrinth.index.json must contain a JSON object`,
    )
  }

  if (value.files !== undefined && !Array.isArray(value.files)) {
    throw new Error(`${fileName}: the index files field must be an array`)
  }

  return value as ModrinthIndex
}

function createPackId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `pack-${Date.now()}-${Math.random()}`
  )
}

export async function loadPack(
  file: File,
  id = createPackId(),
): Promise<PackData> {
  let zip: JSZip

  try {
    const { default: JSZipLoader } = await import("jszip")
    zip = await JSZipLoader.loadAsync(await file.arrayBuffer())
  } catch {
    throw new Error(`${file.name}: the file is not a readable ZIP archive`)
  }

  const indexFile = zip.file("modrinth.index.json")
  if (!indexFile) {
    throw new Error(`${file.name}: missing modrinth.index.json`)
  }

  let rawIndex: unknown
  try {
    rawIndex = JSON.parse(await indexFile.async("string"))
  } catch {
    throw new Error(`${file.name}: modrinth.index.json contains invalid JSON`)
  }

  const index = normalizeIndex(rawIndex, file.name)
  const indexedFiles = index.files ?? []
  const zipEntries: PackData["zipEntries"] = []

  zip.forEach((path, zipObject) => {
    if (path === "modrinth.index.json") return
    const internal = zipObject as typeof zipObject & {
      _data?: { uncompressedSize?: number }
    }
    zipEntries.push({
      path,
      dir: zipObject.dir,
      size: internal._data?.uncompressedSize ?? null,
    })
  })

  const mods: ModEntry[] = indexedFiles
    .filter((entry) => entry.path.startsWith("mods/"))
    .map((entry) => ({
      ...entry,
      ids: parseModrinthIds(entry),
      displayName: modNameFromPath(entry.path),
      key: modKey(entry),
    }))

  const additionalIndexFiles: AdditionalFile[] = indexedFiles
    .filter((entry) => !entry.path.startsWith("mods/"))
    .map((entry) => ({ ...entry, key: entry.path }))

  const overrideFiles: AdditionalFile[] = zipEntries
    .filter((entry) => !entry.dir)
    .map((entry) => ({
      path: entry.path,
      fileSize: entry.size ?? undefined,
      source: "zip override",
      key: entry.path,
    }))

  return {
    id,
    fileName: file.name,
    fileSize: file.size,
    index,
    rawIndex: index,
    mods,
    additionalFiles: [...additionalIndexFiles, ...overrideFiles],
    zipEntries,
  }
}
