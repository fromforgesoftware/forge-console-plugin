import type { ForgeConsolePlugin } from './plugin.js';
import { sortPlugins } from './registry.js';

// AppDescriptor is one entry the forge-server returns from GET /apps (sourced
// from the runtime configmap): the app's identity, backend base, and the URL of
// its console plugin SystemJS module (module.js).
export interface AppDescriptor {
	slug: string;
	name: string;
	apiBase: string;
	/** URL of the plugin's SystemJS module (a single module.js, Grafana-style). */
	moduleUri: string;
}

// PluginContext is passed to a plugin factory at load time. apiBase is the
// app's backend base (from the /apps descriptor) — a remote module.js is built
// before its apiBase is known, so the factory receives it here rather than
// baking it in at build time.
export interface PluginContext {
	apiBase: string;
}

// PluginFactory builds a plugin given the runtime context. A zero-arg factory
// is still assignable (it ignores the context), so existing factories keep working.
export type PluginFactory = (ctx: PluginContext) => ForgeConsolePlugin;

// A loaded SystemJS module namespace. The plugin module's default export is
// either the ForgeConsolePlugin itself or a factory returning it; `plugin` is
// also accepted as a named export for symmetry with the contract.
export interface ConsolePluginModule {
	default?: ForgeConsolePlugin | PluginFactory;
	plugin?: ForgeConsolePlugin | PluginFactory;
}

// SystemImporter is the injectable seam: it resolves a module URL to its loaded
// SystemJS namespace. The host passes a function backed by its CONFIGURED System
// instance (the one whose import map registers the shared singletons — vue,
// pinia, the kits, this contract), e.g.:
//   const importer: SystemImporter = (uri) => System.import(uri);
// Tests pass a fake or a real `systemjs` System instance. The mechanism is
// SystemJS, NOT Module Federation.
export type SystemImporter = (uri: string) => Promise<ConsolePluginModule>;

// resolvePlugin unwraps a loaded module to a ForgeConsolePlugin, accepting a
// direct plugin object or a factory (called with the runtime context so it can
// build pages against the app's apiBase), via `default` or `plugin`.
function resolvePlugin(mod: ConsolePluginModule, apiBase: string): ForgeConsolePlugin | undefined {
	const exported = mod.default ?? mod.plugin;
	if (typeof exported === 'function') {
		return (exported as PluginFactory)({ apiBase });
	}
	if (exported && typeof exported === 'object') {
		return exported;
	}
	return undefined;
}

// loadConsolePlugins turns the enabled app descriptors into registered plugins
// by `System.import()`-ing each app's module.js and unwrapping its default
// export. Failures are isolated — a broken or unreachable module is logged and
// skipped, never breaking the console or the other plugins. serviceId/apiBase
// fall back to the descriptor so the backend /apps entry is the source of truth.
export async function loadConsolePlugins(
	apps: AppDescriptor[],
	importModule: SystemImporter,
): Promise<ForgeConsolePlugin[]> {
	const loaded: ForgeConsolePlugin[] = [];
	for (const app of apps) {
		try {
			const mod = await importModule(app.moduleUri);
			const plugin = resolvePlugin(mod, app.apiBase);
			if (!plugin) {
				console.error(
					`forge-console: module "${app.slug}" exposes no ForgeConsolePlugin (expected default export or factory)`,
				);
				continue;
			}
			loaded.push({
				...plugin,
				serviceId: plugin.serviceId || app.slug,
				apiBase: plugin.apiBase || app.apiBase,
				type: plugin.type ?? 'app',
			});
		} catch (err) {
			console.error(`forge-console: failed to load plugin "${app.slug}" from ${app.moduleUri}`, err);
		}
	}
	return sortPlugins(loaded);
}
