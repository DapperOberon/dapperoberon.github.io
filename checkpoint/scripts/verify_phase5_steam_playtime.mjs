import { strict as assert } from "node:assert";
import { createStore } from "../modules/store.js";
import { renderDetailsView } from "../modules/render/details.js";
import { sampleCatalog, sampleLibrary, statusDefinitions, storefrontDefinitions } from "../data/sample-data.js";

function createMemoryPersistence() {
  let savedState = null;
  return {
    load({ initialLibrary, initialCatalog }) {
      return {
        library: initialLibrary,
        catalog: initialCatalog,
        syncPreferences: {
          autoBackup: false,
          includeArtwork: true,
          includeNotes: true,
          includeActivityHistory: true
        },
        uiPreferences: {
          lastView: "dashboard",
          lastStatusFilter: "all",
          librarySort: "updated_desc",
          settingsSection: "settings-sync-account"
        }
      };
    },
    save(state) {
      savedState = state;
    },
    getSavedState() {
      return savedState;
    }
  };
}

function createIntegrations() {
  return {
    steamImport: {
      isConfigured: () => false
    },
    steamGrid: {
      isConfigured: () => true,
      async resolveArtwork({ catalogGame }) {
        return {
          heroArt: catalogGame?.heroArt ?? "",
          capsuleArt: catalogGame?.capsuleArt ?? "",
          screenshots: catalogGame?.screenshots ?? [],
          meta: { resolved: true, usedFallback: false, reason: "test" }
        };
      }
    },
    metadataResolver: {
      isConfigured: () => true,
      async searchGames() {
        return [];
      },
      async resolveGameMetadata({ catalogGame }) {
        return {
          ...catalogGame,
          meta: { resolved: true, usedFallback: false, reason: "test" }
        };
      }
    },
    pricing: {
      isConfigured: () => false,
      async resolvePrice() {
        return null;
      },
      async listStores() {
        return [];
      }
    },
    googleDrive: {
      isConfigured: () => false,
      getStatus: () => ({ available: false, connected: false, clientConfigured: false }),
      async connect() {
        return { ok: false, mode: "oauth", message: "not configured" };
      },
      disconnect() {
        return { ok: true, mode: "oauth", message: "disconnected" };
      },
      async syncAppState() {
        return { ok: false, mode: "manual", message: "not configured" };
      },
      async restoreAppState() {
        throw new Error("not configured");
      }
    }
  };
}

const library = sampleLibrary.map((entry) => (
  entry.entryId === "entry-hades"
    ? {
        ...entry,
        externalPlaytime: {
          steam: {
            appid: 1145350,
            playtimeForeverMinutes: 1234,
            playtime2WeeksMinutes: 56,
            lastImportedAt: "2026-04-10T00:00:00.000Z"
          }
        }
      }
    : entry
));

const persistence = createMemoryPersistence();
const store = createStore({
  initialLibrary: library,
  initialCatalog: sampleCatalog,
  persistence,
  integrations: createIntegrations(),
  statusDefinitions,
  storefrontDefinitions
});

await store.openEntryDetails("entry-hades");

const initialSnapshot = store.getSnapshot();
const initialRendered = renderDetailsView(initialSnapshot, storefrontDefinitions, statusDefinitions);
assert(initialRendered.includes("Steam Playtime"), "Expected Steam playtime panel to render.");
assert(initialRendered.includes("Use Steam Total"), "Expected Use Steam Total action to render.");
assert(initialRendered.includes("Add Steam Time to Checkpoint"), "Expected Add Steam Time action to render.");
assert(initialRendered.includes("Checkpoint Total"), "Expected local playtime label to render.");
assert(initialRendered.includes("Steam Recent"), "Expected Steam recent label to render.");

store.applySteamPlaytimeToDetailProgress("replace");
const replacedSnapshot = store.getSnapshot();
const replacedEntry = replacedSnapshot.library.find((entry) => entry.entryId === "entry-hades");
assert.equal(replacedEntry.playtimeHours, 20.6);

store.applySteamPlaytimeToDetailProgress("add");
const addedSnapshot = store.getSnapshot();
const addedEntry = addedSnapshot.library.find((entry) => entry.entryId === "entry-hades");
assert.equal(addedEntry.playtimeHours, 41.2);
assert.equal(
  addedSnapshot.detailForm.playtimeHours,
  "41.2"
);

const savedState = persistence.getSavedState();
assert(savedState, "Expected persistence save to run.");
assert.equal(savedState.steamImport, undefined, "Steam import state must remain transient.");

console.log("[checkpoint] Phase 5 Steam playtime verification passed.");
