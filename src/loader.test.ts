import { describe, it, expect, vi } from 'vitest';
import { loadConsolePlugins, type AppDescriptor, type SystemImporter } from './loader';
import type { ForgeConsolePlugin } from './plugin';

const desc = (slug: string): AppDescriptor => ({
	slug,
	name: slug,
	apiBase: `http://${slug}`,
	moduleUri: `http://${slug}/console/module.js`,
});

const fakePlugin = (slug: string, order?: number): ForgeConsolePlugin => ({
	serviceId: '',
	title: slug,
	basePath: `/${slug}`,
	apiBase: '',
	icon: {} as never,
	pages: [],
	order,
});

describe('loadConsolePlugins', () => {
	it('System.imports each module, applies descriptor fallbacks, and sorts by order', async () => {
		// SystemJS namespaces: aegis exports a factory (default), talos a plain
		// object (default) — both unwrap to a ForgeConsolePlugin.
		const importModule: SystemImporter = vi.fn(async (uri) => {
			if (uri.includes('aegis')) return { default: () => fakePlugin('aegis', 2) };
			return { default: fakePlugin('talos', 1) };
		});
		const out = await loadConsolePlugins([desc('aegis'), desc('talos')], importModule);
		expect(out.map((p) => p.serviceId)).toEqual(['talos', 'aegis']); // sorted by order
		expect(out[1].apiBase).toBe('http://aegis'); // descriptor fallback applied
		expect(out[1].type).toBe('app');
	});

	it('accepts a `plugin` named export as well as default', async () => {
		const importModule: SystemImporter = async () => ({ plugin: () => fakePlugin('x', 1) });
		const out = await loadConsolePlugins([desc('x')], importModule);
		expect(out[0].serviceId).toBe('x');
	});

	it('isolates a failing module without dropping the others', async () => {
		const importModule: SystemImporter = async (uri) => {
			if (uri.includes('broken')) throw new Error('network');
			return { default: () => fakePlugin('ok', 1) };
		};
		const out = await loadConsolePlugins([desc('broken'), desc('ok')], importModule);
		expect(out.map((p) => p.serviceId)).toEqual(['ok']);
	});

	it('skips a module that exposes no plugin', async () => {
		const importModule: SystemImporter = async () => ({});
		const out = await loadConsolePlugins([desc('empty')], importModule);
		expect(out).toEqual([]);
	});
});
