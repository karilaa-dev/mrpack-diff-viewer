import { describe, expect, it } from "vitest"

import { comparePacks, metadataRows, modDiffRank } from "@/lib/diff"
import { makeDemoPacks } from "@/lib/demo"

describe("comparison", () => {
  it("returns only changed metadata, mods, and files", () => {
    const packs = makeDemoPacks()
    const diff = comparePacks(packs)

    expect(diff.metadata.map((row) => row.key)).toEqual(
      expect.arrayContaining([
        "Version ID",
        "Uploaded file",
        "Additional files",
      ]),
    )
    expect(diff.mods.map((row) => [row.label, row.kind])).toEqual([
      ["lithium", "missing"],
      ["modmenu", "missing"],
      ["sodium", "version"],
    ])
    expect(diff.files).toHaveLength(2)
  })

  it("sorts missing mods ahead of version and detail changes", () => {
    const rows = comparePacks(makeDemoPacks()).mods
    expect(rows.map(modDiffRank)).toEqual([...rows.map(modDiffRank)].sort())
  })

  it("returns no differences for the same pack reference", () => {
    const pack = makeDemoPacks()[0]
    expect(comparePacks([pack, pack])).toEqual({
      metadata: [],
      mods: [],
      files: [],
    })
  })

  it("exposes the expected metadata rows", () => {
    const rows = metadataRows(makeDemoPacks()[0])
    expect(rows.find((row) => row.key === "Minecraft")?.value).toBe("1.21.1")
    expect(rows.find((row) => row.key === "Mods")?.value).toBe(3)
  })
})
