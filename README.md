# @fromforgesoftware/forge-console-plugin

Contract + helpers for building **forge console plugins** — the Grafana
*app-plugin* equivalent. An app ships a `ForgeConsolePlugin` (pages, nav, icon,
apiBase) built as a single **SystemJS** module (`module.js`) that externalises
the shared singletons; the forge console registers those singletons in a
SystemJS import map and `System.import()`s the module at runtime per the
`/apps` configmap. No Module Federation, no `remoteEntry.js`.

- `ForgeConsolePlugin` / `ForgeConsolePage` — the contract (`type: 'app'` today).
- `sortPlugins` / `enabledPlugins` / `pluginRoutes` — registry helpers.
- `loadConsolePlugins(apps, importModule)` — loads each app's `module.js` via an
  injected `SystemImporter` (`(uri) => System.import(uri)`), isolating failures.
- `consolePluginModule()` (`/build`) — Vite library build preset emitting one
  SystemJS `module.js` with the shared singletons externalised.
