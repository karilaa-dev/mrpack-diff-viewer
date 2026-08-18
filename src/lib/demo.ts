import { modKey, modNameFromPath, parseModrinthIds } from "@/lib/mrpack"
import type {
  AdditionalFile,
  ModEntry,
  ModrinthFile,
  ModrinthIndex,
  PackData,
} from "@/lib/types"

function mod(
  path: string,
  project: string,
  version: string,
  size: number,
): ModrinthFile {
  return {
    path,
    fileSize: size,
    hashes: { sha1: `${project.toLowerCase()}-${version.toLowerCase()}-sha1` },
    env: {
      client: "required",
      server: project === "MODMENU" ? "unsupported" : "optional",
    },
    downloads: [
      `https://cdn.modrinth.com/data/${project}/versions/${version}/${path.split("/").pop()}`,
    ],
  }
}

function buildPack(
  id: string,
  fileName: string,
  versionId: string,
  files: ModrinthFile[],
  extraFiles: AdditionalFile[],
): PackData {
  const index: ModrinthIndex = {
    formatVersion: 1,
    game: "minecraft",
    name: "Wayfinder",
    versionId,
    summary: "A small client-side performance and exploration pack.",
    dependencies: {
      minecraft: "1.21.1",
      "fabric-loader": "0.16.10",
    },
    files,
  }

  const mods: ModEntry[] = files.map((entry) => ({
    ...entry,
    ids: parseModrinthIds(entry),
    displayName: modNameFromPath(entry.path),
    key: modKey(entry),
  }))

  return {
    id,
    fileName,
    fileSize: 2_480_000 + mods.length * 120_000,
    index,
    rawIndex: index,
    mods,
    additionalFiles: extraFiles,
    zipEntries: extraFiles.map((entry) => ({
      path: entry.path,
      dir: false,
      size: entry.fileSize ?? null,
    })),
  }
}

export function makeDemoPacks(): PackData[] {
  const sodiumV1 = mod(
    "mods/sodium-0.6.5+mc1.21.1.jar",
    "AANOBZ",
    "sodium-0.6.5",
    1_080_000,
  )
  const sodiumV2 = mod(
    "mods/sodium-0.6.9+mc1.21.1.jar",
    "AANOBZ",
    "sodium-0.6.9",
    1_140_000,
  )
  const iris = mod(
    "mods/iris-1.8.4+mc1.21.1.jar",
    "YL57XB",
    "iris-1.8.4",
    2_420_000,
  )
  const modMenu = mod(
    "mods/modmenu-11.0.3.jar",
    "MODMENU",
    "modmenu-11.0.3",
    820_000,
  )
  const lithium = mod(
    "mods/lithium-0.14.8+mc1.21.1.jar",
    "LITHIUM",
    "lithium-0.14.8",
    730_000,
  )

  const optionsA: AdditionalFile = {
    path: "overrides/config/sodium-options.json",
    key: "overrides/config/sodium-options.json",
    source: "zip override",
    fileSize: 1840,
  }
  const optionsB: AdditionalFile = { ...optionsA, fileSize: 2160 }
  const readme: AdditionalFile = {
    path: "overrides/README.txt",
    key: "overrides/README.txt",
    source: "zip override",
    fileSize: 612,
  }

  return [
    buildPack(
      "demo-stable",
      "wayfinder-stable.mrpack",
      "1.3.0",
      [sodiumV1, iris, modMenu],
      [optionsA],
    ),
    buildPack(
      "demo-next",
      "wayfinder-next.mrpack",
      "1.4.0-rc.1",
      [sodiumV2, iris, lithium],
      [optionsB, readme],
    ),
  ]
}
