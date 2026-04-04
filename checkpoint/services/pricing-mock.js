export function createMockPricingResult({ catalogGame } = {}) {
  const existingPricing = catalogGame?.pricing && typeof catalogGame.pricing === "object" ? catalogGame.pricing : {};
  return {
    provider: existingPricing.provider || "itad",
    providerGameId: existingPricing.providerGameId || "",
    currentBest: {
      amount: existingPricing.currentBest?.amount ?? null,
      currency: existingPricing.currentBest?.currency || "USD",
      storeId: existingPricing.currentBest?.storeId || "",
      storeName: existingPricing.currentBest?.storeName || "",
      url: existingPricing.currentBest?.url || "",
      regularAmount: existingPricing.currentBest?.regularAmount ?? null,
      discountPercent: existingPricing.currentBest?.discountPercent ?? null
    },
    preferredStoreCurrent: {
      amount: existingPricing.preferredStoreCurrent?.amount ?? null,
      currency: existingPricing.preferredStoreCurrent?.currency || "USD",
      storeId: existingPricing.preferredStoreCurrent?.storeId || "",
      storeName: existingPricing.preferredStoreCurrent?.storeName || "",
      url: existingPricing.preferredStoreCurrent?.url || "",
      regularAmount: existingPricing.preferredStoreCurrent?.regularAmount ?? null,
      discountPercent: existingPricing.preferredStoreCurrent?.discountPercent ?? null
    },
    storeRows: Array.isArray(existingPricing.storeRows) ? existingPricing.storeRows : [],
    historicalLow: {
      amount: existingPricing.historicalLow?.amount ?? null,
      currency: existingPricing.historicalLow?.currency || "USD",
      storeId: existingPricing.historicalLow?.storeId || "",
      storeName: existingPricing.historicalLow?.storeName || "",
      url: existingPricing.historicalLow?.url || "",
      regularAmount: existingPricing.historicalLow?.regularAmount ?? null,
      discountPercent: existingPricing.historicalLow?.discountPercent ?? null,
      at: existingPricing.historicalLow?.at || ""
    },
    lastCheckedAt: new Date().toISOString(),
    status: "unsupported",
    reason: "pricing_not_configured",
    meta: {
      resolved: false,
      usedFallback: true,
      reason: "pricing_not_configured"
    }
  };
}
