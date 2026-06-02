import { describe, it, expect, vi } from 'vitest';
import { loadConsolePlugins, type AppDescriptor, type RemoteImporter } from './loader';
import type { ForgeConsolePlugin } from './plugin';

const desc = (slug: string, order?: number): AppDescriptor => ({
	slug,
	name: slug,
	apiBase: `http://${slug}`,
	moduleUri: `http://${slug}/console/remoteEntry.js`,
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
	it('imports each remote, applies descriptor fallbacks, and sorts by order', async () => {
		const importRemote: RemoteImporter = vi.fn(async (uri) => {
			if (uri.includes('aegis')) return { plugin: () => fakePlugin('aegis', 2) };
			return { default: () => fakePlugin('talos', 1) };
		});
		const out = await loadConsolePlugins([desc('aegis'), desc('talos')], importRemote);
		expect(out.map((p) => p.serviceId)).toEqual(['talos', 'aegis']); // sorted by order
		expect(out[1].apiBase).toBe('http://aegis'); // descriptor fallback applied
		expect(out[1].type).toBe('app');
	});

	it('isolates a failing remote without dropping the others', async () => {
		const importRemote: RemoteImporter = async (uri) => {
			if (uri.includes('broken')) throw new Error('network');
			return { plugin: () => fakePlugin('ok', 1) };
		};
		const out = await loadConsolePlugins([desc('broken'), desc('ok')], importRemote);
		expect(out.map((p) => p.serviceId)).toEqual(['ok']);
	});
});
