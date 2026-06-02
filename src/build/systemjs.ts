import type { LibraryOptions, UserConfig } from 'vite';

// consolePluginModule returns the Vite *library* build config that emits an
// app's console plugin the Grafana way: a SINGLE SystemJS module (`module.js`)
// that EXTERNALISES the shared singletons (vue, vue-router, pinia, the forge
// kits, and this contract package). There is NO Module Federation and NO
// remoteEntry.js / manifest — the host registers the shared libs in a SystemJS
// import map and `System.import()`s the emitted module.js. The module's default
// export is the app's ForgeConsolePlugin (or a factory returning it).
//
// Use it in the app's vite.config.ts:
//   import { defineConfig, mergeConfig } from 'vite';
//   import vue from '@vitejs/plugin-vue';
//   import { consolePluginModule } from '@fromforgesoftware/forge-console-plugin/build';
//   export default mergeConfig(
//     consolePluginModule({ entry: './src/console/index.ts' }),
//     defineConfig({ plugins: [vue()] }),
//   );
export interface ConsolePluginModuleOptions {
	/**
	 * Entry module whose default export is the ForgeConsolePlugin (or a factory
	 * returning it). Defaults to `./src/console/index.ts`.
	 */
	entry?: string;
	/** Emitted SystemJS module filename. Defaults to `module.js` (stable). */
	fileName?: string;
	/** Output directory. Defaults to Vite's `dist`. */
	outDir?: string;
	/**
	 * Extra bare specifiers to externalise on top of CONSOLE_SHARED_SINGLETONS
	 * (e.g. an app-specific singleton the host also provides).
	 */
	extraExternal?: (string | RegExp)[];
}

// CONSOLE_SHARED_SINGLETONS are the bare specifiers the host provides via the
// SystemJS import map. The plugin module must NOT bundle these — it imports
// them at runtime so every plugin and the host share ONE instance (Vue's
// reactivity, the pinia root, the kits' clients) exactly like Grafana sharing
// @grafana/* across app plugins.
export const CONSOLE_SHARED_SINGLETONS: string[] = [
	'vue',
	'vue-router',
	'pinia',
	'@fromforgesoftware/ts-kit',
	'@fromforgesoftware/vue-kit',
	'@fromforgesoftware/forge-console-plugin',
];

// Subpaths plugins commonly import. Externalised via regex so any `/subpath`
// of a shared package also resolves through the host import map, not the bundle
// (e.g. @fromforgesoftware/ts-kit/jsonapi-client,
// @fromforgesoftware/forge-console-plugin/ui).
export const CONSOLE_SHARED_SINGLETON_PATTERNS: RegExp[] = [
	/^@fromforgesoftware\/ts-kit\//,
	/^@fromforgesoftware\/vue-kit\//,
	/^@fromforgesoftware\/forge-console-plugin\//,
];

export function consolePluginModule(opts: ConsolePluginModuleOptions = {}): UserConfig {
	const entry = opts.entry ?? './src/console/index.ts';
	const fileName = opts.fileName ?? 'module.js';

	const lib: LibraryOptions = {
		entry,
		// SystemJS output is a single anonymous System.register() module, so the
		// library name is irrelevant; the filename is fixed below.
		formats: ['system'],
		fileName: () => fileName,
	};

	return {
		build: {
			...(opts.outDir ? { outDir: opts.outDir } : {}),
			lib,
			// One self-contained module; the host loads exactly this one file.
			cssCodeSplit: false,
			rollupOptions: {
				external: [
					...CONSOLE_SHARED_SINGLETONS,
					...CONSOLE_SHARED_SINGLETON_PATTERNS,
					...(opts.extraExternal ?? []),
				],
				output: {
					format: 'system',
					// Stable single filename so the host /apps configmap can point a
					// moduleUri straight at it.
					entryFileNames: fileName,
				},
			},
		},
	};
}
