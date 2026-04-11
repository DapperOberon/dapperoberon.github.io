import { strict as assert } from "node:assert";
import { APP_STATE_SCHEMA_VERSION, normalizePersistedState } from "../modules/schema.js";
import { normalizeCatalogGame, normalizeLibraryEntry } from "../modules/normalization.js";

const initialLibrary = [];
const initialCatalog = [];

const normalizedGame = normalizeCatalogGame({
  id: "steam-123",
  title: "Steam Test Game",
  storefront: "steam",
  steam: {
    appid: "123",
    appUrl: "https://store.steampowered.com/app/123/Steam_Test_Game/",
    playtime_forever: "240",
    playtime_2weeks: "30",
    lastImportedAt: "2026-04-10T12:00:00.000Z",
    lastRefreshedAt: "2026-04-10T13:00:00.000Z",
    importSource: "steam-owned-games"
  }
});

assert.equal(normalizedGame.steam.appid, 123);
assert.equal(normalizedGame.steam.playtimeForeverMinutes, 240);
assert.equal(normalizedGame.steam.playtime2WeeksMinutes, 30);
assert.equal(normalizedGame.steam.importSource, "steam-owned-games");
assert.equal(normalizedGame.playtimeHours, undefined, "Catalog Steam playtime must not create Checkpoint progress fields.");

const normalizedEntry = normalizeLibraryEntry({
  entryId: "entry-steam-test",
  gameId: "steam-123",
  title: "Steam Test Game",
  status: "backlog",
  playtimeHours: 7,
  completionPercent: 12,
  importSource: "steam-owned-games",
  importedAt: "2026-04-10T12:01:00.000Z",
  externalPlaytime: {
    steam: {
      appid: 123,
      playtimeForeverMinutes: 240,
      playtime2WeeksMinutes: 30,
      lastImportedAt: "2026-04-10T12:00:00.000Z"
    }
  }
});

assert.equal(normalizedEntry.playtimeHours, 7, "Steam metadata must not overwrite Checkpoint playtime.");
assert.equal(normalizedEntry.completionPercent, 12, "Steam metadata must not overwrite Checkpoint completion.");
assert.equal(normalizedEntry.externalPlaytime.steam.appid, 123);
assert.equal(normalizedEntry.externalPlaytime.steam.playtimeForeverMinutes, 240);
assert.equal(normalizedEntry.externalPlaytime.steam.playtime2WeeksMinutes, 30);

const migrated = normalizePersistedState({
  schemaVersion: 9,
  library: [normalizedEntry],
  catalog: [normalizedGame],
  syncPreferences: {},
  activityHistory: [],
  syncHistory: [],
  uiPreferences: {},
  deviceIdentity: {},
  syncMeta: {}
}, {
  initialLibrary,
  initialCatalog
});

assert.equal(migrated.schemaVersion, APP_STATE_SCHEMA_VERSION);
assert.equal(migrated.library[0].playtimeHours, 7);
assert.equal(migrated.library[0].externalPlaytime.steam.playtimeForeverMinutes, 240);
assert.equal(migrated.catalog[0].steam.appid, 123);
assert.equal(migrated.catalog[0].steam.playtime2WeeksMinutes, 30);

const emptyEntry = normalizeLibraryEntry({
  entryId: "entry-no-steam",
  gameId: "manual-1",
  title: "Manual Game"
});

assert.deepEqual(emptyEntry.externalPlaytime.steam, {
  appid: null,
  playtimeForeverMinutes: 0,
  playtime2WeeksMinutes: 0,
  lastImportedAt: ""
});

console.log("[checkpoint] Phase 5 Steam model verification passed.");
