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
          includeNotes: true
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

  await store.markAllSynced();
  assert(store.getSnapshot().notice?.message.includes("Drive API rejected"), "Expected sync failure notice.");
  assert(store.getSnapshot().syncHistory[0]?.ok === false, "Expected failed sync history entry.");

  const restored = await store.restoreFromGoogleDrive();
  assert(restored === false, "Expected failed Drive restore to return false.");
  assert(store.getSnapshot().notice?.message.includes("Drive restore failed"), "Expected restore failure notice.");
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
}

async function main() {
  await verifyMetadataFailureHandling();
  await verifyArtworkFailureHandling();
  await verifyDriveFailureHandling();
  await verifyLargeLibraryRefreshBehavior();
  console.log("[checkpoint] Phase 2 integration verification passed.");
}

main().catch((error) => {
  console.error("[checkpoint] Phase 2 integration verification failed.");
  console.error(error);
  process.exit(1);
});
