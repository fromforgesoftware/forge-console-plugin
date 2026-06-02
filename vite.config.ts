/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = resolve(fileURLToPath(import.meta.url), '..');

// The package ships three entries: the framework-agnostic contract (`index`),
// the build/systemjs helper, and the Vue `ui` renderers. A single Vite lib
// build emits all three as ESM; vue-tsc emits the matching .d.ts separately
// (see `build` script). Heavy deps + framework + workspace kits are externalised
// so the bundle stays thin and consumers dedupe on their own copies.
export default defineConfig({
	plugins: [vue(), tailwindcss()],
	build: {
		lib: {
			// Entry keys become the output basename; keep the build/ and ui/
			// segments so emitted JS sits next to the vue-tsc .d.ts of the same
			// path and package.json `exports` resolve with no manifest.
			entry: {
				index: resolve(dirname, 'src/index.ts'),
				'build/systemjs': resolve(dirname, 'src/build/systemjs.ts'),
				'ui/index': resolve(dirname, 'src/ui/index.ts'),
			},
			formats: ['es'],
		},
		cssCodeSplit: false,
		rollupOptions: {
			external: [
				'vue',
				'vue-router',
				'pinia',
				'@fromforgesoftware/ts-kit',
				/^@fromforgesoftware\/ts-kit\//,
				'@fromforgesoftware/vue-kit',
				/^@fromforgesoftware\/vue-kit\//,
				'@lucide/vue',
			],
			output: {
				globals: { vue: 'Vue' },
				// Emit each entry at its keyed path (index.js, build/systemjs.js,
				// ui/index.js) so package.json `exports` resolve without a manifest.
				entryFileNames: '[name].js',
			},
		},
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'jsdom',
		globals: true,
		// vue-kit's published ESM imports the bare `@fromforgesoftware/ts-kit`
		// specifier; inline both kits so Vitest transforms them and resolves that
		// import against this package's node_modules instead of treating the
		// pre-bundled dist as an opaque external.
		server: {
			deps: {
				inline: [/@fromforgesoftware\/vue-kit/, /@fromforgesoftware\/ts-kit/],
			},
		},
	},
});
