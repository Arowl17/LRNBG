# Щъркел (Shtarkel)

A free, offline-friendly web app for learning **Bulgarian** — from the Cyrillic alphabet to A1/A2,
with English and Turkish as source languages. Short lessons, spaced repetition, and careful,
reviewed Bulgarian.

Status: **Phase 2** — the alphabet trainer and A1 units 1–3 are playable (draft content, awaiting native review).
See [SPEC.md](SPEC.md) for the full plan and [CHANGELOG.md](CHANGELOG.md) for progress.

## Run it on Windows

One-time setup:

1. Install **Node.js 24 LTS** from https://nodejs.org (the "LTS" button). Accept the defaults.
2. Open **PowerShell** and enable pnpm (comes with Node):
   ```powershell
   corepack enable
   ```
   If that says "access denied", open PowerShell **as Administrator** and run it again.
3. Get the code and install dependencies:
   ```powershell
   git clone https://github.com/Arowl17/LRNBG.git
   cd LRNBG
   pnpm install
   ```

Every time:

```powershell
pnpm dev
```

Then open http://localhost:5173 in your browser. Press `Ctrl+C` in PowerShell to stop.

Other useful commands: `pnpm check` (run all checks), `pnpm build` (production build),
`pnpm e2e` (browser tests — first run `pnpm exec playwright install chromium` once, then `pnpm build`).

## Licenses

- Code: [MIT](LICENSE)
- Course content (`content/`): [CC BY-SA 4.0](content/LICENSE.md)
