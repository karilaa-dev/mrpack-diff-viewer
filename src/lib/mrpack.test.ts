import JSZip from "jszip"
import { describe, expect, it } from "vitest"

import {
  formatBytes,
  loadPack,
  modKey,
  modNameFromPath,
  modVersionLabel,
  parseModrinthIds,
} from "@/lib/mrpack"
import type { ModrinthFile, ModrinthIndex } from "@/lib/types"

async function archiveFile(
  index: ModrinthIndex | string | null,
  extras: Record<string, string> = {},
  name = "test.mrpack",
) {
  const zip = new JSZip()
  if (index !== null) {
    zip.file(
      "modrinth.index.json",
      typeof index === "string" ? index : JSON.stringify(index),
    )
  }
  for (const [path, contents] of Object.entries(extras))
    zip.file(path, contents)
  return new File([await zip.generateAsync({ type: "blob" })], name)
}

const sodium: ModrinthFile = {
  path: "mods/sodium-fabric-0.6.9+mc1.21.1.jar",
  fileSize: 1024,
  env: { client: "required", server: "optional" },
  hashes: { sha1: "abc" },
  downloads: [
    "https://cdn.modrinth.com/data/AANOBZ/versions/sodium-0.6.9/sodium.jar",
  ],
}

describe("mrpack helpers", () => {
  it("formats byte values", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(1024)).toBe("1.0 KB")
    expect(formatBytes(null)).toBe("—")
  })

  it("extracts Modrinth IDs and readable labels", () => {
    expect(parseModrinthIds(sodium)).toEqual({
      projectId: "AANOBZ",
      versionId: "sodium-0.6.9",
    })
    expect(modVersionLabel(sodium)).toBe("sodium-0.6.9")
    expect(modNameFromPath(sodium.path)).toBe("sodium")
    expect(modKey(sodium)).toBe("project:AANOBZ")
  })

  it("falls back to a normalized path key", () => {
    expect(modKey({ path: "mods/example-mod-1.2.3.jar" })).toBe(
      "path:mods/example-mod",
    )
  })
})

describe("loadPack", () => {
  it("loads indexed mods and bundled override files", async () => {
    const file = await archiveFile(
      {
        formatVersion: 1,
        game: "minecraft",
        name: "Test",
        versionId: "1.0.0",
        dependencies: { minecraft: "1.21.1" },
        files: [
          sodium,
          {
            path: "resourcepacks/example.zip",
            fileSize: 20,
            downloads: ["https://example.test/example.zip"],
          },
        ],
      },
      { "overrides/config/example.json": "{}" },
    )

    const pack = await loadPack(file, "stable-id")
    expect(pack.id).toBe("stable-id")
    expect(pack.mods).toHaveLength(1)
    expect(pack.mods[0].displayName).toBe("sodium")
    expect(pack.additionalFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "resourcepacks/example.zip" }),
        expect.objectContaining({
          path: "overrides/config/example.json",
          source: "zip override",
        }),
      ]),
    )
  })

  it("reports unreadable archives", async () => {
    await expect(
      loadPack(new File(["not-a-zip"], "broken.mrpack")),
    ).rejects.toThrow("not a readable ZIP archive")
  })

  it("reports a missing Modrinth index", async () => {
    await expect(loadPack(await archiveFile(null))).rejects.toThrow(
      "missing modrinth.index.json",
    )
  })

  it("reports malformed index JSON", async () => {
    await expect(loadPack(await archiveFile("{"))).rejects.toThrow(
      "contains invalid JSON",
    )
  })
})
