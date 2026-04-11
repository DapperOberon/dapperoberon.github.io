import { strict as assert } from "node:assert";
import { createStore } from "../modules/store.js";
import { renderSettingsView } from "../modules/render/settings.js";
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
          lastView: "settings",
          lastStatusFilter: "all",
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
      isConfigured: () => true,
      async resolveProfile(profile) {
        assert.equal(profile, "https://steamcommunity.com/id/checkpoint-user");
        return {
          steamid: "76561198000000000",
          inputType: "vanity"
        };
      },
      async fetchOwnedGames({ steamid, includeFreePlayed }) {
        assert.equal(steamid, "76561198000000000");
        assert.equal(includeFreePlayed, false);
        return {
          results: [
            {
              appid: 1888930,
              title: "Maybe Match Steam Game",
              appUrl: "https://store.steampowered.com/app/1888930/",
              iconUrl: "",
              logoUrl: "",
              playtimeForeverMinutes: 90,
              playtime2WeeksMinutes: 0,
              hasPlayed: true,
              recentlyPlayed: false,
              importSource: "steam-owned-games"
            },
            {
              appid: 1145350,
              title: "Hades II",
              appUrl: "https://store.steampowered.com/app/1145350/",
              iconUrl: "",
              logoUrl: "",
              playtimeForeverMinutes: 1234,
              playtime2WeeksMinutes: 56,
              hasPlayed: true,
              recentlyPlayed: true,
              importSource: "steam-owned-games"
            },
            {
              appid: 999001,
              title: "Definitely New Steam Game",
              appUrl: "https://store.steampowered.com/app/999001/",
              iconUrl: "",
              logoUrl: "",
              playtimeForeverMinutes: 0,
              playtime2WeeksMinutes: 0,
              hasPlayed: false,
              recentlyPlayed: false,
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
      async searchGames({ query }) {
        if (query === "Definitely New Steam Game") {
          return [{
            id: "igdb-999001",
            igdbId: 999001,
            title: "Definitely New Steam Game",
            releaseDate: "2027-01-01"
          }];
        }
        return [];
      },
      async resolveGameMetadata({ catalogGame }) {
        return {
          ...catalogGame,
          developer: catalogGame?.developer || "Steam Import Studio",
          publisher: catalogGame?.publisher || "Steam Import Publisher",
          heroArt: catalogGame?.heroArt || "https://images.example/hero.jpg",
          capsuleArt: catalogGame?.capsuleArt || "https://images.example/capsule.jpg",
          screenshots: Array.isArray(catalogGame?.screenshots) && catalogGame.screenshots.length
            ? catalogGame.screenshots
            : ["https://images.example/screenshot-1.jpg"],
          meta: { resolved: true, usedFallback: false, reason: "test" }
        };
      },
      async getGameByIgdbId(id) {
        return {
          id: `igdb-${id}`,
          igdbId: id,
          title: id === 999001 ? "Definitely New Steam Game" : "Maybe Match Steam Game",
          developer: "IGDB Studio",
          publisher: "IGDB Publisher",
          releaseDate: "2027-01-01",
          genres: ["Action"],
          platforms: ["PC (Microsoft Windows)"],
          criticSummary: "Resolved from IGDB.",
          description: "Detailed metadata from IGDB.",
          heroArt: "https://images.example/igdb-hero.jpg",
          coverArt: "https://images.example/igdb-cover.jpg",
          screenshots: ["https://images.example/igdb-shot.jpg"],
          videos: [{
            name: "Reveal Trailer",
            url: "https://www.youtube.com/watch?v=test123"
          }],
          links: {
            igdb: "https://www.igdb.com/games/test",
            official: "https://example.com",
            storefronts: []
          }
        };
      },
      async getRelatedGamesByIgdbId() {
        return [{
          id: "igdb-111",
          igdbId: 111,
          title: "Related Steam Import Game",
          releaseDate: "2026-01-01"
        }];
      }
    },
    pricing: {
      isConfigured: () => true,
      async resolvePrice({ title }) {
        return {
          status: "ok",
          currentBest: {
            amount: title === "Definitely New Steam Game" ? 29.99 : 14.99,
            currency: "USD",
            storeName: "Steam",
            url: "https://isthereanydeal.com/game/test/info/"
          },
          storeRows: [{
            storeName: "Steam",
            amount: title === "Definitely New Steam Game" ? 29.99 : 14.99,
            currency: "USD",
            url: "https://isthereanydeal.com/game/test/info/"
          }],
          gameUrl: "https://isthereanydeal.com/game/test/info/",
          lastCheckedAt: "2026-04-10T14:00:00.000Z"
        };
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

const catalog = sampleCatalog.map((game) => (
  game.title === "Hades II"
    ? {
        ...game,
        steam: {
          ...(game.steam ?? {}),
          appid: 1145350,
          appUrl: "https://store.steampowered.com/app/1145350/"
        }
      }
    : game.title === "Outer Wilds"
      ? {
          ...game,
          title: "Maybe Match Steam Game"
        }
    : game
));
const persistence = createMemoryPersistence();
const store = createStore({
  initialLibrary: sampleLibrary,
  catalog,
  persistence,
  integrations: createIntegrations(),
  statusDefinitions,
  storefrontDefinitions
});

store.setSteamImportMode("owned-library");
store.setSettingsSection("settings-imports");
store.updateSteamImportSource({
  steamProfile: "https://steamcommunity.com/id/checkpoint-user",
  includeFreePlayed: false
});
await store.fetchSteamOwnedLibraryPreview();

const snapshot = store.getSnapshot();
assert.equal(snapshot.steamImport.step, "preview");
assert.equal(snapshot.steamImport.loading, false);
assert.equal(snapshot.steamImport.lastResolvedSteamId, "76561198000000000");
assert.equal(snapshot.steamImport.candidates.length, 3);
assert.equal(snapshot.steamImport.summary.total, 3);
assert.equal(snapshot.steamImport.summary.played, 2);
assert.equal(snapshot.steamImport.summary.unplayed, 1);
assert.equal(snapshot.steamImport.summary.recent, 1);
assert.equal(snapshot.steamImport.summary.existing, 1);
assert.equal(snapshot.steamImport.summary.possibleMatches, 1);
assert.equal(snapshot.steamImport.summary.unmatched, 1);

assert.equal(snapshot.steamImport.candidates[0].matchStatus, "possible");
assert.equal(snapshot.steamImport.candidates[1].matchStatus, "existing");
assert.equal(snapshot.steamImport.candidates[2].matchStatus, "unmatched");

const existingCandidate = snapshot.steamImport.candidates.find((row) => row.appid === 1145350);
assert.equal(existingCandidate.matchStatus, "existing");
assert.equal(existingCandidate.proposedStatus, "playing");
assert.equal(existingCandidate.action, "merge");

const possibleCandidate = snapshot.steamImport.candidates.find((row) => row.appid === 1888930);
assert.equal(possibleCandidate.matchStatus, "possible");
assert.equal(possibleCandidate.action, "merge");
assert.equal(possibleCandidate.proposedStatus, "backlog");
assert.equal(possibleCandidate.matchReason, "title");
assert.equal(possibleCandidate.matchConfidence, "high");

const newCandidate = snapshot.steamImport.candidates.find((row) => row.appid === 999001);
assert.equal(newCandidate.matchStatus, "unmatched");
assert.equal(newCandidate.proposedStatus, "backlog");
assert.equal(newCandidate.action, "add");
assert.equal(newCandidate.matchReason, "igdb_title");
assert.equal(newCandidate.igdbSuggestion?.title, "Definitely New Steam Game");

store.setSteamImportStep("rules");
store.updateSteamImportRules({
  defaultDestination: "playing",
  suggestRecentlyPlayedAsPlaying: false,
  duplicateBehavior: "skip"
});

const rulesSnapshot = store.getSnapshot();
assert.equal(rulesSnapshot.steamImport.rules.defaultDestination, "playing");
assert.equal(rulesSnapshot.steamImport.rules.suggestRecentlyPlayedAsPlaying, false);
assert.equal(rulesSnapshot.steamImport.rules.duplicateBehavior, "skip");
assert.equal(
  rulesSnapshot.steamImport.candidates.find((row) => row.appid === 999001)?.proposedStatus,
  "playing"
);
assert.equal(
  rulesSnapshot.steamImport.candidates.find((row) => row.appid === 1145350)?.proposedStatus,
  "playing"
);

const rulesRendered = renderSettingsView(rulesSnapshot, storefrontDefinitions);
assert(rulesRendered.includes("Duplicate Behavior"), "Expected Steam rules copy to render.");
assert(rulesRendered.includes("Skip duplicates"), "Expected duplicate behavior controls to render.");

store.setSteamImportStep("preview");
const rendered = renderSettingsView(store.getSnapshot(), storefrontDefinitions);
assert(rendered.includes("Hades II"), "Expected owned-library candidate title to render.");
assert(rendered.includes("AppID 1145350"), "Expected Steam AppID to render.");
assert(rendered.includes("Exact match"), "Expected exact match badge to render.");

store.setSteamImportStep("review");
store.setSteamImportCandidateAction("steam-1145350", "skip");
const reviewSnapshot = store.getSnapshot();
assert.equal(
  reviewSnapshot.steamImport.candidates.find((row) => row.appid === 1145350)?.action,
  "skip"
);
const reviewRendered = renderSettingsView(reviewSnapshot, storefrontDefinitions);
assert(reviewRendered.includes("Conflict Review"), "Expected review heading to render.");
assert(reviewRendered.includes("Matched existing Steam store URL") || reviewRendered.includes("Exact Steam AppID match"), "Expected match reason text to render.");
assert(reviewRendered.includes("IGDB Suggestion"), "Expected IGDB suggestion block to render.");
assert(reviewRendered.includes("Skip"), "Expected review action controls to render.");

store.setSteamImportStep("import");
const importRendered = renderSettingsView(store.getSnapshot(), storefrontDefinitions);
assert(importRendered.includes("Import Commit"), "Expected import commit summary to render.");
assert(importRendered.includes("Import Selected"), "Expected import CTA to render.");

const previousLibraryCount = store.getSnapshot().library.length;
await store.commitSteamOwnedImport();
const completeSnapshot = store.getSnapshot();
assert.equal(completeSnapshot.steamImport.step, "complete");
assert.equal(completeSnapshot.steamImport.commitResult.added, 1);
assert.equal(completeSnapshot.steamImport.commitResult.merged, 1);
assert.equal(completeSnapshot.steamImport.commitResult.skipped, 1);
assert.equal(completeSnapshot.steamImport.commitResult.enrichment.metadataUpdated, 1);
assert.equal(completeSnapshot.steamImport.commitResult.enrichment.artworkUpdated, 1);
assert.equal(completeSnapshot.steamImport.commitResult.enrichment.pricingUpdated, 2);
assert.equal(completeSnapshot.steamImport.commitResult.enrichment.failed, 0);
assert.equal(completeSnapshot.library.length, previousLibraryCount + 1);
const importedEntry = completeSnapshot.library.find((entry) => entry.title === "Definitely New Steam Game");
assert(importedEntry, "Expected new Steam game to be added to the library.");
assert.equal(importedEntry.status, "playing");
assert.equal(importedEntry.externalPlaytime?.steam?.appid, 999001);
const importedGame = completeSnapshot.catalog.find((game) => game.id === importedEntry.gameId);
assert.equal(importedGame?.developer, "IGDB Studio");
assert.equal(importedGame?.pricing?.currentBest?.storeName, "Steam");
assert.equal(importedGame?.relatedTitles?.[0]?.title, "Related Steam Import Game");
const mergedEntry = completeSnapshot.library.find((entry) => entry.entryId === possibleCandidate.existingEntryId);
assert(mergedEntry, "Expected title-match entry to still exist after merge.");
assert.equal(mergedEntry.externalPlaytime?.steam?.appid, 1888930);
const completeRendered = renderSettingsView(completeSnapshot, storefrontDefinitions);
assert(completeRendered.includes("Import Complete"), "Expected completion surface to render.");
assert(completeRendered.includes("Post-Import Enrichment"), "Expected enrichment summary to render.");

const savedState = persistence.getSavedState();
assert(savedState, "Expected store persistence to run.");
assert.equal(savedState.steamImport, undefined, "Steam import preview must remain transient and unpersisted.");

console.log("[checkpoint] Phase 5 Steam preview verification passed.");
