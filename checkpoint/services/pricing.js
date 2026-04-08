import { createItadPricingProvider } from "./pricing-itad.js";
import { createMockPricingResult } from "./pricing-mock.js";

export function createPricingService() {
  const provider = createItadPricingProvider();

  return {
    isConfigured() {
      return provider.isConfigured();
    },

    async resolvePrice({ title, storefront, catalogGame, selectedStoreIds = [] }) {
      if (!provider.isConfigured()) {
        return createMockPricingResult({ catalogGame });
      }

      const result = await provider.resolvePrice({
        title,
        storefront,
        catalogGame,
        selectedStoreIds
      });

      const normalizedStoreRows = Array.isArray(result?.storeRows)
        ? result.storeRows.map((row) => ({
            storeId: String(row?.storeId ?? ""),
            storeName: String(row?.storeName ?? ""),
            amount: Number.isFinite(Number(row?.amount)) ? Number(row.amount) : null,
            currency: String(row?.currency ?? "USD"),
            discountPercent: Number.isFinite(Number(row?.discountPercent)) ? Number(row.discountPercent) : null,
            url: String(row?.url ?? "")
          }))
        : [];
      const bestSelectedStoreRow = normalizedStoreRows
        .filter((row) => Number.isFinite(Number(row.amount)))
        .reduce((best, row) => {
          if (!best) return row;
          return Number(row.amount) < Number(best.amount) ? row : best;
        }, null);

      const resolvedCurrentBest = bestSelectedStoreRow
        ? {
            amount: Number(bestSelectedStoreRow.amount),
            currency: bestSelectedStoreRow.currency || "USD",
            storeId: bestSelectedStoreRow.storeId || "",
            storeName: bestSelectedStoreRow.storeName || "",
            url: bestSelectedStoreRow.url || "",
            regularAmount: null,
            discountPercent: Number.isFinite(Number(bestSelectedStoreRow.discountPercent)) ? Number(bestSelectedStoreRow.discountPercent) : null
          }
        : {
            amount: Number.isFinite(Number(result?.currentBest?.amount)) ? Number(result.currentBest.amount) : null,
            currency: result?.currentBest?.currency || "USD",
            storeId: result?.currentBest?.storeId || "",
            storeName: result?.currentBest?.storeName || "",
            url: result?.currentBest?.url || "",
            regularAmount: Number.isFinite(Number(result?.currentBest?.regularAmount)) ? Number(result.currentBest.regularAmount) : null,
            discountPercent: Number.isFinite(Number(result?.currentBest?.discountPercent)) ? Number(result.currentBest.discountPercent) : null
          };

      return {
        provider: result?.provider || "itad",
        providerGameId: result?.providerGameId || "",
        gameUrl: result?.gameUrl || result?.meta?.itadGameUrl || "",
        currentBest: resolvedCurrentBest,
        preferredStoreCurrent: {
          amount: null,
          currency: "USD",
          storeId: "",
          storeName: "",
          url: "",
          regularAmount: null,
          discountPercent: null
        },
        storeRows: normalizedStoreRows,
        historicalLow: {
          amount: Number.isFinite(Number(result?.historicalLow?.amount)) ? Number(result.historicalLow.amount) : null,
          currency: result?.historicalLow?.currency || "USD",
          storeId: result?.historicalLow?.storeId || "",
          storeName: result?.historicalLow?.storeName || "",
          url: result?.historicalLow?.url || "",
          regularAmount: Number.isFinite(Number(result?.historicalLow?.regularAmount)) ? Number(result.historicalLow.regularAmount) : null,
          discountPercent: Number.isFinite(Number(result?.historicalLow?.discountPercent)) ? Number(result.historicalLow.discountPercent) : null,
          at: result?.historicalLow?.at || ""
        },
        lastCheckedAt: result?.lastCheckedAt || new Date().toISOString(),
        status: result?.status || "error",
        reason: result?.reason || "provider_unknown",
        meta: result?.meta ?? {
          resolved: false,
          usedFallback: true,
          reason: "provider_unknown"
        }
      };
    },

    async listStores() {
      if (typeof provider.listStores !== "function") {
        return [];
      }
      try {
        const rows = await provider.listStores();
        return Array.isArray(rows)
          ? rows.map((row) => ({
              id: String(row?.id ?? ""),
              name: String(row?.name ?? "")
            })).filter((row) => row.id && row.name)
          : [];
      } catch (error) {
        return [];
      }
    }
  };
}
