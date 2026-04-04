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

function normalizePath(pathname) {
  return String(pathname || "/").replace(/\/{2,}/g, "/");
}

function getCheckpointBasePath(pathname = globalThis.location?.pathname || "/checkpoint/") {
  const normalized = normalizePath(pathname);
  const marker = "/checkpoint";
  const index = normalized.indexOf(marker);
  if (index === -1) return "/checkpoint";
  return normalized.slice(0, index + marker.length);
}

function parseRouteFromLocation(locationLike = globalThis.location) {
  const pathname = normalizePath(locationLike?.pathname || "/");
  const searchParams = new URLSearchParams(locationLike?.search || "");
  const basePath = getCheckpointBasePath(pathname);
  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;
  const segments = relativePath
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  const surface = (segments[0] || "library").toLowerCase();
  const isGameDetails = segments[1] === "game";
  const id = searchParams.get("id");

  return {
    basePath,
    surface: ["library", "discover", "wishlist", "settings"].includes(surface) ? surface : "library",
    isGameDetails,
    id: id ? String(id).trim() : ""
  };
}

function buildRouteFromSnapshot(snapshot, basePath = getCheckpointBasePath()) {
  const normalizedBase = String(basePath || "/checkpoint").replace(/\/+$/, "");
  const activeEntryGameId = String(snapshot?.activeEntry?.gameId ?? "").trim();
  const lastView = String(snapshot?.uiPreferences?.lastView || "dashboard");
  const discoverResultId = String(snapshot?.addForm?.selectedSearchResult?.igdbId ?? "").trim()
    || String(snapshot?.addForm?.selectedSearchResult?.id ?? "").trim();

  if (snapshot.currentView === "settings") {
    return `${normalizedBase}/settings/`;
  }

  if (snapshot.currentView === "discover") {
    if (discoverResultId) {
      return `${normalizedBase}/discover/game/?id=${encodeURIComponent(discoverResultId)}`;
    }
    return `${normalizedBase}/discover/`;
  }

  if (snapshot.currentView === "wishlist") {
    return `${normalizedBase}/wishlist/`;
  }

  if (snapshot.currentView === "details" && activeEntryGameId) {
    const detailsSurface = lastView === "discover"
      ? "discover"
      : (lastView === "wishlist" ? "wishlist" : "library");
    return `${normalizedBase}/${detailsSurface}/game/?id=${encodeURIComponent(activeEntryGameId)}`;
  }

  return `${normalizedBase}/library/`;
}

let isApplyingRoute = false;

function applyRouteToStore(route) {
  isApplyingRoute = true;
  try {
    if (route.surface === "settings") {
      store.setView("settings");
      return;
    }

    if (route.surface === "discover" && !route.isGameDetails) {
      store.setView("discover");
      store.clearDiscoverSelection?.();
      return;
    }

    if (route.surface === "discover" && route.isGameDetails) {
      if (route.id) {
        void store.openDiscoverGameById?.(route.id);
        return;
      }
      store.clearDiscoverSelection?.();
      void store.openDiscover();
      return;
    }

    if (route.surface === "wishlist" && route.isGameDetails) {
      const opened = route.id ? store.openDetailsByGameId(route.id, "wishlist") : false;
      if (!opened) {
        store.setView("wishlist");
      }
      return;
    }

    if (route.surface === "wishlist") {
      store.setView("wishlist");
      return;
    }

    if (route.surface === "library" && route.isGameDetails) {
      const opened = route.id ? store.openDetailsByGameId(route.id, "dashboard") : false;
      if (!opened) {
        store.setView("dashboard");
      }
      return;
    }

    store.setView("dashboard");
  } finally {
    isApplyingRoute = false;
  }
}

store.subscribe((snapshot) => {
  renderer.render();

  if (isApplyingRoute) return;

  const targetRoute = buildRouteFromSnapshot(snapshot);
  const currentRoute = `${normalizePath(globalThis.location?.pathname || "/")}${globalThis.location?.search || ""}`;
  if (!targetRoute || targetRoute === currentRoute) {
    return;
  }
  globalThis.history?.pushState?.({}, "", targetRoute);
});

globalThis.addEventListener?.("popstate", () => {
  const route = parseRouteFromLocation(globalThis.location);
  applyRouteToStore(route);
});

const initialRoute = parseRouteFromLocation(globalThis.location);
applyRouteToStore(initialRoute);
renderer.render();
