/// <reference types="vite/client" />

// SFC shim so plain `tsc`/`vue-tsc` and editors know `*.vue` imports resolve to
// a Vue component. vue-tsc supersedes this for the actual .d.ts emit, but it
// keeps non-vue-tsc tooling happy.
declare module '*.vue' {
	import type { DefineComponent } from 'vue';
	const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
	export default component;
}
