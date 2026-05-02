import { strict as assert } from "node:assert";
import { createStore } from "../modules/store.js";
import { statusDefinitions, storefrontDefinitions } from "../data/sample-data.js";

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
          lastView: "wishlist",
          lastStatusFilter: "wishlist",
          librarySort: "updated_desc",
          settingsSection: "settings-imports"
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
      async resolveArtwork() {
        return {
          heroArt: "https://images.example/fallback-hero.jpg",
          capsuleArt: "https://images.example/fallback-cover.jpg",
          screenshots: ["https://images.example/fallback-shot.jpg"],
          meta: { resolved: true, usedFallback: false, reason: "test" }
        };
      }
    },
    metadataResolver: {
      isConfigured: () => true,
      async searchGames() {
        return [];
      },
      async resolveGameMetadata({ title, steamAppId }) {
        assert.equal(title, "Steam App 3559270");
        assert.equal(steamAppId, 3559270);
        return {
          title: "Call of Duty: Modern Warfare III",
          igdbId: 342923,
          developer: "Sledgehammer Games",
          publisher: "Activision",
          releaseDate: "2023-11-10",
          genres: ["Shooter"],
          platforms: ["PC (Microsoft Windows)"],
          criticSummary: "Resolved from Steam app fallback.",
          description: "Steam placeholder resolved into real metadata.",
          heroArt: "https://images.example/base-hero.jpg",
          capsuleArt: "https://images.example/base-cover.jpg",
          screenshots: ["https://images.example/base-shot.jpg"],
          meta: { resolved: true, usedFallback: false, reason: "steam_app_fallback" }
        };
      },
      async getGameByIgdbId(id) {
        assert.equal(id, 342923);
        return {
          id: "igdb-342923",
          igdbId: 342923,
          title: "Call of Duty: Modern Warfare III",
          developer: "Sledgehammer Games",
          publisher: "Activision",
          releaseDate: "2023-11-10",
          genres: ["Shooter", "Action"],
          platforms: ["PC (Microsoft Windows)", "PlayStation 5", "Xbox Series X|S"],
          criticSummary: "Resolved from full IGDB details.",
          description: "Full IGDB-backed metadata payload.",
          heroArt: "https://images.example/igdb-hero.jpg",
          coverArt: "https://images.example/igdb-cover.jpg",
          screenshots: [
            "https://images.example/igdb-shot-1.jpg",
            "https://images.example/igdb-shot-2.jpg"
          ],
          videos: [{
            name: "Reveal Trailer",
            url: "https://www.youtube.com/watch?v=test123"
          }],
          links: {
            igdb: "https://www.igdb.com/games/call-of-duty-modern-warfare-iii",
            official: "https://www.callofduty.com",
            storefronts: [{
              kind: "steam",
              url: "https://store.steampowered.com/app/3559270/"
            }]
          }
        };
      },
      async getRelatedGamesByIgdbId(id) {
        assert.equal(id, 342923);
        return [{
          id: "igdb-500001",
          igdbId: 500001,
          title: "Related Duty Title",
          releaseDate: "2024-01-01"
        }];
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

const initialCatalog = [{
  id: "steam-3559270",
  title: "Steam App 3559270",
  storefront: "steam",
  developer: "Unknown developer",
  publisher: "Unknown publisher",
  releaseDate: "",
  genres: [],
  platforms: [],
  criticSummary: "Steam App 3559270 is ready for metadata enrichment.",
  description: "",
  heroArt: "",
  capsuleArt: "",
  screenshots: [],
  videos: [],
  links: {
    igdb: "",
    official: "",
    storefronts: [{
      kind: "steam",
      url: "https://store.steampowered.com/app/3559270/"
    }]
  },
  relatedTitles: [],
  steam: {
    appid: 3559270,
    appUrl: "https://store.steampowered.com/app/3559270/",
    importSource: "steam-wishlist-import",
    wishlistImportedAt: "2026-04-13T00:00:00.000Z"
  }
}];

const initialLibrary = [{
  entryId: "entry-steam-placeholder",
  gameId: "steam-3559270",
  title: "Steam App 3559270",
  storefront: "steam",
  status: "wishlist",
  runLabel: "Wishlist Watch",
  addedAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  playtimeHours: 0,
  completionPercent: 0,
  personalRating: null,
  notes: "Imported from Steam wishlist.",
  spotlight: "Steam wishlist",
  importSource: "steam-wishlist-import",
  importedAt: "2026-04-13T00:00:00.000Z",
  syncState: "offline",
  wishlistPriority: "medium",
  wishlistIntent: "wait-sale",
  externalPlaytime: {
    steam: {
      appid: 3559270,
      playtimeForeverMinutes: 0,
      playtime2WeeksMinutes: 0,
      lastImportedAt: "2026-04-13T00:00:00.000Z"
    }
  }
}];

const persistence = createMemoryPersistence();
const store = createStore({
  initialLibrary,
  catalog: initialCatalog,
  persistence,
  integrations: createIntegrations(),
  statusDefinitions,
  storefrontDefinitions
});

const changed = await store.refreshGameDataForEntry("entry-steam-placeholder");
assert.equal(changed, true, "Expected refresh game data to promote the placeholder entry.");

const snapshot = store.getSnapshot();
const entry = snapshot.library.find((item) => item.entryId === "entry-steam-placeholder");
const game = snapshot.catalog.find((item) => item.id === "igdb-342923");
const legacyGame = snapshot.catalog.find((item) => item.id === "steam-3559270");

assert(entry, "Expected wishlist entry to remain present.");
assert(game, "Expected catalog game to be promoted to canonical IGDB identity.");
assert.equal(legacyGame, undefined, "Expected legacy steam-* catalog row to be removed after promotion.");
assert.equal(entry.gameId, "igdb-342923");
assert.equal(entry.title, "Call of Duty: Modern Warfare III");
assert.equal(game.title, "Call of Duty: Modern Warfare III");
assert.equal(game.igdbId, 342923);
assert.equal(game.developer, "Sledgehammer Games");
assert.equal(game.publisher, "Activision");
assert.equal(game.heroArt, "https://images.example/igdb-hero.jpg");
assert.equal(game.capsuleArt, "https://images.example/igdb-cover.jpg");
assert.deepEqual(game.screenshots, [
  "https://images.example/igdb-shot-1.jpg",
  "https://images.example/igdb-shot-2.jpg"
]);
assert.equal(game.videos?.length, 1);
assert.equal(game.videos?.[0]?.url, "https://www.youtube.com/watch?v=test123");
assert.equal(game.links?.igdb, "https://www.igdb.com/games/call-of-duty-modern-warfare-iii");
assert.equal(game.relatedTitles?.[0]?.title, "Related Duty Title");
assert.equal(game.steam?.appid, 3559270);
assert.equal(entry.notes, "Imported from Steam wishlist.");
assert.equal(entry.status, "wishlist");
assert.equal(entry.externalPlaytime?.steam?.appid, 3559270);

const secondChanged = await store.refreshGameDataForEntry("entry-steam-placeholder");
assert.equal(secondChanged, false, "Second refresh should be stable once the full IGDB-backed data is already present.");

const secondSnapshot = store.getSnapshot();
const secondEntry = secondSnapshot.library.find((item) => item.entryId === "entry-steam-placeholder");
const secondGame = secondSnapshot.catalog.find((item) => item.id === "igdb-342923");

assert(secondEntry, "Expected promoted entry to remain present.");
assert(secondGame, "Expected promoted game to remain in catalog.");
assert.equal(secondEntry.gameId, "igdb-342923");
assert.equal(secondGame.title, "Call of Duty: Modern Warfare III");
assert.equal(secondGame.heroArt, "https://images.example/igdb-hero.jpg");
assert.equal(secondGame.steam?.appid, 3559270);

const savedState = persistence.getSavedState();
assert(savedState, "Expected persistence save to run.");
assert.equal(savedState.steamImport, undefined, "Steam import session should remain transient.");

console.log("[checkpoint] Phase 5 Steam promotion verification passed.");
