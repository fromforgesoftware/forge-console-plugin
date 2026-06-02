import type { Component } from 'vue';

// ForgeConsolePage is one navigable screen a plugin contributes. props are
// passed straight to the component (the generic renderer reads type/apiBase).
export interface ForgeConsolePage {
	path: string;
	name: string;
	component: Component;
	props?: Record<string, unknown>;
}

// ForgeConsolePluginType discriminates the plugin kind. Only 'app' is supported
// today; 'panel' and 'datasource' are reserved for future console capabilities.
export type ForgeConsolePluginType = 'app' | 'panel' | 'datasource';

// ForgeConsolePlugin is a service's console surface. serviceId keys into the
// backend /apps discovery for apiBase; pages mount under basePath. The plugin
// carries its own lucide/vue `icon`, so the sidebar, dashboard, and command
// palette read it with no per-service edits.
export interface ForgeConsolePlugin {
	serviceId: string;
	title: string;
	basePath: string;
	apiBase: string;
	icon: Component;
	pages: ForgeConsolePage[];
	/** Plugin kind. Defaults to 'app'. */
	type?: ForgeConsolePluginType;
	/** Sidebar sort order (ascending). Unset sorts after numbered ones. */
	order?: number;
}
