# MRPACK Archive Workbench

A private, client-side workbench for inspecting Modrinth `.mrpack` archives and comparing several pack editions symmetrically. Files never leave the browser.

![MRPACK Archive Workbench showing two pack editions in the comparison ledger](assets/screenshot.png)

## Live demo

https://karilaa-dev.github.io/mrpack-diff-viewer/

## Features

- Open, drop, and manage multiple `.mrpack` or `.zip` files.
- Reads `modrinth.index.json` from each pack.
- Browse metadata, mods, override files, hashes, download URLs, and environment flags.
- Search dense tables and open complete records in accessible detail sheets.
- Compare every loaded edition side by side with missing, version, and detail filters.
- Matches mods by Modrinth project id when available, with normalized file/path fallback.
- Missing mods are shown first, then same-mod version/detail differences.
- Switch between persisted System, Light, and Dark themes.
- Remove individual packs with Undo or clear the workbench with confirmation.
- No server upload: parsing and comparisons happen locally with JSZip.

## Stack

- Vite, React, and TypeScript
- Tailwind CSS v4
- shadcn Nova components on Base UI
- Vitest, Testing Library, Playwright, and axe-core

## Local development

Install dependencies and start Vite:

```bash
npm install
npm run dev
```

Vite prints the local URL. The production site uses the `/mrpack-diff-viewer/` base path.

## Quality checks

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

## Deployment

The Pages workflow verifies formatting, types, lint, unit/component tests, the production build, Chromium browser flows, and accessibility before deploying `dist/`. Configure the repository’s Pages source as **GitHub Actions**, then push to `main` or run the workflow manually.

## Privacy

The app has no backend and does not upload packs. Production requests are limited to bundled application assets unless you choose to open a download URL contained in a pack.
