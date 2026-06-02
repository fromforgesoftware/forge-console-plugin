# @fromforgesoftware/forge-console-plugin — console plugin contract

The Grafana *app-plugin* equivalent: the contract + helpers an app uses to
contribute an admin UI to the forge console.

## Commands
- Install: `npm install --legacy-peer-deps`
- Build: `npm run build` (tsc)

## Exports
- `ForgeConsolePlugin` / `ForgeConsolePage` — the contract (`type: 'app'` today;
  `panel`/`datasource` reserved).
- `sortPlugins` / `enabledPlugins` / `pluginRoutes` — registry helpers.
- `/build` → `consolePluginModule()` — Vite SystemJS library preset (emits one
  `module.js`, externalises shared singletons). Host loads via `System.import`.

## Stack
TypeScript 5.9 · vue + vue-router (peers, types only). No runtime ts-kit/vue-kit import.

## Boundaries
- One-line conventional commits. NEVER edit `dist/`. NEVER commit secrets. No dependabot.
