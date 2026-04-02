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
  };
}
