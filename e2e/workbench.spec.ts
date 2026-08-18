import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import JSZip from "jszip"

async function archiveBuffer({
  version = "1.0.0",
  mod = "sodium-0.6.9+mc1.21.1.jar",
}: {
  version?: string
  mod?: string
} = {}) {
  const zip = new JSZip()
  zip.file(
    "modrinth.index.json",
    JSON.stringify({
      formatVersion: 1,
      game: "minecraft",
      name: "Atlas",
      versionId: version,
      dependencies: { minecraft: "1.21.1", "fabric-loader": "0.16.10" },
      files: [
        {
          path: `mods/${mod}`,
          fileSize: 1024,
          hashes: { sha1: "atlas-sha1" },
          env: { client: "required", server: "optional" },
          downloads: [
            `https://cdn.modrinth.com/data/AANOBZ/versions/${version}/${mod}`,
          ],
        },
      ],
    }),
  )
  zip.file("overrides/config/atlas.json", "{}")
  return zip.generateAsync({ type: "nodebuffer" })
}

async function loadDemo(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Load demo" }).click()
  await expect(page.getByRole("tab", { name: /Compare 2/ })).toBeEnabled()
}

function visibleLedgerLabel(
  page: import("@playwright/test").Page,
  label: string,
) {
  return page.locator('strong:visible, [data-slot="card-title"]:visible', {
    hasText: new RegExp(`^${label}$`, "i"),
  })
}

async function expectNoSeriousAccessibilityViolations(
  page: import("@playwright/test").Page,
) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()
  expect(
    results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([])
}

test("loads and compares the demo without serious accessibility violations", async ({
  page,
}) => {
  const outsideRequests: string[] = []
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (url.origin !== "http://127.0.0.1:4173") outsideRequests.push(url.href)
  })

  await page.goto("")
  await expect(
    page.getByRole("heading", { name: "Open a pack. See what changed." }),
  ).toBeVisible()
  await expectNoSeriousAccessibilityViolations(page)
  await loadDemo(page)
  await page.getByRole("tab", { name: /Compare 2/ }).click()
  await expect(
    page.getByRole("heading", { name: "Differences only" }),
  ).toBeVisible()
  await expect(visibleLedgerLabel(page, "sodium")).toBeVisible()

  await expectNoSeriousAccessibilityViolations(page)
  expect(outsideRequests).toEqual([])
})

test("keeps the workbench usable at a mobile viewport", async ({ page }) => {
  await page.goto("")
  await loadDemo(page)
  await expect(
    page.getByRole("button", { name: "Toggle Sidebar" }),
  ).toBeVisible()
  await page.getByRole("tab", { name: /Compare 2/ }).click()
  await expect(
    page.getByRole("heading", { name: "Differences only" }),
  ).toBeVisible()
  await expect(page.getByText("wayfinder-stable").first()).toBeVisible()
})

test("retains a valid pack when another selected archive fails", async ({
  page,
}) => {
  await page.goto("")
  await page.locator('input[type="file"]').setInputFiles([
    {
      name: "atlas.mrpack",
      mimeType: "application/zip",
      buffer: await archiveBuffer(),
    },
    {
      name: "broken.mrpack",
      mimeType: "application/zip",
      buffer: Buffer.from("not a zip"),
    },
  ])

  await expect(page.getByText("atlas", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Some files could not be loaded")).toBeVisible()
  await expect(
    page.getByText(/broken\.mrpack:.*not a readable ZIP/),
  ).toBeVisible()
  await page.getByRole("button", { name: "Dismiss errors" }).click()
  await expect(
    page.getByText("Some files could not be loaded"),
  ).not.toBeVisible()
})

test("accepts a dropped archive and exposes the global drop target", async ({
  page,
}) => {
  await page.goto("")
  const encoded = (await archiveBuffer({ version: "2.0.0" })).toString("base64")

  await page.evaluate((base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) =>
      character.charCodeAt(0),
    )
    const transfer = new DataTransfer()
    transfer.items.add(
      new File([bytes], "dropped.mrpack", { type: "application/zip" }),
    )
    window.dispatchEvent(
      new DragEvent("dragenter", { dataTransfer: transfer, cancelable: true }),
    )
  }, encoded)

  await expect(page.getByText("Drop to add packs")).toBeVisible()

  await page.evaluate((base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) =>
      character.charCodeAt(0),
    )
    const transfer = new DataTransfer()
    transfer.items.add(
      new File([bytes], "dropped.mrpack", { type: "application/zip" }),
    )
    window.dispatchEvent(
      new DragEvent("drop", { dataTransfer: transfer, cancelable: true }),
    )
  }, encoded)

  await expect(page.getByText("dropped", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Drop to add packs")).not.toBeVisible()
})

