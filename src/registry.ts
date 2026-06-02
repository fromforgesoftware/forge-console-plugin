import type { RouteRecordRaw } from 'vue-router';
import type { ForgeConsolePlugin } from './plugin';

// sortPlugins orders plugins by ascending `order` (unset sorts last).
export function sortPlugins(list: ForgeConsolePlugin[]): ForgeConsolePlugin[] {
	return [...list].sort(
		(a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
	);
}

// enabledPlugins keeps only plugins whose serviceId is reported by the backend
// /apps endpoint, preserving sort order.
export function enabledPlugins(list: ForgeConsolePlugin[], appSlugs: string[]): ForgeConsolePlugin[] {
	return sortPlugins(list).filter((p) => appSlugs.includes(p.serviceId));
}

// pluginRoutes flattens each plugin's pages into authenticated routes mounted
// under the plugin basePath.
export function pluginRoutes(list: ForgeConsolePlugin[]): RouteRecordRaw[] {
	return sortPlugins(list).flatMap((plugin) =>
		plugin.pages.map((page) => ({
			path: `${plugin.basePath}/${page.path}`,
			name: `${plugin.serviceId}:${page.path}`,
			component: page.component,
			props: page.props,
			meta: { requiresAuth: true, plugin: plugin.serviceId },
		})),
	);
}
