import { getServiceConfig } from "./config.js";

function normalizeWorkerUrl(workerUrl) {
  return String(workerUrl ?? "").trim().replace(/\/+$/, "");
}

async function requestJson(url, init = undefined) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`ITAD pricing proxy request failed with status ${response.status}`);
  }
  return response.json();
}

function emptyPricing(reason, status = "unsupported") {
  return {
    provider: "itad",
    providerGameId: "",
    currentBest: {
      amount: null,
      currency: "USD",
      storeId: "",
      storeName: "",
      url: "",
      regularAmount: null,
      discountPercent: null
    },
    preferredStoreCurrent: {
      amount: null,
      currency: "USD",
      storeId: "",
      storeName: "",
      url: "",
      regularAmount: null,
      discountPercent: null
    },
    storeRows: [],
    historicalLow: {
      amount: null,
      currency: "USD",
      storeId: "",
      storeName: "",
      url: "",
      regularAmount: null,
      discountPercent: null,
      at: ""
    },
    lastCheckedAt: new Date().toISOString(),
    status,
    reason,
    meta: {
      resolved: false,
      usedFallback: true,
      reason
    }
  };
}

export function createItadPricingProvider() {
  return {
    providerId: "itad",

    isConfigured() {
      return Boolean(normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl));
    },

    async resolvePrice({ title, storefront, selectedStoreIds = [] }) {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);
      const normalizedTitle = String(title ?? "").trim();

      if (!workerUrl) {
        return emptyPricing("missing_worker_url", "unsupported");
      }
      if (!normalizedTitle) {
        return emptyPricing("empty_title", "no_match");
      }

      try {
        const normalizedShopIds = Array.isArray(selectedStoreIds)
          ? selectedStoreIds
            .map((id) => String(id ?? "").trim())
            .filter((id) => /^\d+$/.test(id))
          : [];
        const payload = await requestJson(
          `${workerUrl}/api/itad/pricing?title=${encodeURIComponent(normalizedTitle)}&storefront=${encodeURIComponent(String(storefront ?? ""))}&shops=${encodeURIComponent(normalizedShopIds.join(","))}`
        );

        return {
          provider: "itad",
          providerGameId: String(payload?.providerGameId ?? ""),
          currentBest: {
            amount: Number.isFinite(Number(payload?.currentBest?.amount)) ? Number(payload.currentBest.amount) : null,
            currency: String(payload?.currentBest?.currency ?? "USD"),
            storeId: String(payload?.currentBest?.storeId ?? ""),
            storeName: String(payload?.currentBest?.storeName ?? ""),
            url: String(payload?.currentBest?.url ?? ""),
            regularAmount: Number.isFinite(Number(payload?.currentBest?.regularAmount)) ? Number(payload.currentBest.regularAmount) : null,
            discountPercent: Number.isFinite(Number(payload?.currentBest?.discountPercent)) ? Number(payload.currentBest.discountPercent) : null
          },
          preferredStoreCurrent: {
            amount: Number.isFinite(Number(payload?.preferredStoreCurrent?.amount)) ? Number(payload.preferredStoreCurrent.amount) : null,
            currency: String(payload?.preferredStoreCurrent?.currency ?? "USD"),
            storeId: String(payload?.preferredStoreCurrent?.storeId ?? ""),
            storeName: String(payload?.preferredStoreCurrent?.storeName ?? ""),
            url: String(payload?.preferredStoreCurrent?.url ?? ""),
            regularAmount: Number.isFinite(Number(payload?.preferredStoreCurrent?.regularAmount)) ? Number(payload.preferredStoreCurrent.regularAmount) : null,
            discountPercent: Number.isFinite(Number(payload?.preferredStoreCurrent?.discountPercent)) ? Number(payload.preferredStoreCurrent.discountPercent) : null
          },
          storeRows: Array.isArray(payload?.storeRows)
            ? payload.storeRows.map((row) => ({
                storeId: String(row?.storeId ?? ""),
                storeName: String(row?.storeName ?? ""),
                amount: Number.isFinite(Number(row?.amount)) ? Number(row.amount) : null,
                currency: String(row?.currency ?? "USD"),
                discountPercent: Number.isFinite(Number(row?.discountPercent)) ? Number(row.discountPercent) : null,
                url: String(row?.url ?? "")
              }))
            : [],
          historicalLow: {
            amount: Number.isFinite(Number(payload?.historicalLow?.amount)) ? Number(payload.historicalLow.amount) : null,
            currency: String(payload?.historicalLow?.currency ?? "USD"),
            storeId: String(payload?.historicalLow?.storeId ?? ""),
            storeName: String(payload?.historicalLow?.storeName ?? ""),
            url: String(payload?.historicalLow?.url ?? ""),
            regularAmount: Number.isFinite(Number(payload?.historicalLow?.regularAmount)) ? Number(payload.historicalLow.regularAmount) : null,
            discountPercent: Number.isFinite(Number(payload?.historicalLow?.discountPercent)) ? Number(payload.historicalLow.discountPercent) : null,
            at: String(payload?.historicalLow?.at ?? "")
          },
          lastCheckedAt: String(payload?.lastCheckedAt ?? new Date().toISOString()),
          status: String(payload?.status ?? "error"),
          reason: String(payload?.reason ?? "provider_unknown"),
          meta: payload?.meta ?? {
            resolved: false,
            usedFallback: true,
            reason: "provider_unknown"
          }
        };
      } catch (error) {
        return emptyPricing("worker_request_failed", "error");
      }
    },

    async listStores() {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);
      if (!workerUrl) return [];

      const payload = await requestJson(`${workerUrl}/api/itad/shops`);
      const rows = Array.isArray(payload?.stores) ? payload.stores : [];
      return rows.map((row) => ({
        id: String(row?.id ?? ""),
        name: String(row?.name ?? "")
      })).filter((row) => row.id && row.name);
    }
  };
}
