# MRPACK Diff Viewer

A local-first developer workbench for inspecting Modrinth `.mrpack` archives and comparing pack editions side by side. Parsing and comparison happen entirely in the browser, so archives never leave your device.

![Dense MRPACK Diff Viewer workbench comparing two pack editions](assets/screenshot.png)

**[Open the live workbench](https://karilaa-dev.github.io/mrpack-diff-viewer/)**

## How to use it

1. Drop one or more `.mrpack` or `.zip` archives onto the workbench, or select them with **Add packs**.
2. Inspect a pack through its **Overview**, **Mods**, **Additional files**, and **Raw index** views.
3. Load at least two packs and open **Compare** to review metadata, mod, and override-file differences.
4. Filter the comparison by text or change type, then open **Details** for hashes, environment flags, sizes, and download URLs.

Choose **Load demo** on the empty screen to explore the complete workflow without providing an archive.

## Features

- Open, drop, and manage multiple `.mrpack` or `.zip` files.
- Reads `modrinth.index.json` from each pack.
- Browse metadata, mods, override files, hashes, download URLs, and environment flags.
- Search compact tables and open complete records in accessible detail sheets.
- Compare every loaded edition side by side with missing, version, and detail filters.
- Matches mods by Modrinth project id when available, with normalized file/path fallback.
- Missing mods are shown first, then same-mod version/detail differences.
- Use the dense IBM Plex Mono interface in persisted System, Light, or Dark themes.
- Navigate the responsive desktop workbench and mobile drawer with keyboard-accessible controls.
- Remove individual packs with Undo or clear the workbench with confirmation.

## Interface

The UI is designed like a compact code-review tool: restrained semantic colors, tabular numbers, short scan lines, consistent status badges, and a manifest gutter that keeps the active context visible. Wide screens use a persistent archive rail and comparison ledger; narrow screens switch to a drawer and stacked diff cards without hiding data.

The viewer is read-only. It does not modify the source archive or generate a replacement pack.

## Stack

- Vite, React, and TypeScript
- Tailwind CSS v4
- shadcn Nova components on Base UI
- Vitest, Testing Library, Playwright, and axe-core

## Local development

The project is tested with Node.js 24. Install dependencies and start Vite:

```bash
npm ci
npm run dev
```

Vite prints the local URL. To inspect a production build locally:

```bash
npm run build
npm run preview
```

The deployed site uses the `/mrpack-diff-viewer/` base path.

## Quality checks

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
```

## Deployment

The GitHub Pages workflow verifies formatting, types, lint, unit/component tests, Chromium browser flows, accessibility, and the production build before deploying `dist/`. Configure the repository's Pages source as **GitHub Actions**, then push to `main` or run the workflow manually.

## Privacy

The app has no backend and does not upload packs. Production requests are limited to bundled application assets unless you choose to open a download URL contained in a pack.
