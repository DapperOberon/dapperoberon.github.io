import { strict as assert } from "node:assert";
import { createStore } from "../modules/store.js";
import { sampleCatalog, statusDefinitions, storefrontDefinitions } from "../data/sample-data.js";

function createMemoryPersistence(lastView = "settings") {
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
          lastView,
          lastStatusFilter: "all",
          librarySort: "updated_desc",
          settingsSection: "settings-imports"
        }
      };
    },
    save() {}
  };
}

function createBaseIntegrations() {
  return {
    steamGrid: {
      isConfigured: () => false,
      async resolveArtwork() {
        return {
          heroArt: "",
          capsuleArt: "",
          screenshots: [],
          meta: { resolved: false, usedFallback: false, reason: "fixture" }
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
    metadataResolver: {
      isConfigured: () => true,
      async searchGames() {
        return [];
      },
      async resolveGameMetadata({ catalogGame }) {
        return {
          ...catalogGame,
          meta: { resolved: true, usedFallback: false, reason: "fixture" }
        };
      },
      async getGameByIgdbId(id) {
        return {
          id: `igdb-${id}`,
          igdbId: id,
          title: `Fixture IGDB ${id}`
        };
      },
      async getRelatedGamesByIgdbId() {
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

{
  const ownedLibrary = [
    {
      entryId: "entry-decorated-title",
      gameId: "igdb-342923",
      title: "Call of Duty: Modern Warfare III",
      storefront: "steam",
      status: "backlog",
      runLabel: "Main Save",
      addedAt: "2026-04-13T00:00:00.000Z",
      updatedAt: "2026-04-13T00:00:00.000Z",
      playtimeHours: 0,
      completionPercent: 0,
      personalRating: null,
      notes: "",
      spotlight: "",
      wishlistPriority: "medium",
      wishlistIntent: "wait-sale",
      importSource: "",
      importedAt: "",
      externalPlaytime: { steam: { appid: null, playtimeForeverMinutes: 0, playtime2WeeksMinutes: 0, lastImportedAt: "" } },
      syncState: "offline",
      priceWatch: { enabled: false, targetPrice: null, currency: "USD", lastNotifiedAt: "" }
    }
  ];

  const ownedCatalog = [
    {
      id: "igdb-342923",
      igdbId: 342923,
      title: "Call of Duty: Modern Warfare III",
      storefront: "steam"
    },
    ...sampleCatalog.slice(0, 1)
  ];

  const store = createStore({
    initialLibrary: ownedLibrary,
    catalog: ownedCatalog,
    persistence: createMemoryPersistence(),
    integrations: {
      ...createBaseIntegrations(),
      steamImport: {
        isConfigured: () => true,
        async resolveProfile(profile) {
          assert.equal(profile, "https://steamcommunity.com/id/decorated-user");
          return { steamid: "76561198000001234", inputType: "vanity" };
        },
        async fetchOwnedGames() {
          return {
            results: [
              {
                appid: 555001,
                title: "Call of Duty®: Modern Warfare® III",
                appUrl: "https://store.steampowered.com/app/555001/",
                playtimeForeverMinutes: 120,
                playtime2WeeksMinutes: 0,
                hasPlayed: true,
                recentlyPlayed: false,
                importSource: "steam-owned-games"
              },
              {
                appid: 555002,
                title: "Fresh Fixture Game",
                appUrl: "https://store.steampowered.com/app/555002/",
                playtimeForeverMinutes: 0,
                playtime2WeeksMinutes: 0,
                hasPlayed: false,
                recentlyPlayed: false,
                importSource: "steam-owned-games"
              },
              {
                appid: 555003,
                title: "Recent Fixture Game",
                appUrl: "https://store.steampowered.com/app/555003/",
                playtimeForeverMinutes: 480,
                playtime2WeeksMinutes: 75,
                hasPlayed: true,
                recentlyPlayed: true,
                importSource: "steam-owned-games"
              }
            ],
            summary: {
              total: 3,
              played: 2,
              unplayed: 1,
              recentlyPlayed: 1
            }
          };
        }
      },
      metadataResolver: {
        ...createBaseIntegrations().metadataResolver,
        async searchGames({ query }) {
          if (query === "Fresh Fixture Game") {
            return [{ id: "igdb-555002", igdbId: 555002, title: "Fresh Fixture Game", releaseDate: "2027-01-01" }];
          }
          if (query === "Recent Fixture Game") {
            return [{ id: "igdb-555003", igdbId: 555003, title: "Recent Fixture Game", releaseDate: "2027-02-01" }];
          }
          return [];
        }
      }
    },
    statusDefinitions,
    storefrontDefinitions
  });

  store.setSteamImportMode("owned-library");
  store.updateSteamImportSource({
    steamProfile: "https://steamcommunity.com/id/decorated-user",
    includeFreePlayed: false
  });
  await store.fetchSteamOwnedLibraryPreview();
  const snapshot = store.getSnapshot();

  assert.equal(snapshot.steamImport.summary.total, 3);
  assert.equal(snapshot.steamImport.summary.played, 2);
  assert.equal(snapshot.steamImport.summary.unplayed, 1);
  assert.equal(snapshot.steamImport.summary.recent, 1);

  const decorated = snapshot.steamImport.candidates.find((row) => row.appid === 555001);
  assert(decorated, "Expected decorated Steam title candidate.");
  assert.equal(decorated.matchStatus, "possible");
  assert.equal(decorated.matchReason, "title");
  assert.equal(decorated.matchConfidence, "high");
  assert.equal(decorated.action, "merge");

  const recent = snapshot.steamImport.candidates.find((row) => row.appid === 555003);
  assert(recent, "Expected recently played candidate.");
  assert.equal(recent.proposedStatus, "playing");
}

{
  const store = createStore({
    initialLibrary: [],
    catalog: [],
    persistence: createMemoryPersistence(),
    integrations: {
      ...createBaseIntegrations(),
      steamImport: {
        isConfigured: () => true,
        async resolveProfile() {
          throw new Error("Steam profile is private or unavailable.");
        },
        async fetchOwnedGames() {
          throw new Error("Should not fetch owned games after profile failure.");
        }
      }
    },
    statusDefinitions,
    storefrontDefinitions
  });

  store.setSteamImportMode("owned-library");
  store.updateSteamImportSource({ steamProfile: "https://steamcommunity.com/id/private-user", includeFreePlayed: false });
  await store.fetchSteamOwnedLibraryPreview();
  const snapshot = store.getSnapshot();

  assert.equal(snapshot.steamImport.loading, false);
  assert.equal(snapshot.steamImport.candidates.length, 0);
  assert.equal(snapshot.steamImport.errors[0], "Steam profile is private or unavailable.");
}

{
  const wishlistLibrary = [
    {
      entryId: "entry-existing-wishlist",
      gameId: "igdb-700100",
      title: "Already Wishlisted Title",
      storefront: "steam",
      status: "wishlist",
      runLabel: "Wishlist Watch",
      addedAt: "2026-04-13T00:00:00.000Z",
      updatedAt: "2026-04-13T00:00:00.000Z",
      playtimeHours: 0,
      completionPercent: 0,
      personalRating: null,
      notes: "",
      spotlight: "",
      wishlistPriority: "medium",
      wishlistIntent: "wait-sale",
      importSource: "",
      importedAt: "",
      externalPlaytime: { steam: { appid: null, playtimeForeverMinutes: 0, playtime2WeeksMinutes: 0, lastImportedAt: "" } },
      syncState: "offline",
      priceWatch: { enabled: true, targetPrice: null, currency: "USD", lastNotifiedAt: "" }
    }
  ];

  const wishlistCatalog = [{
    id: "igdb-700100",
    igdbId: 700100,
    title: "Already Wishlisted Title",
    storefront: "steam"
  }];

  const store = createStore({
    initialLibrary: wishlistLibrary,
    catalog: wishlistCatalog,
    persistence: createMemoryPersistence(),
    integrations: {
      ...createBaseIntegrations(),
      steamImport: {
        isConfigured: () => true,
        async resolveProfile() {
          throw new Error("owned path should not run");
        },
        async fetchOwnedGames() {
          throw new Error("owned path should not run");
        },
        async parseWishlistSource() {
          return {
            results: [
              {
                appid: 3552140,
                title: "Steam App 3552140",
                appUrl: "https://store.steampowered.com/app/3552140/",
                importSource: "steam-wishlist-import",
                parseConfidence: "high",
                parseReason: "Steam wishlist API (title unavailable)"
              },
              {
                appid: null,
                title: "Already Wishlisted Title",
                appUrl: "",
                importSource: "steam-wishlist-import",
                parseConfidence: "low",
                parseReason: "Pasted title"
              }
            ],
            summary: {
              total: 2,
              unplayed: 2,
              withAppIds: 1,
              titleOnly: 1
            }
          };
        }
      },
      metadataResolver: {
        ...createBaseIntegrations().metadataResolver,
        async searchGames({ query }) {
          if (query === "Steam App 3552140") {
            return [{
              id: "igdb-342923",
              igdbId: 342923,
              title: "Call of Duty: Modern Warfare III",
              releaseDate: "2023-11-10"
            }];
          }
          return [];
        }
      }
    },
    statusDefinitions,
    storefrontDefinitions
  });

  store.setSteamImportMode("wishlist");
  store.updateSteamImportSource({ wishlistSource: "https://store.steampowered.com/wishlist/id/fixture-user/" });
  await store.fetchSteamWishlistPreview();
  const snapshot = store.getSnapshot();

  const sparse = snapshot.steamImport.candidates.find((row) => row.appid === 3552140);
  assert(sparse, "Expected sparse wishlist Steam App placeholder candidate.");
  assert.equal(sparse.title, "Call of Duty: Modern Warfare III");
  assert.equal(sparse.matchReason, "igdb_title");
  assert.equal(sparse.matchConfidence, "medium");
  assert.equal(sparse.action, "add");

  const titleOnlyExisting = snapshot.steamImport.candidates.find((row) => row.title === "Already Wishlisted Title");
  assert(titleOnlyExisting, "Expected title-only wishlist candidate.");
  assert.equal(titleOnlyExisting.matchStatus, "possible");
  assert.equal(titleOnlyExisting.existingSurface, "wishlist");
  assert.equal(titleOnlyExisting.action, "review");
}

console.log("[checkpoint] Phase 5 Steam fixture matrix verification passed.");
