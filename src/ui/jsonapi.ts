import { ApiClient } from '@fromforgesoftware/ts-kit/jsonapi-client';

// Generic JSON:API helpers for the console's gateway-proxied plugin resources.
// They route through the shared ts-kit ApiClient (rebased onto the plugin's
// gateway URL), so cookie auth, media-type headers, and JSON:API error parsing
// are the kit's, not hand-rolled. `apiBase` is the plugin gateway base (e.g.
// `/api/proxy/aegis`); `token` adds a bearer for non-cookie callers.
//
// This is the package-resident, host-agnostic copy: the generic renderers
// below depend on it instead of the host's `@/app/core/http/jsonapi`, so they
// can ship from the console-plugin package and be imported by any host/remote.
export interface JsonApiResource {
	id: string;
	type: string;
	attributes: Record<string, unknown>;
}

// buildCreateBody is the pure JSON:API create envelope.
export function buildCreateBody(type: string, attributes: Record<string, unknown>) {
	return { data: { type, attributes } };
}

function clientFor(apiBase: string) {
	return ApiClient.create({ baseUrl: apiBase, basePath: '', credentials: 'include' });
}

function authHeaders(token: string | null | undefined): Record<string, string> | undefined {
	return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function fetchCollection(
	apiBase: string,
	type: string,
	token: string | null | undefined,
): Promise<JsonApiResource[]> {
	const res = await clientFor(apiBase).request({
		method: 'GET',
		path: `/api/${type}`,
		headers: authHeaders(token),
	});
	return (res.body as { data?: JsonApiResource[] }).data ?? [];
}

export async function createResource(
	apiBase: string,
	type: string,
	attributes: Record<string, unknown>,
	token: string | null | undefined,
): Promise<JsonApiResource> {
	const res = await clientFor(apiBase).request({
		method: 'POST',
		path: `/api/${type}`,
		body: buildCreateBody(type, attributes),
		headers: authHeaders(token),
	});
	return (res.body as { data: JsonApiResource }).data;
}

// postCommand POSTs a JSON:API command to an arbitrary path (e.g.
// /api/accounts/ban) whose resource type differs from the path. Returns the
// response data, or null for an empty (204) body.
export async function postCommand(
	apiBase: string,
	path: string,
	type: string,
	attributes: Record<string, unknown>,
	token: string | null | undefined,
): Promise<JsonApiResource | null> {
	const res = await clientFor(apiBase).request({
		method: 'POST',
		path,
		body: buildCreateBody(type, attributes),
		headers: authHeaders(token),
	});
	if (res.status === 204) return null;
	return (res.body as { data?: JsonApiResource }).data ?? null;
}
