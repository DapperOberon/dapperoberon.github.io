import { createPricingService } from "../services/pricing.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyFallbackWhenUnconfigured() {
  globalThis.CHECKPOINT_CONFIG = { steamGridWorkerUrl: "" };
  const pricing = createPricingService();
  const result = await pricing.resolvePrice({
    title: "Sable",
    storefront: "steam"
  });

  assert(result.status === "unsupported", "Expected unsupported status when worker URL is missing.");
  assert(result.reason === "pricing_not_configured", "Expected pricing_not_configured reason when unconfigured.");
}

async function verifyConfiguredPricingAndStoreList() {
  const originalFetch = globalThis.fetch;
  globalThis.CHECKPOINT_CONFIG = {
    steamGridWorkerUrl: "https://example-worker.dev"
  };

  globalThis.fetch = async (url) => {
    const asString = String(url);

    if (asString.includes("/api/itad/pricing")) {
      return {
        ok: true,
        async json() {
          return {
            providerGameId: "itad-123",
            currentBest: {
              amount: 19.99,
              currency: "USD",
              storeId: "16",
              storeName: "Epic Game Store",
              url: "https://itad.link/deal/1",
              regularAmount: 39.99,
              discountPercent: 50
            },
            storeRows: [
              {
                storeId: "61",
                storeName: "Steam",
                amount: 17.99,
                currency: "USD",
                discountPercent: 55,
                url: "https://itad.link/deal/steam"
              },
              {
                storeId: "16",
                storeName: "Epic Game Store",
                amount: 19.99,
                currency: "USD",
                discountPercent: 50,
                url: "https://itad.link/deal/epic"
              }
            ],
            historicalLow: {
              amount: 12.99,
              currency: "USD",
              storeId: "61",
              storeName: "Steam",
              discountPercent: 67,
              at: "2026-01-01T00:00:00.000Z"
            },
            lastCheckedAt: "2026-04-06T15:00:00.000Z",
            status: "ok",
            reason: "resolved",
            meta: {
              resolved: true,
              usedFallback: false,
              reason: "itad"
            }
          };
        }
      };
    }

    if (asString.includes("/api/itad/shops")) {
      return {
        ok: true,
        async json() {
          return {
            stores: [
              { id: "61", name: "Steam" },
              { id: "16", name: "Epic Game Store" }
            ]
          };
        }
      };
    }

    return { ok: false, status: 404, async json() { return {}; } };
  };

  try {
    const pricing = createPricingService();
    const result = await pricing.resolvePrice({
      title: "Sable",
      storefront: "steam",
      selectedStoreIds: ["61", "16"]
    });

    assert(result.status === "ok", "Expected ok status for successful configured provider call.");
    assert(Array.isArray(result.storeRows) && result.storeRows.length === 2, "Expected two normalized storeRows.");
    assert(result.currentBest.storeId === "61", "Expected currentBest to resolve from lowest selected store row.");

    const stores = await pricing.listStores();
    assert(Array.isArray(stores) && stores.length === 2, "Expected listStores to return normalized stores.");
    assert(stores[0].id && stores[0].name, "Expected listStores rows to include id/name.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function verifyProviderErrorFallback() {
  const originalFetch = globalThis.fetch;
  globalThis.CHECKPOINT_CONFIG = {
    steamGridWorkerUrl: "https://example-worker.dev"
  };

  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    async json() {
      return {};
    }
  });

  try {
    const pricing = createPricingService();
    const result = await pricing.resolvePrice({
      title: "Sable",
      storefront: "steam"
    });

    assert(result.status === "error", "Expected error status when provider request fails.");
    assert(result.reason === "worker_request_failed", "Expected worker_request_failed reason for provider fetch failure.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function run() {
  await verifyFallbackWhenUnconfigured();
  await verifyConfiguredPricingAndStoreList();
  await verifyProviderErrorFallback();
  console.log("[checkpoint] Pricing service verification passed.");
}

run().catch((error) => {
  console.error("[checkpoint] Pricing service verification failed.");
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});

