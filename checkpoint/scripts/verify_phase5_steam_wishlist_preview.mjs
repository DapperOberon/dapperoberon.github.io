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
      async resolveProfile() {
        throw new Error("owned library path should not run in wishlist verifier");
      },
      async fetchOwnedGames() {
        throw new Error("owned library path should not run in wishlist verifier");
      },
      async parseWishlistSource(sourceText) {
        assert(sourceText.includes("store.steampowered.com/app/1888930"), "Expected pasted wishlist source to reach parser.");
        return {
          results: [
            {
              appid: 1888930,
              title: "Maybe Match Steam Game",
              appUrl: "https://store.steampowered.com/app/1888930/",
              importSource: "steam-wishlist-import",
              parseConfidence: "high",
              parseReason: "Steam app URL"
            },
            {
              appid: 1145350,
              title: "Hades II",
              appUrl: "https://store.steampowered.com/app/1145350/",
              importSource: "steam-wishlist-import",
              parseConfidence: "high",
              parseReason: "Steam app URL"
            },
            {
              appid: null,
              title: "New Wishlist Title",
              appUrl: "",
              importSource: "steam-wishlist-import",
              parseConfidence: "low",
              parseReason: "Pasted title"
            }
          ],
          summary: {
            total: 3,
            unplayed: 3,
            withAppIds: 2,
            titleOnly: 1
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
        if (query === "New Wishlist Title") {
          return [{
            id: "igdb-700001",
            igdbId: 700001,
            title: "New Wishlist Title",
            releaseDate: "2027-06-01"
          }];
        }
        return [];
      },
      async resolveGameMetadata({ catalogGame }) {
        return {
          ...catalogGame,
          developer: catalogGame?.developer || "Wishlist Studio",
          publisher: catalogGame?.publisher || "Wishlist Publisher",
          heroArt: catalogGame?.heroArt || "https://images.example/wishlist-hero.jpg",
          capsuleArt: catalogGame?.capsuleArt || "https://images.example/wishlist-capsule.jpg",
          screenshots: Array.isArray(catalogGame?.screenshots) && catalogGame.screenshots.length
            ? catalogGame.screenshots
            : ["https://images.example/wishlist-shot.jpg"],
          meta: { resolved: true, usedFallback: false, reason: "test" }
        };
      },
      async getGameByIgdbId(id) {
        return {
          id: `igdb-${id}`,
          igdbId: id,
          title: id === 700001 ? "New Wishlist Title" : "Maybe Match Steam Game",
          developer: "IGDB Wishlist Studio",
          publisher: "IGDB Wishlist Publisher",
          releaseDate: "2027-06-01",
          genres: ["Adventure"],
          platforms: ["PC (Microsoft Windows)"],
          criticSummary: "Wishlist metadata resolved from IGDB.",
          description: "Detailed wishlist metadata from IGDB.",
          heroArt: "https://images.example/wishlist-igdb-hero.jpg",
          coverArt: "https://images.example/wishlist-igdb-cover.jpg",
          screenshots: ["https://images.example/wishlist-igdb-shot.jpg"],
          videos: [{
            name: "Wishlist Reveal",
            url: "https://www.youtube.com/watch?v=wishlist123"
          }],
          links: {
            igdb: "https://www.igdb.com/games/wishlist-test",
            official: "https://wishlist.example.com",
            storefronts: []
          }
        };
      },
      async getRelatedGamesByIgdbId() {
        return [{
          id: "igdb-710001",
          igdbId: 710001,
          title: "Related Wishlist Title",
          releaseDate: "2028-01-01"
        }];
      }
    },
    pricing: {
      isConfigured: () => true,
      async resolvePrice({ title }) {
        return {
          status: title === "New Wishlist Title" ? "no_match" : "ok",
          currentBest: {
            amount: title === "New Wishlist Title" ? null : 19.99,
            currency: "USD",
            storeName: title === "New Wishlist Title" ? "" : "Steam",
            url: title === "New Wishlist Title" ? "" : "https://isthereanydeal.com/game/wishlist/info/"
          },
          storeRows: [],
          gameUrl: "https://isthereanydeal.com/game/wishlist/info/",
          lastCheckedAt: "2026-04-11T12:00:00.000Z"
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

store.setSteamImportMode("wishlist");
store.setSettingsSection("settings-imports");
store.updateSteamImportSource({
  wishlistSource: `https://steamcommunity.com/id/checkpoint-user/wishlist
https://store.steampowered.com/app/1888930/
https://store.steampowered.com/app/1145350/
New Wishlist Title`
});

await store.fetchSteamWishlistPreview();

const snapshot = store.getSnapshot();
assert.equal(snapshot.steamImport.step, "preview");
assert.equal(snapshot.steamImport.candidates.length, 3);
assert.equal(snapshot.steamImport.summary.withAppIds, 2);
assert.equal(snapshot.steamImport.summary.titleOnly, 1);
assert.equal(snapshot.steamImport.summary.existing, 1);
assert.equal(snapshot.steamImport.summary.possibleMatches, 1);
assert.equal(snapshot.steamImport.summary.unmatched, 1);

const existingWishlistCandidate = snapshot.steamImport.candidates.find((row) => row.appid === 1888930);
assert.equal(existingWishlistCandidate.matchStatus, "possible");
assert.equal(existingWishlistCandidate.proposedStatus, "wishlist");
assert.equal(existingWishlistCandidate.action, "review");

const existingLibraryCandidate = snapshot.steamImport.candidates.find((row) => row.appid === 1145350);
assert.equal(existingLibraryCandidate.matchStatus, "existing");
assert.equal(existingLibraryCandidate.existingSurface, "library");
assert.equal(existingLibraryCandidate.action, "merge");

const newCandidate = snapshot.steamImport.candidates.find((row) => row.title === "New Wishlist Title");
assert.equal(newCandidate.matchStatus, "unmatched");
assert.equal(newCandidate.action, "add");
assert.equal(newCandidate.proposedStatus, "wishlist");

const previewRendered = renderSettingsView(snapshot, storefrontDefinitions);
assert(previewRendered.includes("With AppIDs"), "Expected wishlist summary tiles to render.");
assert(previewRendered.includes("Title-only parse"), "Expected wishlist preview rows to render title-only copy.");
assert(previewRendered.includes('data-step="review"'), "Expected wishlist preview footer to include a Review step target.");

store.setSteamImportStep("review");
const reviewRendered = renderSettingsView(store.getSnapshot(), storefrontDefinitions);
assert(reviewRendered.includes("Proposed Wishlist"), "Expected wishlist review rows to render Wishlist as the proposed status.");
assert(!reviewRendered.includes("Proposed Backlog"), "Wishlist review rows should not render Backlog as the proposed status.");
assert(reviewRendered.includes('data-step="rules"'), "Expected wishlist review footer to include a Back To Rules step target.");
assert(reviewRendered.includes('data-step="import"'), "Expected wishlist review footer to include an Import step target.");

store.setSteamImportStep("review");
store.setSteamImportCandidateAction("1145350", "skip");
store.setSteamImportCandidateAction("1888930", "skip");
const reviewSnapshot = store.getSnapshot();
assert.equal(reviewSnapshot.steamImport.candidates.find((row) => row.appid === 1145350)?.action, "skip");
assert.equal(reviewSnapshot.steamImport.candidates.find((row) => row.appid === 1888930)?.action, "skip");

store.setSteamImportStep("import");
await store.commitSteamOwnedImport();
const completeSnapshot = store.getSnapshot();
assert.equal(completeSnapshot.steamImport.step, "complete");
assert.equal(completeSnapshot.steamImport.commitResult.added, 1);
assert.equal(completeSnapshot.steamImport.commitResult.merged, 0);
assert.equal(completeSnapshot.steamImport.commitResult.skipped, 2);
const importedEntry = completeSnapshot.library.find((entry) => entry.title === "New Wishlist Title");
assert(importedEntry, "Expected new wishlist title to be imported.");
assert.equal(importedEntry.status, "wishlist");
assert.equal(importedEntry.importSource, "steam-wishlist-import");
const importedGame = completeSnapshot.catalog.find((game) => game.id === importedEntry.gameId);
assert.equal(importedGame?.steam?.importSource, "steam-wishlist-import");
assert(importedGame?.steam?.wishlistImportedAt, "Expected wishlistImportedAt to be stored.");
assert.equal(importedGame?.relatedTitles?.[0]?.title, "Related Wishlist Title");

const completeRendered = renderSettingsView(completeSnapshot, storefrontDefinitions);
assert(completeRendered.includes("Steam wishlist import finished:"), "Expected wishlist completion copy to render.");

await store.fetchSteamWishlistPreview();
const repeatPreviewSnapshot = store.getSnapshot();
assert.equal(repeatPreviewSnapshot.steamImport.candidates.length, 3);
assert.equal(repeatPreviewSnapshot.steamImport.candidates.find((row) => row.appid === 1888930)?.matchStatus, "possible");
assert.equal(repeatPreviewSnapshot.steamImport.candidates.find((row) => row.appid === 1888930)?.action, "review");
assert.equal(repeatPreviewSnapshot.steamImport.candidates.find((row) => row.appid === 1145350)?.matchStatus, "existing");
assert.equal(repeatPreviewSnapshot.steamImport.candidates.find((row) => row.appid === 1145350)?.action, "merge");
assert.equal(repeatPreviewSnapshot.steamImport.candidates.find((row) => row.title === "New Wishlist Title")?.matchStatus, "possible");
assert.equal(repeatPreviewSnapshot.steamImport.candidates.find((row) => row.title === "New Wishlist Title")?.action, "review");

store.setSteamImportCandidateAction("1888930", "skip");
store.setSteamImportCandidateAction("new wishlist title", "skip");

const libraryCountBeforeRepeatCommit = repeatPreviewSnapshot.library.length;
await store.commitSteamOwnedImport();
const repeatCompleteSnapshot = store.getSnapshot();
assert.equal(repeatCompleteSnapshot.library.length, libraryCountBeforeRepeatCommit, "Repeat wishlist import must not create duplicate entries.");
assert.equal(repeatCompleteSnapshot.steamImport.commitResult.added, 0);
assert.equal(repeatCompleteSnapshot.steamImport.commitResult.merged, 1);
assert.equal(repeatCompleteSnapshot.steamImport.commitResult.skipped, 2);
const repeatedWishlistEntries = repeatCompleteSnapshot.library.filter((entry) => entry.title === "New Wishlist Title");
assert.equal(repeatedWishlistEntries.length, 1, "Repeat wishlist import should keep a single wishlist entry for the imported title.");

console.log("[checkpoint] Phase 5 Steam wishlist preview verification passed.");
