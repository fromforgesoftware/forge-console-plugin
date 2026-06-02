import type { ForgeConsolePlugin } from './plugin';
import { sortPlugins } from './registry';

// AppDescriptor is one entry the forge-server returns from GET /apps (sourced
// from the runtime configmap): the app's identity, backend base, and the URL of
// its console plugin remote module.
export interface AppDescriptor {
	slug: string;
	name: string;
	apiBase: string;
	/** URL of the Module Federation remote entry exposing the plugin factory. */
	moduleUri: string;
}

// RemoteImporter dynamically imports a remote module by URL. Injected so it can
// be backed by Module Federation at runtime and by a fake in tests.
export type RemoteImporter = (uri: string) => Promise<RemotePluginModule>;

// A loaded remote exposes its ForgeConsolePlugin via `plugin` or default export.
export interface RemotePluginModule {
	plugin?: () => ForgeConsolePlugin;
	default?: () => ForgeConsolePlugin;
}

// loadConsolePlugins turns the enabled app descriptors into registered plugins
// by dynamically importing each remote and calling its factory. Failures are
// isolated — a broken or unreachable remote is logged and skipped, never
// breaking the console or the other plugins. serviceId/apiBase fall back to the
// descriptor so the backend /apps entry is the source of truth.
export async function loadConsolePlugins(
	apps: AppDescriptor[],
	importRemote: RemoteImporter,
): Promise<ForgeConsolePlugin[]> {
	const loaded: ForgeConsolePlugin[] = [];
	for (const app of apps) {
		try {
			const mod = await importRemote(app.moduleUri);
			const factory = mod.plugin ?? mod.default;
			if (typeof factory !== 'function') {
				console.error(`forge-console: remote "${app.slug}" exposes no plugin factory`);
				continue;
			}
			const plugin = factory();
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
