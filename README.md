# @fromforgesoftware/forge-console-plugin

Contract + helpers for building **forge console plugins** — the Grafana
*app-plugin* equivalent. An app ships a `ForgeConsolePlugin` (pages, nav, icon,
apiBase) built as a Module Federation remote; the forge console loads it at
runtime per the `/apps` configmap.

- `ForgeConsolePlugin` / `ForgeConsolePage` — the contract (`type: 'app'` today).
- `sortPlugins` / `enabledPlugins` / `pluginRoutes` — registry helpers.
- `consolePluginRemote()` (`/federation`) — Vite Module Federation remote preset.
