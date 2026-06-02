// Generic, config/props-driven console renderers. These are the reusable
// plugin views shared across services — a host or app remote registers them in
// a ForgeConsolePage and feeds them props (apiBase, type, fields, …). Bespoke,
// per-app screens (RoleBuilder, BindingForm, AegisOverview, LiveAuditTail) stay
// in their owning remote and are NOT exported here.
export { default as ResourceListView } from './ResourceListView.vue';
export { default as ResourceCreateForm } from './ResourceCreateForm.vue';
export { default as ActionForm } from './ActionForm.vue';

export type { FieldSpec } from './ResourceCreateForm.vue';


// The JSON:API helpers the renderers use, re-exported so hosts/remotes can call
// the same gateway-proxied client directly when wiring custom pages.
export {
	buildCreateBody,
	fetchCollection,
	createResource,
	postCommand,
	type JsonApiResource,
} from './jsonapi.js';