test("persists theme choice and supports comparison filters", async ({
  page,
}) => {
  await page.goto("")
  await page.getByRole("button", { name: "Theme: System" }).click()
  await page.getByRole("menuitemradio", { name: "Dark" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("mrpack-theme")))
    .toBe("dark")

  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.getByRole("button", { name: "Theme: Dark" })).toBeVisible()
  await expectNoSeriousAccessibilityViolations(page)

  await loadDemo(page)
  await page.getByRole("tab", { name: /Compare 2/ }).click()
  await page.getByRole("button", { name: "Missing", exact: true }).click()
  await expect(visibleLedgerLabel(page, "sodium")).not.toBeVisible()
  await expect(visibleLedgerLabel(page, "lithium")).toBeVisible()
  await page
    .getByRole("searchbox", { name: "Filter differences" })
    .fill("modmenu")
  await expect(visibleLedgerLabel(page, "modmenu")).toBeVisible()
  await expect(visibleLedgerLabel(page, "lithium")).not.toBeVisible()
  await expectNoSeriousAccessibilityViolations(page)
})

test("supports keyboard navigation, detail sheets, and raw JSON copy", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("")

  await page.keyboard.press("Tab")
  await expect(
    page.getByRole("button", { name: "Theme: System" }),
  ).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "Choose packs" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "Load demo" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("tab", { name: /Mods 3/ })).toBeEnabled()

  await page.getByRole("tab", { name: /Mods 3/ }).click()
  await page.getByRole("button", { name: "View details for sodium" }).click()
  const sheet = page.getByRole("dialog")
  await expect(sheet.getByRole("heading", { name: "sodium" })).toBeVisible()
  await sheet.getByRole("button", { name: "Close" }).click()

  await page.getByRole("tab", { name: "Raw index" }).click()
  await page.getByRole("button", { name: "Copy JSON" }).click()
  await expect(page.getByText("Raw index copied.")).toBeVisible()
})

test("removes, restores, and clears loaded packs", async ({ page }) => {
  await page.goto("")
  await loadDemo(page)

  const packActions = page.getByRole("button", {
    name: "Actions for wayfinder-stable",
  })
  const usesSidebarDialog = !(await packActions.isVisible())
  if (usesSidebarDialog) {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click()
  }
  await packActions.click()
  await page.getByRole("menuitem", { name: "Remove pack" }).click()
  if (usesSidebarDialog) {
    await page.keyboard.press("Escape")
    await expect(
      page.getByRole("dialog", { name: "Sidebar" }),
    ).not.toBeVisible()
  }
  await expect(page.getByRole("tab", { name: /Compare 1/ })).toBeDisabled()
  await page.getByRole("button", { name: "Undo" }).click()
  await expect(page.getByRole("tab", { name: /Compare 2/ })).toBeEnabled()

  if (usesSidebarDialog) {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click()
  }
  await page.getByRole("button", { name: "Clear all" }).click()
  await expect(
    page.getByRole("heading", { name: "Clear every loaded pack?" }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Clear all", exact: true })
    .last()
    .click()
  await expect(
    page.getByRole("heading", { name: "Open a pack. See what changed." }),
  ).toBeVisible()
})
