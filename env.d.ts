/// <reference types="vite/client" />

// SFC shim so plain `tsc`/`vue-tsc` and editors know `*.vue` imports resolve to
// a Vue component. vue-tsc supersedes this for the actual .d.ts emit, but it
// keeps non-vue-tsc tooling happy.
declare module '*.vue' {
	import type { DefineComponent } from 'vue';
	const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
	export default component;
}

// Minimal ambient types for the untyped `systemjs` package (used only by the
// interop test). The Node build exports a ready System instance plus helpers.
declare module 'systemjs' {
	interface SystemInstance {
		import(id: string, parentUrl?: string): Promise<Record<string, unknown>>;
		set(id: string, module: Record<string, unknown>): Record<string, unknown>;
		resolve(id: string, parentUrl?: string): string;
		register(deps: string[], declare: (...args: unknown[]) => unknown): void;
	}
	export const System: SystemInstance;
	export function applyImportMap(
		loader: SystemInstance,
		map: { imports?: Record<string, string>; scopes?: Record<string, Record<string, string>> },
		mapBase?: string,
	): void;
	export function setBaseUrl(loader: SystemInstance, baseUrl: string): void;
}
