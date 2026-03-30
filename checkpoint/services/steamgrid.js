import { createMockArtworkResult } from "./mock-data.js";
import { getServiceConfig } from "./config.js";

function normalizeWorkerUrl(workerUrl) {
  return String(workerUrl ?? "").trim().replace(/\/+$/, "");
}

async function requestJson(url, init = undefined) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`SteamGrid proxy request failed with status ${response.status}`);
  }

  return response.json();
}

export function createSteamGridService() {
  return {
    isConfigured() {
      return Boolean(normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl));
    },

    async resolveArtwork({ title, storefront, catalogGame }) {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);

      if (!workerUrl) {
        return createMockArtworkResult(catalogGame, {
          reason: "missing_worker_url"
        });
      }

      try {
        const artwork = await requestJson(
          `${workerUrl}/api/steamgrid/artwork?title=${encodeURIComponent(title)}&storefront=${encodeURIComponent(storefront)}&slug=${encodeURIComponent(catalogGame?.steamGridSlug ?? "")}`
        );

        return {
          heroArt: artwork.heroArt || catalogGame?.heroArt || "",
          capsuleArt: artwork.capsuleArt || catalogGame?.capsuleArt || "",
          screenshots: artwork.screenshots?.length ? artwork.screenshots : (catalogGame?.screenshots ?? []),
          meta: {
            resolved: Boolean(artwork.meta?.resolved),
            usedFallback: Boolean(artwork.meta?.usedFallback),
            reason: artwork.meta?.reason ?? "worker_proxy"
          }
        };
      } catch (error) {
        return createMockArtworkResult(catalogGame, {
          reason: "worker_request_failed"
        });
      }
    }
  };
}
