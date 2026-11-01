# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-01

First public release. Distributed from GitHub only; install it from a clone (see the README).

### Added

- **Home entry** in the sidebar panel icon row (`sidebar.panellist`, order `-10`) opening a Home page
  (`main`, key `sidebar-home`) that lists every workspace with name, path, session count, archived count and last
  activity.
- **Home layout switch** between a card grid and a compact list, persisted in browser `localStorage`
  (`dsh-sidebar-home:state:v1`); invalid stored values fall back to the grid.
- **Add workspace** from the Home page through the host directory picker; the new workspace is registered and
  entered immediately.
- **Focus mode** replaces `sidebar.workspaces` while a workspace is focused (single-slot replacement at a negative
  priority) and shows only that workspace's sessions:
  - title search with a match count;
  - needs-attention markers: running, waiting approval, plan review, waiting answer, and completed-unread;
  - pinned sessions first, with a pin marker;
  - the current session always visible and scrolled into view, with a "show more" row for the rest;
  - archived-sessions toggle;
  - a **+ New session** row for the focused workspace;
  - a focus pill and a labelled **Exit focus** control;
  - a collapsible **Other workspaces (N)** section with per-workspace session expansion, a direct enter action and
    a **View all workspaces** row.
- **Collapsed sidebar rail** — a single Home button that expands the sidebar again.
- **Reversible focus mode**: exiting disposes the replacement registration and restores the shipped workspace
  browser untouched, including its search, drag order, menus and view options.
- **Focus follows the visible conversation** while focus mode is on, restored after a reload; the Home page is a
  neutral surface and never changes focus.
- **Localized UI and metadata**: English and Simplified Chinese dictionaries, Plugin Manager metadata and icon.
- **Zero-dependency checks**: render smoke test under `test/`, `scripts/validate-manifest.mjs`, and a GitHub
  Actions CI workflow on Node 20 and 22.
- **Documentation**: English + Simplified Chinese READMEs, this changelog, MIT license.

### Changed

- Package identity is now the unscoped `dsh-sidebar-home` (shared by `package.json`, the browser module id and the
  Loader patch row); the `@local/...` name was a development placeholder. Stored UI state and the locale namespace
  are unchanged, so existing local state survives the rename.

### Compatibility

- Tested with DSH Desktop 0.2.1-rc.5 on macOS.
- Declares `engines.dsh: ">=0.2.1-rc.5 <0.3.0-0"`; DSH refuses to install or activate the bundle on a runtime
  outside that range instead of rendering a broken sidebar.
- The Host half is empty; the browser module registers its surfaces only after the optional Client services it
  uses are available, so a missing or renamed service leaves the plugin inactive rather than failing the Web boot.
- Known limitation: focus mode intentionally does not re-implement the shipped browser's row/workspace menus, drag
  ordering, view options or global content search — those return when focus is exited.

### Notes

- No npm package is published; install from GitHub or a local checkout.
- No screenshots are included in this release. The community plugin catalog listing is deferred until screenshots
  are available.
- No telemetry, no network requests, no host file writes. The only persisted data is the plugin's own UI state in
  browser `localStorage`.
