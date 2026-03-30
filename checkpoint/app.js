import { sampleLibrary, sampleCatalog, statusDefinitions, storefrontDefinitions } from "./data/sample-data.js";
import { createPersistence } from "./modules/persistence.js";
import { APP_STATE_SCHEMA_VERSION, normalizePersistedState } from "./modules/schema.js";
import { createStore } from "./modules/store.js";
import { createAppRenderer } from "./modules/render.js";
import { createIntegrations } from "./services/index.js";

const app = document.getElementById("app");

const persistence = createPersistence({
  storageKey: "checkpoint-state",
  schemaVersion: APP_STATE_SCHEMA_VERSION,
  normalizeState: normalizePersistedState
});

const integrations = createIntegrations();

const store = createStore({
  initialLibrary: sampleLibrary,
  catalog: sampleCatalog,
  persistence,
  integrations,
  statusDefinitions,
  storefrontDefinitions
});

const renderer = createAppRenderer({
  app,
  store,
  statusDefinitions,
  storefrontDefinitions
});

store.subscribe(() => {
  renderer.render();
});

renderer.render();
