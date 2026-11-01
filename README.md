# Workspace Home (`dsh-sidebar-home`)

English | [简体中文](README.zh.md)

A community plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) that adds a
**Home** entry to the sidebar: pick a workspace, and the sidebar switches to that workspace's sessions while every
other workspace folds into a collapsible list at the bottom. Exit focus and the shipped sidebar comes back exactly
as it was.

> Independent community project — not affiliated with, endorsed by, or supported by DeepSeek. DSH is prerelease
> software and this plugin extends its Client slots; please read [Limits](#limits-while-focus-mode-is-on) and
> [failure modes](#compatibility--failure-modes).

## Features

- **Home entry** — a house icon in the sidebar's panel row opens a Home page that lists every workspace with its
  name, path, active and archived session counts, and last activity time; while focused it shows a focus banner
  with an exit action.
- **Two Home layouts** — a card grid or a compact list; the choice is remembered between sessions.
- **Add workspace** — pick a folder through the host directory picker; the plugin registers it and enters it.
- **Focus mode** — the sidebar shows only the focused workspace:
  - session search by title with a match count;
  - needs-attention markers: **Running**, **Waiting approval**, **Plan review**, **Waiting answer**, and
    **Completed** for unread completions;
  - pinned sessions first, with a pin marker;
  - the current session is always kept visible and scrolled into view; a *show more* row reveals the rest;
  - an archived-sessions toggle;
  - a **+ New session** row that starts a chat in the focused workspace;
  - a *Focus* pill in the header and a labelled **Exit focus** button.
- **Other workspaces fold** — a collapsible *Other workspaces (N)* section at the bottom of the sidebar, with
  per-workspace session expansion, an action to enter a workspace directly, and a *View all workspaces* row.
- **Collapsed sidebar** — the narrow rail shows a single Home button that expands the sidebar again.
- **Reversible** — exiting focus disposes the replacement; the shipped workspace browser, with its search, drag
  order, menus and view options, is back untouched.
- **Bilingual and quiet** — English/Simplified Chinese UI and metadata; no build step, no dependencies, no network
  requests, no telemetry; UI state lives in the browser's localStorage.

## Install

This release is distributed from GitHub only — there is no npm package and no build artifact. A working DSH
installation is required; the release was tested on **DSH Desktop 0.2.1-rc.5 on macOS**.

```sh
git clone https://github.com/fu-silent/dsh-sidebar-home.git
```

### DSH Desktop (recommended)

1. Open DeepSeek Harness Desktop and go to the **Plugins** page.
2. Choose **Add plugin** and give it the absolute path of the checkout (for example
   `/Users/you/dsh-sidebar-home`) or the git address `github:fu-silent/dsh-sidebar-home`.
3. Install it, choose **Enable now**, then reload the page (`Cmd+R` / `Ctrl+R`). The Home icon appears in the
   sidebar panel row.

If the icon does not appear after a reload, fully quit and reopen the app once so DSH loads the new client module.

### From an agent (tool install)

An agent with DSH plugin-management access can call `plugin_manager` with `action: "install_bundle"` and
`target: "/absolute/path/to/dsh-sidebar-home"` (it also accepts a git URL); the profile change needs approval,
then reload the page. Remove with `remove_bundle`, target `dsh-sidebar-home`.

### dsh web (optional CLI)

For a local `dsh web` profile: `dsh plugin --profile web add /absolute/path/to/dsh-sidebar-home`, then restart
`dsh web` and reload the page. The `desktop` profile is reserved by the Desktop app — manage it from the Plugins
page, not the CLI.

### Update and uninstall

Update is remove + add, because DSH loads a fresh client module generation per installed package: on the Plugins
page remove the bundle, pull the new checkout, add it again by path, then reload (fully restart the app if the old
module is still shown).

Uninstalling removes the Home entry and both registrations; the sidebar returns to the shipped browser, and your
workspaces and sessions are not touched. The plugin's own state stays in `localStorage` under
`dsh-sidebar-home:state:v1`; clear that key if you want it gone.

## Compatibility

| DSH version | Status |
|---|---|
| 0.2.1-rc.5 (macOS Desktop) | **Tested** — the version this release was built and verified against |
| 0.2.1-rc.6+ and later 0.2.x | Expected to work; untested |
| 0.2.1-rc.4 and older | Refused by the declared range; not supported |
| 0.3.x and newer | Refused by the declared range; not supported |

The bundle declares `"engines": { "dsh": ">=0.2.1-rc.5 <0.3.0-0" }`. DSH checks that range before installing and
activating a bundle, so a mismatched host refuses the install instead of silently rendering a broken sidebar. If
you deliberately try a refused version, the Plugins page can grant an exact-version exemption for that runtime —
that is risk acceptance, not support. Windows and Linux are untested: the client bundle is platform-independent,
but only macOS Desktop 0.2.1-rc.5 is verified.

## Limits while focus mode is on

Focus mode replaces the shipped workspace browser, so its own affordances are unavailable until you exit focus:
session/workspace context menus (rename, pin, archive, fork, copy ID), drag ordering, view/sort/filter options,
global content search (the focus search filters session titles only, not message text), and controls that other
plugins inject into the shipped browser's rows — all of them return on exit.

The focus list shows the latest sessions (8 by default) plus the current and attention-bearing rows, with a
*show more* row for the rest. Archived sessions are listed but cannot be opened until they are unarchived in the
shipped browser. Nothing in focus mode reorders or writes native workspace/session state.

## How it works

The bundle has an empty Host half (`index.js`) and one zero-dependency browser module (`client.js`); nothing is
built and nothing runs on the host.

| Extension point | Kind | Used for |
|---|---|---|
| `sidebar.panellist` | list entry `sidebar-home`, order `-10` | the Home icon in the sidebar panel row |
| `main` | keyed panel, key `sidebar-home` | the Home page |
| `sidebar.workspaces` | single-slot replacement, negative priority | focus-mode session browser; registered only while a workspace is focused and disposed on exit |

- Data comes from the standard slot props (`useWorkspaces`, `useSessions`, `useSessionStatus`, `usePanelInfo`);
  the plugin does not scan other plugins or the DOM, subscribe to session events, or write host files.
- The plugin's only hard service dependency is `slots`. The optional services it renders with (`locale`, `layout`,
  `uiWorkspace`, `workspaces`) activate through a nested `ctx.inject` scope, so if a future DSH release renames or
  removes one of them the plugin stays inert instead of failing the Web boot.
- Focus state, the Home layout, the archived toggle and the fold state persist in `localStorage` under
  `dsh-sidebar-home:state:v1`. The Desktop window keeps a stable origin; a browser tab served from a changing port
  may not, in which case preferences fall back to their defaults.
- Exactly one automatic rule: while focus mode is on, focus follows the conversation visible in the main panel
  (restored after a reload, updated when a session is opened from another surface). Home never changes focus;
  entering a workspace from Home opens that workspace's blank session.
- UI text goes through the Client locale service (namespace `sidebar-home`, English + Simplified Chinese); styles
  use the `dshsh-` class prefix and theme tokens (`--dsw-alias-*`) instead of hard-coded colors.

## Compatibility & failure modes

The plugin never edits DSH files — it shadows one shipped slot entry while focus mode is on. Slots are an official
extension point, but the concrete slot names, props and hooks are DSH Client internals that can change between
releases without a deprecation cycle. What happens when something goes wrong:

- **A render error does not blank the sidebar.** If the focused browser throws, the renderer abdicates that slot
  entry and the shipped browser renders instead (console: `slot entry crashed in 'sidebar.workspaces'`).
- **A missing slot declaration is inert.** Registrations wait for their declaration; if a DSH release renames or
  removes a slot, that surface does not mount and nothing else breaks.
- **A renamed or removed Client service leaves the plugin inactive**, not the app broken: only `slots` is a hard
  dependency, and the feature scope activates through a nested inject scope.
- **Exit focus restores the shipped browser**, unless another plugin replaces or disables the shipped
  `ui-workspace` browser — then there may be nothing to restore. Do not combine two full sidebar-browser
  replacements, or be prepared to disable one of them.
- **Data stays local.** No network requests, no telemetry, no host file writes; workspace paths and session titles
  are rendered from slot props, and only the plugin's own UI state is written to localStorage.
- **Tested narrowly:** DSH Desktop 0.2.1-rc.5 on macOS only. `engines.dsh` prevents accidental installation on a
  runtime this release was not tested against.

## Development

The repository is the package: plain JS, no build step, no dependencies.

```sh
node --check client.js              # browser half syntax
node --check index.js               # host half syntax
node test/render-smoke.cjs          # zero-dependency render smoke test
node scripts/validate-manifest.mjs  # bundle identity and file consistency
```

The smoke test renders every component against a minimal fake React and fake Cordis client context in Node's `vm`;
it asserts the registration contract and is the zero-dependency floor, not an integration test. The validator
enforces the invariants a hand edit is most likely to break: one package identity shared by `package.json`, the
browser module id and the Loader patch row, plus the exported/packed runtime files, locale metadata, icon size and
the smoke test. GitHub Actions runs the same checks on Node 20 and 22 (plus JSON and YAML parse checks) on every
push and pull request; real UI verification stays manual: install the bundle in DSH Desktop and exercise Home
(card and list), focus mode and search, the archived toggle, the other-workspaces fold, exit focus, both themes.

## Screenshots

This release ships without screenshots. Contributions are welcome — the community catalog listing is deferred
until screenshots are available; the plugin can already be installed from this repository.

## License

[MIT](LICENSE) © 2026 fu-silent
