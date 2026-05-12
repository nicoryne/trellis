---
title: Tauri V1 — auto-update channel and code-signing strategy?
type: question
status: open
tags: [v1, desktop, distribution, tauri]
sources: [trellis-project-architecture]
raised-on: [tauri]
created: 2026-05-12
updated: 2026-05-12
---

# Tauri V1 — auto-update channel and code-signing strategy?

## Status

**Open** — awaiting Keith's answer.

## Why it matters

Native desktop apps that store privileged content on disk **must** be signed (notarized on macOS, Authenticode on Windows) or firms will refuse to install them. Auto-updates need to be policy-friendly — a firm IT department will block uncontrolled background updates on lawyer machines. (see [[tauri]])

## What we know so far

- Tauri is the chosen V1 desktop shell.
- The webview reuses the React frontend.
- Personal vault lives on disk as markdown files.
- Distribution mechanics are not specified.

## What would resolve it

- Pick a signing identity strategy (per-firm enterprise certificate, Trellis-owned cert, both?).
- Pick an update channel (Tauri Updater with signed manifests, MDM-managed, manual installer download).
- Confirm notarization workflow on macOS and Authenticode on Windows.

## Answer

_(pending)_

## Related

- [[tauri]]
- [[trellis-v1-roadmap]]
