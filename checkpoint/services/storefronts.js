import { createMockStorefrontMetadata } from "./mock-data.js";
import { getServiceConfig } from "./config.js";

function normalizeWorkerUrl(workerUrl) {
  return String(workerUrl ?? "").trim().replace(/\/+$/, "");
}

async function requestJson(url, init = undefined) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Metadata proxy request failed with status ${response.status}`);
  }

  return response.json();
}

export function createMetadataResolverService() {
  return {
    isConfigured() {
      return Boolean(normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl));
    },

    async resolveGameMetadata({ title, storefront, catalogGame }) {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);

      if (!workerUrl) {
        return createMockStorefrontMetadata({ title, storefront, catalogGame, meta: { reason: "missing_worker_url" } });
      }

      try {
        const metadata = await requestJson(
          `${workerUrl}/api/igdb/metadata?title=${encodeURIComponent(title)}&storefront=${encodeURIComponent(storefront)}`
        );

        return {
          developer: metadata.developer || catalogGame?.developer || "",
          publisher: metadata.publisher || catalogGame?.publisher || "",
          releaseDate: metadata.releaseDate || catalogGame?.releaseDate || "",
          genres: metadata.genres?.length ? metadata.genres : (catalogGame?.genres ?? []),
          platforms: metadata.platforms?.length ? metadata.platforms : (catalogGame?.platforms ?? []),
          criticSummary: metadata.criticSummary || catalogGame?.criticSummary || "",
          description: metadata.description || catalogGame?.description || "",
          steamGridSlug: catalogGame?.steamGridSlug ?? "",
          meta: metadata.meta ?? {
            resolved: false,
            usedFallback: true,
            reason: "worker_proxy"
          }
        };
      } catch (error) {
        return createMockStorefrontMetadata({ title, storefront, catalogGame, meta: { reason: "worker_request_failed" } });
      }
    },

    async searchGames({ query }) {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);
      const normalizedQuery = String(query ?? "").trim();
      if (!workerUrl || !normalizedQuery) {
        return [];
      }

      try {
        const payload = await requestJson(
          `${workerUrl}/api/igdb/search?query=${encodeURIComponent(normalizedQuery)}`
        );
        return Array.isArray(payload?.results) ? payload.results : [];
      } catch (error) {
        return [];
      }
    }
    ,

    async getGameByIgdbId(id) {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);
      const numericId = Number(id);
      if (!workerUrl || !Number.isFinite(numericId) || numericId <= 0) {
        return null;
      }

      try {
        const payload = await requestJson(
          `${workerUrl}/api/igdb/game?id=${encodeURIComponent(String(Math.floor(numericId)))}`
        );
        if (!payload || typeof payload !== "object") return null;
        return {
          id: payload.id || `igdb-${numericId}`,
          igdbId: Number.isFinite(Number(payload.igdbId)) ? Number(payload.igdbId) : numericId,
          title: payload.title || "",
          releaseDate: payload.releaseDate || "",
          developer: payload.developer || "",
          publisher: payload.publisher || "",
          genres: Array.isArray(payload.genres) ? payload.genres : [],
          platforms: Array.isArray(payload.platforms) ? payload.platforms : [],
          criticSummary: payload.criticSummary || "",
          description: payload.description || "",
          coverArt: payload.coverArt || "",
          heroArt: payload.heroArt || "",
          screenshots: Array.isArray(payload.screenshots) ? payload.screenshots : [],
          videos: Array.isArray(payload.videos) ? payload.videos : [],
          links: payload.links && typeof payload.links === "object"
            ? payload.links
            : { igdb: "", official: "", storefronts: [] },
          meta: payload.meta ?? {
            resolved: false,
            usedFallback: true,
            reason: "worker_proxy"
          }
        };
      } catch (error) {
        return null;
      }
    },

    async getRelatedGamesByIgdbId(id, limit = 12) {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);
      const numericId = Number(id);
      const normalizedLimit = Number.isFinite(Number(limit))
        ? Math.max(4, Math.min(24, Math.floor(Number(limit))))
        : 12;
      if (!workerUrl || !Number.isFinite(numericId) || numericId <= 0) {
        return [];
      }

      try {
        const payload = await requestJson(
          `${workerUrl}/api/igdb/related?id=${encodeURIComponent(String(Math.floor(numericId)))}&limit=${encodeURIComponent(String(normalizedLimit))}`
        );
        return Array.isArray(payload?.results) ? payload.results : [];
      } catch (error) {
        return [];
      }
    },

    async getTopPlayedGames() {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);
      if (!workerUrl) {
        throw new Error("missing_worker_url");
      }

      const payload = await requestJson(`${workerUrl}/api/igdb/top-played?limit=50`);
      return Array.isArray(payload?.results) ? payload.results : [];
    }
  };
}
