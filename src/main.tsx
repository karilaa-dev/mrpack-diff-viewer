import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "next-themes"

import App from "@/App"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "@/index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="mrpack-theme"
    >
      <TooltipProvider delay={350}>
        <App />
        <Toaster closeButton position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
