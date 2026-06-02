// @vitest-environment node
//
// INTEROP PROOF for the Grafana-style loading model: a plugin is built as a
// SINGLE SystemJS module that EXTERNALISES shared singletons (here: 'vue'); the
// host registers those singletons in a SystemJS import map and System.imports
// the module. This test proves the singleton actually crosses the boundary as
// the SAME instance — i.e. there is real sharing, not a second copy.
//
// We use the real `systemjs` npm package. Its Node build only fetches over
// HTTP(S) (data:/file: are rejected), which mirrors the runtime exactly: the
// host fetches the plugin's module.js over the network. So we serve a tiny
// hand-written SystemJS-format module (the same `System.register([...])` shape
// Rollup's `format:'system'` emits — see consolePluginModule) from a local HTTP
// server and load it through the host's configured System instance.
import { describe, it, expect, afterAll } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { System, applyImportMap } from 'systemjs';
import { consolePluginModule } from './systemjs';

// A minimal SystemJS module that externalises 'vue' and exports a value derived
// from it. This is exactly the structure Vite/Rollup emit for an externalised
// dependency under output.format 'system'.
const MODULE_SOURCE = `System.register(['vue'], function (_export) {
	var Vue;
	return {
		setters: [function (m) { Vue = m; }],
		execute: function () {
			// The module never bundles vue; it reads whatever the host provided.
			_export('default', {
				receivedVue: Vue.default,
				createdApp: Vue.createApp('root'),
			});
		},
	};
});`;

const servers: http.Server[] = [];

function serveModule(source: string): Promise<string> {
	return new Promise((resolve) => {
		const server = http.createServer((_req, res) => {
			res.setHeader('content-type', 'application/javascript');
			res.end(source);
		});
		servers.push(server);
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as AddressInfo;
			resolve(`http://127.0.0.1:${port}/module.js`);
		});
	});
}

afterAll(() => {
	for (const s of servers) s.close();
});

describe('SystemJS singleton interop', () => {
	it('the loaded module receives the SAME host-provided vue instance', async () => {
		// The host's single vue instance (stand-in for the real Vue runtime).
		const hostVue = {
			marker: 'HOST_VUE_SINGLETON',
			createApp: (root: string) => ({ root, fromHostVue: true }),
		};

		// Host registers shared singletons: map the bare 'vue' specifier to a
		// host-owned id and seed that id with the host's instance. This is the
		// SystemJS equivalent of Grafana's host import map for @grafana/*.
		applyImportMap(System, { imports: { vue: 'forge:vue' } });
		System.set('forge:vue', { default: hostVue, createApp: hostVue.createApp });

		const moduleUrl = await serveModule(MODULE_SOURCE);

		// Host loads the plugin module via its configured System instance — this
		// is precisely the loader's SystemImporter seam: (uri) => System.import(uri).
		const ns = (await System.import(moduleUrl)) as {
			default: { receivedVue: typeof hostVue; createdApp: { fromHostVue: boolean } };
		};

		// PROOF: identity, not a copy.
		expect(ns.default.receivedVue).toBe(hostVue);
		expect(ns.default.receivedVue.marker).toBe('HOST_VUE_SINGLETON');
		// PROOF: behaviour wired through the host instance (used host.createApp).
		expect(ns.default.createdApp.fromHostVue).toBe(true);
	});

	it('consolePluginModule emits SystemJS format and externalises the singletons', () => {
		const cfg = consolePluginModule({ entry: './src/console/index.ts' });
		const out = cfg.build?.rollupOptions?.output;
		const output = Array.isArray(out) ? out[0] : out;
		expect(output?.format).toBe('system');
		expect(output?.entryFileNames).toBe('module.js');

		const external = cfg.build?.rollupOptions?.external as (string | RegExp)[];
		expect(external).toContain('vue');
		expect(external).toContain('pinia');
		expect(external).toContain('@fromforgesoftware/forge-console-plugin');
		// Subpaths (e.g. /jsonapi-client, /ui) externalised via pattern.
		expect(external.some((e) => e instanceof RegExp && e.test('@fromforgesoftware/ts-kit/jsonapi-client'))).toBe(
			true,
		);
		expect(external.some((e) => e instanceof RegExp && e.test('@fromforgesoftware/forge-console-plugin/ui'))).toBe(
			true,
		);
	});
});
