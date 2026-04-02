import { createStore } from "../modules/store.js";
import { sampleCatalog, sampleLibrary, statusDefinitions, storefrontDefinitions } from "../data/sample-data.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

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
          librarySort: "updated_desc"
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

function buildLargeLibrary() {
  const clones = [];

  for (let i = 0; i < 18; i += 1) {
    const baseEntry = sampleLibrary[i % sampleLibrary.length];
    clones.push({
      ...baseEntry,
      entryId: `${baseEntry.entryId}-${i}`,
      runLabel: `${baseEntry.runLabel} ${i + 1}`,
      updatedAt: new Date(Date.now() - i * 86_400_000).toISOString()
    });
  }

  return clones;
}

function createIntegrations({
  metadataResolver,
  steamGrid,
  googleDrive
}) {
  return {
    metadataResolver: metadataResolver ?? {
      isConfigured: () => true,
      async searchGames({ query }) {
        const normalized = String(query ?? "").trim().toLowerCase();
        if (!normalized) return [];
        return [
          {
            id: `search-${normalized}`,
            igdbId: 101,
            title: query,
            releaseDate: "2024-01-01",
            platforms: ["PC"],
            coverArt: ""
          }
        ];
      },
      async resolveGameMetadata({ catalogGame }) {
        return {
          developer: catalogGame?.developer ?? "",
          publisher: catalogGame?.publisher ?? "",
          releaseDate: catalogGame?.releaseDate ?? "",
          genres: catalogGame?.genres ?? [],
          platforms: catalogGame?.platforms ?? [],
          criticSummary: catalogGame?.criticSummary ?? "",
          description: catalogGame?.description ?? "",
          steamGridSlug: catalogGame?.steamGridSlug ?? "",
          meta: { resolved: true, usedFallback: false, reason: "test" }
        };
      }
    },
    steamGrid: steamGrid ?? {
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
    googleDrive: googleDrive ?? {
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

function createTestStore({ library = sampleLibrary, catalog = sampleCatalog, integrations }) {
  const persistence = createMemoryPersistence();

  return createStore({
    initialLibrary: library,
    catalog,
    persistence,
    integrations,
    statusDefinitions,
    storefrontDefinitions
  });
}

async function verifyMetadataFailureHandling() {
  const store = createTestStore({
    integrations: createIntegrations({
      metadataResolver: {
        isConfigured: () => true,
        async resolveGameMetadata({ catalogGame }) {
          return {
            developer: catalogGame?.developer ?? "",
            publisher: catalogGame?.publisher ?? "",
            releaseDate: catalogGame?.releaseDate ?? "",
            genres: catalogGame?.genres ?? [],
            platforms: catalogGame?.platforms ?? [],
            criticSummary: catalogGame?.criticSummary ?? "",
            description: catalogGame?.description ?? "",
            steamGridSlug: catalogGame?.steamGridSlug ?? "",
            meta: { resolved: false, usedFallback: true, reason: "no_match" }
          };
        }
      }
    })
  });

  const before = store.getSnapshot().activeEntry;
  const beforeNotes = before.notes;
  const beforePlaytime = before.playtimeHours;
  const changed = await store.refreshMetadataForEntry(before.entryId);
  const after = store.getSnapshot().activeEntry;

  assert(changed === false, "Expected metadata no-match refresh to report no change.");
  assert(store.getSnapshot().notice?.message.includes("current metadata stayed in place"), "Expected metadata no-match notice.");
  assert(after.notes === beforeNotes, "Metadata refresh should not change notes.");
  assert(after.playtimeHours === beforePlaytime, "Metadata refresh should not change playtime.");
}

async function verifyArtworkFailureHandling() {
  const store = createTestStore({
    integrations: createIntegrations({
      steamGrid: {
        isConfigured: () => true,
        async resolveArtwork({ catalogGame }) {
          return {
            heroArt: catalogGame?.heroArt ?? "",
            capsuleArt: catalogGame?.capsuleArt ?? "",
            screenshots: catalogGame?.screenshots ?? [],
            meta: { resolved: false, usedFallback: true, reason: "worker_request_failed" }
          };
        }
      }
    })
  });

  const changed = await store.refreshArtworkForEntry(store.getSnapshot().activeEntry.entryId);

  assert(changed === false, "Expected artwork failure refresh to report no change.");
  assert(store.getSnapshot().notice?.message.includes("could not be refreshed"), "Expected artwork failure notice.");
}

async function verifyDriveFailureHandling() {
  const store = createTestStore({
    integrations: createIntegrations({
      googleDrive: {
        isConfigured: () => true,
        getStatus: () => ({ available: true, connected: true, clientConfigured: true }),
        async connect() {
          return { ok: true, mode: "oauth", message: "connected" };
        },
        disconnect() {
          return { ok: true, mode: "oauth", message: "disconnected" };
        },
        async syncAppState() {
          return { ok: false, mode: "manual", message: "Drive API rejected the upload." };
        },
        async restoreAppState() {
          throw new Error("Drive restore failed.");
        }
      }
    })
  });

  await store.syncNow();
  assert(store.getSnapshot().notice?.message.includes("Drive API rejected"), "Expected sync failure notice.");
  assert(store.getSnapshot().syncHistory[0]?.ok === false, "Expected failed sync history entry.");
  assert(store.getSnapshot().activityHistory[0]?.category === "sync", "Expected sync activity entry after failed sync.");

  const restored = await store.restoreFromGoogleDrive();
  assert(restored === false, "Expected failed Drive restore to return false.");
  assert(store.getSnapshot().notice?.message.includes("Drive restore failed"), "Expected restore failure notice.");
}

async function verifySyncPreferencePayloadFiltering() {
  let capturedPayload = null;

  const store = createTestStore({
    integrations: createIntegrations({
      googleDrive: {
        isConfigured: () => true,
        getStatus: () => ({ available: true, connected: true, clientConfigured: true }),
        async connect() {
          return { ok: true, mode: "oauth", message: "connected" };
        },
        disconnect() {
          return { ok: true, mode: "oauth", message: "disconnected" };
        },
        async syncAppState({ state, mode }) {
          capturedPayload = { state, mode };
          return {
            ok: true,
            mode,
            message: "Sync complete.",
            remote: {
              syncedAt: new Date().toISOString(),
              fileId: "drive-file-1",
              modifiedTime: new Date().toISOString(),
              version: "1"
            }
          };
        },
        async restoreAppState() {
          throw new Error("not needed");
        }
      }
    })
  });

  const beforeSnapshot = store.getSnapshot();
  const beforeNotes = beforeSnapshot.library[0]?.notes ?? "";
  const beforeHeroArt = beforeSnapshot.catalog[0]?.heroArt ?? "";
  const beforeActivityCount = beforeSnapshot.activityHistory.length;
  const beforeSyncHistoryCount = beforeSnapshot.syncHistory.length;

  store.openAddModal();
  store.beginManualAdd();
  store.updateAddForm({
    title: "History Pref Test",
    storefront: "steam",
    status: "playing",
    runLabel: "Main Save"
  });
  await store.commitEntry({
    runLabel: "Main Save",
    playtimeHours: "1",
    completionPercent: "5",
    notes: "history pref test"
  });

  store.togglePreference("includeNotes");
  store.togglePreference("includeArtwork");
  store.togglePreference("includeActivityHistory");
  await store.syncNow();

  assert(capturedPayload?.state, "Expected sync payload to be captured.");
  assert(capturedPayload.mode === "manual", "Expected manual sync mode for explicit Sync Now.");
  assert(capturedPayload.state.library.every((entry) => entry.notes === ""), "Expected notes to be omitted from sync payload.");
  assert(
    capturedPayload.state.catalog.every((game) => !game.heroArt && !game.capsuleArt && Array.isArray(game.screenshots) && game.screenshots.length === 0),
    "Expected artwork to be omitted from sync payload."
  );
  assert(Array.isArray(capturedPayload.state.activityHistory) && capturedPayload.state.activityHistory.length === 0, "Expected activity history to be omitted from sync payload.");
  assert(Array.isArray(capturedPayload.state.syncHistory) && capturedPayload.state.syncHistory.length === 0, "Expected sync history to be omitted from sync payload when activity history sync is off.");

  const afterSnapshot = store.getSnapshot();
  assert((afterSnapshot.library[0]?.notes ?? "") === beforeNotes, "Expected local notes to remain unchanged after filtered sync.");
  assert((afterSnapshot.catalog[0]?.heroArt ?? "") === beforeHeroArt, "Expected local artwork to remain unchanged after filtered sync.");
  assert(afterSnapshot.activityHistory.length >= beforeActivityCount, "Expected local activity history to remain intact after filtered sync.");
  assert(afterSnapshot.syncHistory.length >= beforeSyncHistoryCount, "Expected local sync history to remain intact after filtered sync.");

  const beforePrefs = JSON.stringify(afterSnapshot.syncPreferences);
  store.togglePreference("not-a-real-preference");
  const afterPrefs = JSON.stringify(store.getSnapshot().syncPreferences);
  assert(beforePrefs === afterPrefs, "Expected invalid sync preference keys to be ignored.");
}

async function verifyLargeLibraryRefreshBehavior() {
  const library = buildLargeLibrary();
  let metadataCalls = 0;
  let artworkCalls = 0;

  const store = createTestStore({
    library,
    integrations: createIntegrations({
      metadataResolver: {
        isConfigured: () => true,
        async resolveGameMetadata({ title, storefront, catalogGame }) {
          metadataCalls += 1;
          return {
            developer: catalogGame?.developer ?? "Updated Dev",
            publisher: catalogGame?.publisher ?? "Updated Publisher",
            releaseDate: catalogGame?.releaseDate ?? "2026-01-01",
            genres: catalogGame?.genres?.length ? catalogGame.genres : ["Updated Genre"],
            platforms: catalogGame?.platforms?.length ? catalogGame.platforms : [storefront],
            criticSummary: catalogGame?.criticSummary || `${title} updated`,
            description: catalogGame?.description || `${title} updated description`,
            steamGridSlug: catalogGame?.steamGridSlug || title.toLowerCase().replace(/\s+/g, "-"),
            meta: { resolved: true, usedFallback: false, reason: "bulk-test" }
          };
        }
      },
      steamGrid: {
        isConfigured: () => true,
        async resolveArtwork({ catalogGame, title }) {
          artworkCalls += 1;
          return {
            heroArt: `${catalogGame?.heroArt ?? "https://example.com" }?bulk=${encodeURIComponent(title)}`,
            capsuleArt: `${catalogGame?.capsuleArt ?? "https://example.com" }?bulk=${encodeURIComponent(title)}`,
            screenshots: catalogGame?.screenshots ?? [],
            meta: { resolved: true, usedFallback: false, reason: "bulk-test" }
          };
        }
      }
    })
  });

  const entryCountBefore = store.getSnapshot().library.length;
  const metadataOk = await store.refreshLibraryMetadata();
  const artworkOk = await store.refreshLibraryArtwork();
  const snapshot = store.getSnapshot();

  assert(metadataOk === true, "Expected bulk metadata refresh to complete.");
  assert(artworkOk === true, "Expected bulk artwork refresh to complete.");
  assert(snapshot.library.length === entryCountBefore, "Bulk refresh should not change library entry count.");
  assert(metadataCalls > 0, "Expected bulk metadata refresh to call the resolver.");
  assert(artworkCalls > 0, "Expected bulk artwork refresh to call the artwork service.");
  assert(snapshot.activityHistory.some((entry) => entry.category === "refresh"), "Expected refresh activity entries to be captured.");
}

async function verifyAddFlowPaths() {
  let searchCallCount = 0;
  const store = createTestStore({
    library: [],
    catalog: [],
    integrations: createIntegrations({
      metadataResolver: {
        isConfigured: () => true,
        async searchGames({ query }) {
          searchCallCount += 1;
          const normalized = String(query ?? "").trim().toLowerCase();
          if (!normalized.includes("sable")) return [];
          return [
            {
              id: "igdb-sable",
              igdbId: 2222,
              title: "Sable",
              releaseDate: "2021-09-23",
              platforms: ["PC", "Xbox"],
              coverArt: ""
            }
          ];
        },
        async resolveGameMetadata({ title, storefront, catalogGame }) {
          return {
            developer: "Mock Dev",
            publisher: "Mock Publisher",
            releaseDate: catalogGame?.releaseDate ?? "2021-09-23",
            genres: ["Adventure"],
            platforms: catalogGame?.platforms?.length ? catalogGame.platforms : [storefront],
            criticSummary: `${title} metadata resolved`,
            description: `${title} description`,
            steamGridSlug: title.toLowerCase().replace(/\s+/g, "-"),
            meta: { resolved: true, usedFallback: false, reason: "add-flow-test" }
          };
        }
      },
      steamGrid: {
        isConfigured: () => true,
        async resolveArtwork({ title }) {
          return {
            heroArt: `https://example.com/${encodeURIComponent(title)}/hero.jpg`,
            capsuleArt: `https://example.com/${encodeURIComponent(title)}/cover.jpg`,
            screenshots: [],
            meta: { resolved: true, usedFallback: false, reason: "add-flow-test" }
          };
        }
      }
    })
  });

  store.openAddModal();
  store.updateAddForm({ searchQuery: "sable" });
  await store.searchAddCatalog("sable");
  let snapshot = store.getSnapshot();
  assert(searchCallCount > 0, "Expected add-flow IGDB search to run.");
  assert(snapshot.addSearchResults.length === 1, "Expected one add-flow IGDB result.");

  store.selectAddSearchResult("igdb-sable");
  snapshot = store.getSnapshot();
  assert(snapshot.addForm.step === "log", "Expected selecting search result to move add flow to log step.");
  assert(snapshot.addForm.mode === "search", "Expected selected result add flow mode to remain search.");

  await store.commitEntry({
    runLabel: "Main Save",
    playtimeHours: "12.5",
    completionPercent: "37",
    notes: "IGDB path run."
  });

  snapshot = store.getSnapshot();
  const igdbEntry = snapshot.library.find((entry) => entry.title === "Sable");
  assert(Boolean(igdbEntry), "Expected IGDB add path to create a library entry.");
  assert(igdbEntry.playtimeHours === 12.5, "Expected IGDB add path to save playtime from add form.");
  assert(igdbEntry.completionPercent === 37, "Expected IGDB add path to save completion from add form.");
  assert(igdbEntry.notes.includes("IGDB path run"), "Expected IGDB add path to save notes.");

  store.openAddModal();
  store.updateAddForm({ searchQuery: "no-match-title" });
  await store.searchAddCatalog("no-match-title");
  snapshot = store.getSnapshot();
  assert(snapshot.addSearchResults.length === 0, "Expected no results for manual fallback test.");
  assert(snapshot.addSearchError.includes("No matches found"), "Expected fallback prompt when add search has no matches.");

  store.beginManualAdd();
  store.updateAddForm({
    title: "Manual Adventure",
    storefront: "gog",
    status: "wishlist",
    runLabel: "Manual Run"
  });
  await store.commitEntry({
    runLabel: "Manual Run",
    playtimeHours: "3",
    completionPercent: "15",
    notes: "Manual fallback path."
  });

  snapshot = store.getSnapshot();
  const manualEntry = snapshot.library.find((entry) => entry.title === "Manual Adventure");
  assert(Boolean(manualEntry), "Expected manual fallback path to create a library entry.");
  assert(manualEntry.storefront === "gog", "Expected manual fallback path to keep selected storefront.");
  assert(manualEntry.status === "wishlist", "Expected manual fallback path to keep selected status.");
  assert(manualEntry.playtimeHours === 3, "Expected manual fallback path to save playtime.");
  assert(manualEntry.completionPercent === 15, "Expected manual fallback path to save completion.");
}

async function main() {
  await verifyMetadataFailureHandling();
  await verifyArtworkFailureHandling();
  await verifyDriveFailureHandling();
  await verifySyncPreferencePayloadFiltering();
  await verifyLargeLibraryRefreshBehavior();
  await verifyAddFlowPaths();
  console.log("[checkpoint] Integration verification passed.");
}

main().catch((error) => {
  console.error("[checkpoint] Phase 2 integration verification failed.");
  console.error(error);
  process.exit(1);
});
