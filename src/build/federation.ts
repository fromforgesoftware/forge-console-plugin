// consolePluginRemote returns the Module Federation remote config for an app's
// console plugin. The forge console host loads this remote at runtime per the
// /apps configmap. Pass the result to @originjs/vite-plugin-federation in the
// app's vite.config.ts:
//   import federation from '@originjs/vite-plugin-federation';
//   import { consolePluginRemote } from '@fromforgesoftware/forge-console-plugin/federation';
//   plugins: [vue(), federation(consolePluginRemote({ name: 'aegis' }))]
export interface ConsoleRemoteOptions {
	name: string;
	/** Module exporting the ForgeConsolePlugin factory. */
	entry?: string;
}

export const CONSOLE_SHARED_SINGLETONS = [
	'vue',
	'vue-router',
	'pinia',
	'@fromforgesoftware/ts-kit',
	'@fromforgesoftware/vue-kit',
	'@fromforgesoftware/forge-console-plugin',
];

export function consolePluginRemote(opts: ConsoleRemoteOptions) {
	return {
		name: opts.name,
		filename: 'remoteEntry.js',
		exposes: { './plugin': opts.entry ?? './src/console/index.ts' },
		shared: CONSOLE_SHARED_SINGLETONS,
	};
}
