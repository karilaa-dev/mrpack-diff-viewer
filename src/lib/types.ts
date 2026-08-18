export type EnvironmentSupport =
  "required" | "optional" | "unsupported" | string

export interface ModrinthFile {
  path: string
  hashes?: Record<string, string>
  env?: Record<string, EnvironmentSupport>
  downloads?: string[]
  fileSize?: number
  [key: string]: unknown
}

export interface ModrinthIndex {
  formatVersion?: number
  game?: string
  name?: string
  versionId?: string
  summary?: string
  dependencies?: Record<string, string>
  files?: ModrinthFile[]
  [key: string]: unknown
}

export interface ModrinthIds {
  projectId: string | null
  versionId: string | null
}

export interface ModEntry extends ModrinthFile {
  key: string
  ids: ModrinthIds
  displayName: string
}

export interface AdditionalFile extends ModrinthFile {
  key: string
  source?: "zip override"
}

export interface ZipEntry {
  path: string
  dir: boolean
  size: number | null
}

export interface PackData {
  id: string
  fileName: string
  fileSize: number
  index: ModrinthIndex
  rawIndex: ModrinthIndex
  mods: ModEntry[]
  additionalFiles: AdditionalFile[]
  zipEntries: ZipEntry[]
}

export interface MetadataRow {
  key: string
  value: unknown
}

export type DiffKind = "missing" | "version" | "details" | "changed"

export interface DiffRow<T> {
  key: string
  label: string
  vals: Array<T | undefined>
  kind: DiffKind
}

export interface PackDiff {
  metadata: DiffRow<MetadataRow>[]
  mods: DiffRow<ModEntry>[]
  files: DiffRow<AdditionalFile>[]
}

export type ViewId = "overview" | "mods" | "files" | "raw" | "compare"

export type ThemeMode = "light" | "dark" | "system"
