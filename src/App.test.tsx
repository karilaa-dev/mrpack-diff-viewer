import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "next-themes"
import { describe, expect, it } from "vitest"

import App from "@/App"
import { TooltipProvider } from "@/components/ui/tooltip"

function renderApp() {
  return render(
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="mrpack-theme"
    >
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ThemeProvider>,
  )
}

describe("App", () => {
  it("loads the demo and opens the comparison workflow", async () => {
    const user = userEvent.setup()
    renderApp()

    expect(
      screen.getByRole("heading", { name: "Open a pack. See what changed." }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Load demo" }))

    expect(screen.getByRole("tab", { name: /Compare 2/ })).toBeEnabled()
    await user.click(screen.getByRole("tab", { name: /Compare 2/ }))
    expect(
      await screen.findByRole("heading", { name: "Differences only" }),
    ).toBeInTheDocument()
    expect(screen.getAllByText("sodium").length).toBeGreaterThan(0)
  })

  it("filters demo mods and supports clearing all packs", async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole("button", { name: "Load demo" }))
    await user.click(screen.getByRole("tab", { name: /Mods 3/ }))

    const search = screen.getByRole("searchbox", { name: "Filter mods" })
    await user.type(search, "sodium")
    expect(screen.getByText("1 shown")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Clear all" }))
    await user.click(
      screen.getAllByRole("button", { name: "Clear all" }).at(-1)!,
    )
    expect(
      screen.getByRole("heading", { name: "Open a pack. See what changed." }),
    ).toBeInTheDocument()
  })
})
