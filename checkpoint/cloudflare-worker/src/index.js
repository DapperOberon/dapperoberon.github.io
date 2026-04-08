const STEAMGRID_BASE_URL = "https://www.steamgriddb.com/api/v2";
const IGDB_BASE_URL = "https://api.igdb.com/v4";
const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";
const ITAD_BASE_URL = "https://api.isthereanydeal.com";

let igdbAccessToken = "";
let igdbAccessTokenExpiresAt = 0;
let itadShopsCache = null;
let itadShopsCacheAt = 0;

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers
    }
  });
}

function getAllowedOrigins(env) {
  const origins = String(env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (origins.length) {
    return origins;
  }

  return String(env.ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveAllowedOrigin(origin, allowedOrigins) {
  if (allowedOrigins.includes("*")) {
    return "*";
  }

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  return allowedOrigins[0] ?? "";
}

function buildCorsHeaders(origin, allowedOrigins) {
  const resolvedOrigin = resolveAllowedOrigin(origin, allowedOrigins);

  return {
    "access-control-allow-origin": resolvedOrigin,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type"
  };
}

function withCors(response, origin, allowedOrigins) {
  const headers = new Headers(response.headers);
  const corsHeaders = buildCorsHeaders(origin, allowedOrigins);
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function trim(value) {
  return String(value ?? "").trim();
}

function getCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function parseNullableNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function getFirstUsableUrl(items) {
  return getCollection(items)
    .map((item) => item?.url ?? item?.thumb ?? item?.thumb_url ?? "")
    .find((value) => typeof value === "string" && value.trim().length > 0) ?? "";
}

function getUsableUrls(items, limit = 3) {
  return getCollection(items)
    .map((item) => item?.url ?? item?.thumb ?? item?.thumb_url ?? "")
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .slice(0, limit);
}

function getSearchCandidates({ title, slug }) {
  return [slug, title].filter((value, index, array) => {
    const normalized = normalize(value);
    return normalized && array.findIndex((item) => normalize(item) === normalized) === index;
  });
}

function pickBestMatch(payload, candidates) {
  const items = getCollection(payload);
  if (!items.length) return null;

  const exactMatch = items.find((item) => {
    const itemTitle = normalize(item?.name ?? item?.title);
    return candidates.some((candidate) => itemTitle === normalize(candidate));
  });

  return exactMatch ?? items[0] ?? null;
}

async function steamGridJson(env, path) {
  const response = await fetch(`${STEAMGRID_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.STEAMGRID_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`SteamGridDB request failed with status ${response.status}`);
  }

  return response.json();
}

function getItadCountry(env) {
  const country = trim(env.ITAD_COUNTRY || "US").toUpperCase();
  return country.length === 2 ? country : "US";
}

function getItadBaseUrl(env) {
  return trim(env.ITAD_BASE_URL || ITAD_BASE_URL).replace(/\/+$/, "");
}

function getItadKey(env) {
  return trim(env.ITAD_API_KEY);
}

async function itadJson(env, path, init = {}) {
  const key = getItadKey(env);
  if (!key) {
    throw new Error("ITAD_API_KEY is not configured in the worker.");
  }

  const baseUrl = getItadBaseUrl(env);
  const endpointUrl = new URL(`${baseUrl}${path}`);
  endpointUrl.searchParams.set("key", key);
  const endpoint = endpointUrl.toString();
  const baseHeaders = {
    Accept: "application/json",
    ...(init.headers ?? {})
  };

  const attempts = [
    { Authorization: `Bearer ${key}` },
    { Authorization: key },
    { "X-Api-Key": key }
  ];

  let lastError = null;
  for (const authHeaders of attempts) {
    const response = await fetch(endpoint, {
      ...init,
      headers: {
        ...baseHeaders,
        ...authHeaders
      }
    });

    if (response.ok) {
      return response.json();
    }

    const body = await response.text();
    lastError = new Error(`ITAD request failed with status ${response.status}: ${body}`);

    // For non-auth failures, don't keep retrying different auth headers.
    if (response.status !== 401 && response.status !== 403) {
      break;
    }
  }

  throw lastError ?? new Error("ITAD request failed.");
}

function emptyItadPricing(reason, status = "unsupported") {
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

function normalizeItadStorefront(storefront) {
  const value = normalize(storefront);
  if (!value) return "steam";
  return value;
}

function getStorefrontAliases(storefront) {
  switch (normalizeItadStorefront(storefront)) {
    case "steam":
      return ["steam"];
    case "epic":
      return ["epic games", "epic games store", "epic"];
    case "gog":
      return ["gog", "gog.com"];
    case "psn":
      return ["playstation", "playstation store", "ps store"];
    case "xbox":
      return ["xbox", "microsoft store"];
    case "switch":
      return ["nintendo", "nintendo eshop", "eshop"];
    default:
      return [normalizeItadStorefront(storefront)];
  }
}

async function getItadShops(env) {
  const now = Date.now();
  if (itadShopsCache && now - itadShopsCacheAt < 12 * 60 * 60 * 1000) {
    return itadShopsCache;
  }

  const shops = await itadJson(env, "/service/shops/v1");
  itadShopsCache = Array.isArray(shops) ? shops : [];
  itadShopsCacheAt = now;
  return itadShopsCache;
}

async function resolveItadShopIds(env, storefront) {
  const aliases = getStorefrontAliases(storefront);
  const shops = await getItadShops(env);
  const matched = shops.filter((shop) => {
    const name = normalize(shop?.title);
    return aliases.some((alias) => name.includes(alias));
  });
  return matched
    .map((shop) => parseNullableNumber(shop?.id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function parseLookupIdPayload(payload, title) {
  if (payload?.found && payload?.game?.id) {
    return trim(payload.game.id);
  }

  if (Array.isArray(payload)) {
    const row = payload.find((item) => {
      const itemTitle = normalize(item?.title ?? item?.name ?? "");
      return itemTitle === normalize(title);
    }) ?? payload[0];
    return trim(row?.id ?? "");
  }

  if (payload && typeof payload === "object") {
    const byTitle = payload[title];
    if (typeof byTitle === "string") return trim(byTitle);
  }

  return "";
}

async function resolveItadGameId(env, title) {
  const normalizedTitle = trim(title);
  if (!normalizedTitle) {
    return {
      id: "",
      slug: ""
    };
  }

  let resolvedId = "";
  let resolvedSlug = "";

  async function hydrateSlug(candidateId = "") {
    try {
      const searchPayload = await itadJson(env, `/games/search/v1?title=${encodeURIComponent(normalizedTitle)}&results=5`);
      const rows = Array.isArray(searchPayload) ? searchPayload : [];
      const match = rows.find((row) => trim(row?.id) === trim(candidateId)) ?? rows[0] ?? null;
      return {
        id: trim(match?.id || candidateId),
        slug: trim(match?.slug)
      };
    } catch (error) {
      return {
        id: trim(candidateId),
        slug: ""
      };
    }
  }

  try {
    const lookupPayload = await itadJson(env, `/games/lookup/v1?title=${encodeURIComponent(normalizedTitle)}`);
    const lookupId = parseLookupIdPayload(lookupPayload, normalizedTitle);
    if (lookupId) {
      resolvedId = lookupId;
    }
  } catch (error) {
    // try alternative lookup endpoint
  }

  if (!resolvedId) {
    try {
      const lookupByTitle = await itadJson(env, "/lookup/id/title/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([normalizedTitle])
      });
      const lookupId = parseLookupIdPayload(lookupByTitle, normalizedTitle);
      if (lookupId) {
        resolvedId = lookupId;
      }
    } catch (error) {
      // try search endpoint fallback
    }
  }

  if (resolvedId) {
    const hydrated = await hydrateSlug(resolvedId);
    resolvedSlug = hydrated.slug;
    return {
      id: hydrated.id || resolvedId,
      slug: resolvedSlug
    };
  }

  const hydratedFallback = await hydrateSlug("");
  if (hydratedFallback.id) {
    return hydratedFallback;
  }

  return {
    id: "",
    slug: ""
  };
}

function buildItadGameUrl(slug) {
  const normalizedSlug = trim(slug);
  if (!normalizedSlug) return "";
  return `https://isthereanydeal.com/game/${encodeURIComponent(normalizedSlug)}/info/`;
}

function normalizeItadDeal(deal) {
  if (!deal || typeof deal !== "object") return null;

  const shopObject = deal?.shop && typeof deal.shop === "object"
    ? deal.shop
    : (deal?.store && typeof deal.store === "object" ? deal.store : null);
  const shopScalar = (!shopObject && (typeof deal?.shop === "string" || typeof deal?.shop === "number"))
    ? deal.shop
    : (!shopObject && (typeof deal?.store === "string" || typeof deal?.store === "number") ? deal.store : "");

  const amount = parseNullableNumber(
    deal?.price?.amount
    ?? deal?.deal?.price?.amount
    ?? deal?.price
    ?? deal?.amount
    ?? deal?.newPrice
  );
  const regularAmount = parseNullableNumber(
    deal?.regular?.amount
    ?? deal?.deal?.regular?.amount
    ?? deal?.regular
    ?? deal?.oldPrice
    ?? deal?.regularAmount
  );
  const currency = trim((deal?.price?.currency ?? deal?.deal?.price?.currency ?? deal?.currency ?? deal?.priceCurrency) || "USD").toUpperCase() || "USD";
  const shopId = trim(deal?.shopId ?? deal?.storeId ?? shopObject?.id ?? shopObject?.shopId ?? shopScalar ?? "");
  const shopName = trim(deal?.shopName ?? deal?.storeName ?? shopObject?.name ?? shopObject?.title ?? "");
  const url = trim(deal?.url ?? deal?.deal?.url ?? deal?.shop?.url ?? deal?.store?.url ?? "");
  const cut = parseNullableNumber(deal?.cut ?? deal?.deal?.cut ?? deal?.savings);

  if (!Number.isFinite(amount)) return null;

  return {
    amount,
    currency,
    storeId: shopId,
    storeName: shopName,
    url,
    regularAmount: Number.isFinite(regularAmount) ? regularAmount : null,
    discountPercent: Number.isFinite(cut)
      ? cut
      : (Number.isFinite(regularAmount) && regularAmount > 0
        ? Math.max(0, Math.min(100, ((regularAmount - amount) / regularAmount) * 100))
        : null)
  };
}

function getNormalizedDealsForGame(pricesPayload, gameId) {
  const rows = Array.isArray(pricesPayload) ? pricesPayload : [];
  const gameRow = rows.find((row) => trim(row?.id) === trim(gameId)) ?? rows[0];
  const deals = Array.isArray(gameRow?.deals)
    ? gameRow.deals
    : (Array.isArray(gameRow?.prices)
      ? gameRow.prices
      : (gameRow?.deals && typeof gameRow.deals === "object"
        ? Object.values(gameRow.deals)
        : (gameRow?.prices && typeof gameRow.prices === "object" ? Object.values(gameRow.prices) : [])));
  return deals.map(normalizeItadDeal).filter(Boolean);
}

function pickBestCurrentDeal(pricesPayload, gameId) {
  const normalizedDeals = getNormalizedDealsForGame(pricesPayload, gameId);
  if (!normalizedDeals.length) return null;
  normalizedDeals.sort((a, b) => a.amount - b.amount);
  return normalizedDeals[0];
}

function pickPreferredStoreDeal(pricesPayload, gameId, preferredShopIds = []) {
  const normalizedDeals = getNormalizedDealsForGame(pricesPayload, gameId);
  if (!normalizedDeals.length || !preferredShopIds.length) return null;

  const preferredSet = new Set(preferredShopIds.map((id) => String(id)));
  const filtered = normalizedDeals.filter((deal) => preferredSet.has(String(deal.storeId)));
  if (!filtered.length) return null;
  filtered.sort((a, b) => a.amount - b.amount);
  return filtered[0];
}

function buildItadStoreRows(pricesPayload, gameId, selectedShopIds = []) {
  if (!Array.isArray(selectedShopIds) || !selectedShopIds.length) {
    return [];
  }
  const normalizedDeals = getNormalizedDealsForGame(pricesPayload, gameId);
  if (!normalizedDeals.length) return [];

  const selectedSet = new Set(selectedShopIds.map((id) => String(id)));
  const filtered = normalizedDeals.filter((deal) => selectedSet.has(String(deal.storeId)));

  const byStore = new Map();
  filtered.forEach((deal) => {
    const key = String(deal.storeId || deal.storeName || "store");
    const existing = byStore.get(key);
    if (!existing || Number(deal.amount) < Number(existing.amount)) {
      byStore.set(key, deal);
    }
  });

  const selectedOrder = new Map(selectedShopIds.map((id, index) => [String(id), index]));
  return Array.from(byStore.values())
    .sort((a, b) => {
      const amountDiff = Number(a.amount) - Number(b.amount);
      if (amountDiff !== 0) return amountDiff;
      const aOrder = selectedOrder.has(String(a.storeId)) ? selectedOrder.get(String(a.storeId)) : Number.MAX_SAFE_INTEGER;
      const bOrder = selectedOrder.has(String(b.storeId)) ? selectedOrder.get(String(b.storeId)) : Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    })
    .slice(0, 24)
    .map((deal) => ({
      storeId: trim(deal.storeId),
      storeName: trim(deal.storeName),
      amount: parseNullableNumber(deal.amount),
      currency: trim(deal.currency || "USD").toUpperCase() || "USD",
      discountPercent: parseNullableNumber(deal.discountPercent),
      url: trim(deal.url)
    }));
}

function normalizeHistoryLow(historyPayload, gameId) {
  const rows = Array.isArray(historyPayload) ? historyPayload : [];
  const gameRow = rows.find((row) => trim(row?.id) === trim(gameId)) ?? rows[0];
  const low = gameRow?.low;
  if (!low || typeof low !== "object") return null;

  return {
    amount: parseNullableNumber(low?.price?.amount),
    currency: trim(low?.price?.currency || "USD").toUpperCase() || "USD",
    storeId: trim(low?.shop?.id ?? ""),
    storeName: trim(low?.shop?.name ?? ""),
    url: trim(low?.url ?? ""),
    regularAmount: parseNullableNumber(low?.regular?.amount),
    discountPercent: parseNullableNumber(low?.cut),
    at: trim(low?.timestamp ?? low?.added ?? low?.at ?? "")
  };
}

async function handleItadPricingRequest(request, env) {
  if (!getItadKey(env)) {
    return json(emptyItadPricing("missing_itad_api_key", "unsupported"), { status: 500 });
  }

  const url = new URL(request.url);
  const title = trim(url.searchParams.get("title") ?? "");
  const storefront = trim(url.searchParams.get("storefront") ?? "steam");
  const selectedShopIds = String(url.searchParams.get("shops") ?? "")
    .split(",")
    .map((value) => trim(value))
    .filter((value) => /^\d+$/.test(value));

  if (!title) {
    return json(emptyItadPricing("empty_title", "no_match"), { status: 400 });
  }

  const resolvedGame = await resolveItadGameId(env, title);
  const gameId = trim(resolvedGame?.id);
  const gameUrl = buildItadGameUrl(resolvedGame?.slug);
  if (!gameId) {
    return json(emptyItadPricing("no_match", "no_match"));
  }

  const country = getItadCountry(env);
  const preferredShopIds = await resolveItadShopIds(env, storefront);

  try {
    const [pricesPayload, historyPayload] = await Promise.all([
      itadJson(env, `/games/prices/v3?country=${encodeURIComponent(country)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([gameId])
      }),
      itadJson(env, `/games/historylow/v1?country=${encodeURIComponent(country)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([gameId])
      })
    ]);

    const bestDeal = pickBestCurrentDeal(pricesPayload, gameId);
    const preferredDeal = pickPreferredStoreDeal(pricesPayload, gameId, preferredShopIds);
    const storeRows = buildItadStoreRows(pricesPayload, gameId, selectedShopIds);
    const normalizedDeals = getNormalizedDealsForGame(pricesPayload, gameId);
    const historicalLow = normalizeHistoryLow(historyPayload, gameId);
    if (!bestDeal) {
      return json({
        ...emptyItadPricing("no_price_data", "unsupported"),
        providerGameId: gameId
      });
    }

    return json({
      provider: "itad",
      providerGameId: gameId,
      gameUrl,
      currentBest: {
        amount: bestDeal.amount,
        currency: bestDeal.currency || "USD",
        storeId: bestDeal.storeId,
        storeName: bestDeal.storeName,
        url: bestDeal.url,
        regularAmount: bestDeal.regularAmount,
        discountPercent: bestDeal.discountPercent
      },
      preferredStoreCurrent: {
        amount: parseNullableNumber(preferredDeal?.amount),
        currency: trim(preferredDeal?.currency || bestDeal.currency || "USD").toUpperCase() || "USD",
        storeId: trim(preferredDeal?.storeId ?? ""),
        storeName: trim(preferredDeal?.storeName ?? ""),
        url: trim(preferredDeal?.url ?? ""),
        regularAmount: parseNullableNumber(preferredDeal?.regularAmount),
        discountPercent: parseNullableNumber(preferredDeal?.discountPercent)
      },
      storeRows,
      historicalLow: {
        amount: parseNullableNumber(historicalLow?.amount),
        currency: trim(historicalLow?.currency || bestDeal.currency || "USD").toUpperCase() || "USD",
        storeId: trim(historicalLow?.storeId ?? ""),
        storeName: trim(historicalLow?.storeName ?? ""),
        url: trim(historicalLow?.url ?? ""),
        regularAmount: parseNullableNumber(historicalLow?.regularAmount),
        discountPercent: parseNullableNumber(historicalLow?.discountPercent),
        at: trim(historicalLow?.at ?? "")
      },
      lastCheckedAt: new Date().toISOString(),
      status: "ok",
      reason: "resolved",
      meta: {
        resolved: true,
        usedFallback: false,
        reason: "itad",
        country,
        itadGameUrl: gameUrl,
        preferredStorefront: storefront,
        preferredShopIds,
        selectedShopIds,
        returnedStoreRowCount: storeRows.length,
        availableDealShopIds: Array.from(new Set(normalizedDeals.map((deal) => String(deal.storeId || "")).filter(Boolean)))
      }
    });
  } catch (error) {
    return json({
      ...emptyItadPricing(error instanceof Error ? error.message : "provider_request_failed", "error"),
      providerGameId: gameId
    }, { status: 502 });
  }
}

async function handleItadShopsRequest(env) {
  if (!getItadKey(env)) {
    return json({
      stores: [],
      meta: {
        resolved: false,
        usedFallback: true,
        reason: "missing_itad_api_key"
      }
    }, { status: 500 });
  }

  const shops = await getItadShops(env);
  const stores = (Array.isArray(shops) ? shops : [])
    .map((shop) => ({
      id: trim(shop?.id),
      name: trim(shop?.title ?? shop?.name)
    }))
    .filter((shop) => shop.id && shop.name)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 200);

  return json({
    stores,
    meta: {
      resolved: true,
      usedFallback: false,
      reason: "itad_shops"
    }
  });
}

async function getIgdbAccessToken(env) {
  const now = Date.now();
  if (igdbAccessToken && igdbAccessTokenExpiresAt > now + 60_000) {
    return igdbAccessToken;
  }

  if (!env.IGDB_CLIENT_ID || !env.IGDB_CLIENT_SECRET) {
    throw new Error("IGDB_CLIENT_ID or IGDB_CLIENT_SECRET is not configured in the worker.");
  }

  const authUrl = new URL(TWITCH_AUTH_URL);
  authUrl.searchParams.set("client_id", env.IGDB_CLIENT_ID);
  authUrl.searchParams.set("client_secret", env.IGDB_CLIENT_SECRET);
  authUrl.searchParams.set("grant_type", "client_credentials");

  const response = await fetch(authUrl.toString(), { method: "POST" });
  if (!response.ok) {
    throw new Error(`Twitch auth request failed with status ${response.status}`);
  }

  const payload = await response.json();
  igdbAccessToken = payload.access_token ?? "";
  igdbAccessTokenExpiresAt = now + Number(payload.expires_in ?? 0) * 1000;

  if (!igdbAccessToken) {
    throw new Error("Twitch auth response did not include an access token.");
  }

  return igdbAccessToken;
}

async function igdbJson(env, endpoint, body) {
  const accessToken = await getIgdbAccessToken(env);
  const response = await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Client-ID": env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`
    },
    body
  });

  if (!response.ok) {
    throw new Error(`IGDB request failed with status ${response.status}`);
  }

  return response.json();
}

async function resolveGameId(env, title, slug) {
  const candidates = getSearchCandidates({ title, slug });

  for (const candidate of candidates) {
    const payload = await steamGridJson(env, `/search/autocomplete/${encodeURIComponent(candidate)}`);
    const match = pickBestMatch(payload, candidates);
    if (match?.id) {
      return match.id;
    }
  }

  return null;
}

async function handleArtworkRequest(request, env) {
  if (!env.STEAMGRID_API_KEY) {
    return json({
      error: "missing_secret",
      message: "STEAMGRID_API_KEY is not configured in the worker."
    }, { status: 500 });
  }

  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? "";
  const slug = url.searchParams.get("slug") ?? "";

  if (!title.trim() && !slug.trim()) {
    return json({
      error: "missing_query",
      message: "Provide at least a title or slug."
    }, { status: 400 });
  }

  const gameId = await resolveGameId(env, title, slug);
  if (!gameId) {
    return json({
      heroArt: "",
      capsuleArt: "",
      screenshots: [],
      meta: {
        resolved: false,
        usedFallback: true,
        reason: "no_match"
      }
    });
  }

  const [gridsPayload, heroesPayload] = await Promise.all([
    steamGridJson(env, `/grids/game/${gameId}`),
    steamGridJson(env, `/heroes/game/${gameId}`)
  ]);

  return json({
    heroArt: getFirstUsableUrl(heroesPayload),
    capsuleArt: getFirstUsableUrl(gridsPayload),
    screenshots: getUsableUrls(heroesPayload, 3),
    meta: {
      resolved: true,
      usedFallback: false,
      reason: "cloudflare_worker",
      gameId
    }
  });
}

function escapeIgdbSearch(value) {
  return String(value ?? "").replaceAll('"', '\\"');
}

function slugifyTitle(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getIgdbCompanies(game, flag) {
  return (game?.involved_companies ?? [])
    .filter((item) => item?.[flag] && item?.company?.name)
    .map((item) => item.company.name);
}

function getIgdbFieldList(values, fallback) {
  const normalized = values
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

  return normalized.length ? normalized : [fallback];
}

function getIgdbDescription(game) {
  return game?.summary || game?.storyline || "";
}

function getIgdbCriticSummary(game) {
  const rating = typeof game?.aggregated_rating === "number"
    ? `${Math.round(game.aggregated_rating)} critic rating`
    : "";
  const genreLead = Array.isArray(game?.genres) && game.genres.length
    ? `${game.genres.slice(0, 2).map((genre) => genre.name).join(", ")} focus`
    : "";

  return [rating, genreLead].filter(Boolean).join(" • ");
}

function scoreIgdbMatch(game, candidates) {
  const title = normalize(game?.name);
  const exact = candidates.some((candidate) => title === normalize(candidate));
  const slugMatch = candidates.some((candidate) => normalize(game?.slug) === slugifyTitle(candidate));
  const contains = candidates.some((candidate) => title.includes(normalize(candidate)) || normalize(candidate).includes(title));
  return [
    exact ? 100 : 0,
    slugMatch ? 30 : 0,
    contains ? 10 : 0,
    game?.aggregated_rating ?? 0,
    game?.first_release_date ?? 0
  ];
}

function pickBestIgdbGame(games, candidates) {
  const items = Array.isArray(games) ? games.slice() : [];
  if (!items.length) return null;

  items.sort((a, b) => {
    const aScore = scoreIgdbMatch(a, candidates);
    const bScore = scoreIgdbMatch(b, candidates);

    if (bScore[0] !== aScore[0]) return bScore[0] - aScore[0];
    if (bScore[1] !== aScore[1]) return bScore[1] - aScore[1];
    if (bScore[2] !== aScore[2]) return bScore[2] - aScore[2];
    if (bScore[3] !== aScore[3]) return bScore[3] - aScore[3];
    return bScore[4] - aScore[4];
  });

  return items[0] ?? null;
}

function toIsoDate(unixSeconds) {
  if (!unixSeconds) return "";
  const timestamp = Number(unixSeconds) * 1000;
  if (!Number.isFinite(timestamp)) return "";
  return new Date(timestamp).toISOString().slice(0, 10);
}

function normalizeIgdbMetadata(game) {
  const developers = getIgdbCompanies(game, "developer");
  const publishers = getIgdbCompanies(game, "publisher");

  return {
    developer: developers[0] ?? "",
    publisher: publishers[0] ?? "",
    releaseDate: toIsoDate(game?.first_release_date),
    genres: getIgdbFieldList((game?.genres ?? []).map((genre) => genre?.name), "Unclassified"),
    platforms: getIgdbFieldList((game?.platforms ?? []).map((platform) => platform?.name), "Unknown"),
    criticSummary: getIgdbCriticSummary(game),
    description: getIgdbDescription(game),
    meta: {
      resolved: true,
      usedFallback: false,
      reason: "igdb",
      matchName: game?.name ?? "",
      igdbId: game?.id ?? null
    }
  };
}

function normalizeIgdbCoverUrl(url) {
  const value = String(url ?? "").trim();
  if (!value) return "";
  const withProtocol = value.startsWith("//") ? `https:${value}` : value;
  return withProtocol.replace("/t_thumb/", "/t_cover_big/");
}

function normalizeIgdbImageUrl(url, size = "t_screenshot_big") {
  const value = String(url ?? "").trim();
  if (!value) return "";
  const withProtocol = value.startsWith("//") ? `https:${value}` : value;
  return withProtocol.replace("/t_thumb/", `/${size}/`);
}

function getHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (error) {
    return "";
  }
}

function mapWebsiteKind(url) {
  const host = getHost(url);
  if (!host) return "other";
  if (host.includes("steam")) return "steam";
  if (host.includes("epicgames")) return "epic";
  if (host.includes("gog")) return "gog";
  if (host.includes("playstation")) return "playstation";
  if (host.includes("xbox") || host.includes("microsoft")) return "xbox";
  if (host.includes("nintendo")) return "nintendo";
  if (host.includes("itch.io")) return "itch";
  if (host.includes("igdb")) return "igdb";
  return "other";
}

function normalizeIgdbLinks(game) {
  const websites = Array.isArray(game?.websites) ? game.websites : [];
  const normalizedWebsites = websites
    .map((site) => String(site?.url ?? "").trim())
    .filter(Boolean)
    .map((url) => ({
      url,
      kind: mapWebsiteKind(url)
    }));

  const official = normalizedWebsites.find((site) => site.kind === "other")?.url
    || normalizedWebsites[0]?.url
    || "";
  const storefronts = normalizedWebsites.filter((site) => (
    ["steam", "epic", "gog", "playstation", "xbox", "nintendo", "itch"].includes(site.kind)
  ));
  const igdb = Number.isFinite(Number(game?.id))
    ? `https://www.igdb.com/games/${encodeURIComponent(String(game?.slug || game?.id))}`
    : "";

  return {
    igdb,
    official,
    storefronts
  };
}

function normalizeIgdbVideos(game) {
  const videos = Array.isArray(game?.videos) ? game.videos : [];
  return videos
    .map((video) => String(video?.video_id ?? "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((videoId, index) => ({
      id: `yt-${videoId}`,
      provider: "youtube",
      title: index === 0 ? "Official Video" : `Video ${index + 1}`,
      videoId,
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
    }));
}

function normalizeIgdbScreenshots(game) {
  const shots = Array.isArray(game?.screenshots) ? game.screenshots : [];
  return shots
    .map((shot) => normalizeIgdbImageUrl(shot?.url, "t_screenshot_big"))
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeIgdbGameDetails(game) {
  const developers = getIgdbCompanies(game, "developer");
  const publishers = getIgdbCompanies(game, "publisher");
  const links = normalizeIgdbLinks(game);

  return {
    id: `igdb-${game?.id ?? Math.random().toString(36).slice(2, 10)}`,
    igdbId: Number.isFinite(Number(game?.id)) ? Number(game.id) : null,
    title: game?.name ?? "",
    releaseDate: toIsoDate(game?.first_release_date),
    developer: developers[0] ?? "",
    publisher: publishers[0] ?? "",
    genres: getIgdbFieldList((game?.genres ?? []).map((genre) => genre?.name), "Unclassified"),
    platforms: getIgdbFieldList((game?.platforms ?? []).map((platform) => platform?.name), "Unknown"),
    criticSummary: getIgdbCriticSummary(game),
    description: getIgdbDescription(game),
    coverArt: normalizeIgdbCoverUrl(game?.cover?.url),
    heroArt: normalizeIgdbImageUrl(game?.artworks?.[0]?.url, "t_1080p"),
    screenshots: normalizeIgdbScreenshots(game),
    videos: normalizeIgdbVideos(game),
    links,
    meta: {
      resolved: Boolean(game?.id),
      usedFallback: false,
      reason: "igdb_game",
      igdbId: Number.isFinite(Number(game?.id)) ? Number(game.id) : null
    }
  };
}

function normalizeIgdbSearchResult(game) {
  return {
    id: `igdb-${game?.id ?? Math.random().toString(36).slice(2, 10)}`,
    igdbId: game?.id ?? null,
    title: game?.name ?? "",
    releaseDate: toIsoDate(game?.first_release_date),
    platforms: (game?.platforms ?? []).map((platform) => platform?.name).filter(Boolean).slice(0, 4),
    coverArt: normalizeIgdbCoverUrl(game?.cover?.url),
    description: getIgdbDescription(game),
    storefront: "manual",
    meta: {
      resolved: Boolean(game?.id),
      usedFallback: false,
      reason: "igdb_search"
    }
  };
}

function normalizeIgdbSearchResults(games, limit = 12) {
  if (!Array.isArray(games)) return [];
  const normalizedLimit = Math.max(1, Math.min(200, Number(limit) || 12));
  return games
    .filter((game) => game?.name)
    .map(normalizeIgdbSearchResult)
    .slice(0, normalizedLimit);
}

function extractGameIdsFromSearchRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item) => item?.game)
    .filter((value) => Number.isFinite(value) && value > 0);
}

function buildIgdbGameFields() {
  return "fields name,slug,summary,storyline,aggregated_rating,total_rating_count,rating_count,first_release_date,cover.url,screenshots.url,artworks.url,videos.video_id,websites.url,websites.category,similar_games,genres.id,genres.name,platforms.name,involved_companies.developer,involved_companies.publisher,involved_companies.company.name;";
}

async function queryIgdbGamesBySearch(env, title, { strict = true } = {}) {
  const body = `
    ${buildIgdbGameFields()}
    search "${escapeIgdbSearch(title)}";
    ${strict ? "where category = 0;" : ""}
    limit 10;
  `.trim();

  return igdbJson(env, "games", body);
}

async function queryIgdbSearchEndpoint(env, title) {
  const body = `
    fields game,name;
    search "${escapeIgdbSearch(title)}";
    limit 10;
  `.trim();

  return igdbJson(env, "search", body);
}

async function queryIgdbGamesByIds(env, ids, limit = 10) {
  const uniqueIds = Array.from(new Set(ids.filter((value) => Number.isFinite(value) && value > 0)));
  if (!uniqueIds.length) return [];
  const normalizedLimit = Math.max(1, Math.min(200, Number(limit) || 10));

  const body = `
    ${buildIgdbGameFields()}
    where id = (${uniqueIds.join(",")});
    limit ${Math.min(uniqueIds.length, normalizedLimit)};
  `.trim();

  return igdbJson(env, "games", body);
}

async function queryIgdbTopPlayedMonthly(env) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = nowSeconds - (30 * 24 * 60 * 60);

  const body = `
    ${buildIgdbGameFields()}
    where category = 0
      & first_release_date != null
      & first_release_date <= ${nowSeconds}
      & first_release_date >= ${thirtyDaysAgo}
      & total_rating_count != null;
    sort total_rating_count desc;
    limit 24;
  `.trim();

  return igdbJson(env, "games", body);
}

async function queryIgdbTopPlayedFallback(env) {
  const nowSeconds = Math.floor(Date.now() / 1000);

  const body = `
    ${buildIgdbGameFields()}
    where category = 0
      & first_release_date != null
      & first_release_date <= ${nowSeconds}
      & total_rating_count != null;
    sort total_rating_count desc;
    limit 24;
  `.trim();

  return igdbJson(env, "games", body);
}

async function queryIgdbRecentPopularFallback(env) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const tenYearsAgo = nowSeconds - (10 * 365 * 24 * 60 * 60);

  const body = `
    ${buildIgdbGameFields()}
    where category = 0
      & first_release_date != null
      & first_release_date >= ${tenYearsAgo}
      & first_release_date <= ${nowSeconds};
    sort first_release_date desc;
    limit 24;
  `.trim();

  return igdbJson(env, "games", body);
}

async function queryIgdbTopPlayedSearchFallback(env) {
  const terms = ["mario", "zelda", "minecraft", "fortnite", "grand theft auto"];
  const collectedIds = [];

  for (const term of terms) {
    const searchRows = await queryIgdbSearchEndpoint(env, term);
    const ids = extractGameIdsFromSearchRows(searchRows);
    for (const id of ids) {
      if (!collectedIds.includes(id)) {
        collectedIds.push(id);
      }
    }
    if (collectedIds.length >= 24) break;
  }

  if (!collectedIds.length) return [];
  return queryIgdbGamesByIds(env, collectedIds.slice(0, 24));
}

async function queryIgdbPopularityPrimitives(env, { popularityType = null, limit = 200 } = {}) {
  const whereClause = Number.isFinite(Number(popularityType))
    ? `where game_id != null & popularity_type = ${Number(popularityType)};`
    : "where game_id != null;";
  const body = `
    fields game_id,popularity_type,value,calculated_at;
    ${whereClause}
    sort value desc;
    limit ${Math.max(1, Math.min(500, Number(limit) || 200))};
  `.trim();
  return igdbJson(env, "popularity_primitives", body);
}

async function queryIgdbPopularityTypes(env) {
  const body = `
    fields id,name;
    limit 100;
  `.trim();
  return igdbJson(env, "popularity_types", body);
}

function extractTopGameIdsFromPopularityRows(rows, limit = 24, allowedTypeIds = []) {
  if (!Array.isArray(rows)) return [];
  const allowed = Array.isArray(allowedTypeIds) && allowedTypeIds.length
    ? new Set(allowedTypeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)))
    : null;
  const deduped = [];
  for (const row of rows) {
    if (allowed && !allowed.has(Number(row?.popularity_type))) continue;
    const id = Number(row?.game_id);
    if (!Number.isFinite(id) || id <= 0) continue;
    if (!deduped.includes(id)) deduped.push(id);
    if (deduped.length >= limit) break;
  }
  return deduped;
}

function buildPopularityTypeMap(typeRows) {
  const rows = Array.isArray(typeRows) ? typeRows : [];
  return new Map(rows.map((row) => [Number(row?.id), String(row?.name ?? "").trim()]));
}

function buildPopularityDebugRows(popularityRows, popularityTypesMap, limit = 12) {
  const rows = Array.isArray(popularityRows) ? popularityRows : [];
  return rows.slice(0, limit).map((row) => {
    const typeId = Number(row?.popularity_type);
    return {
      gameId: Number(row?.game_id),
      popularityTypeId: Number.isFinite(typeId) ? typeId : null,
      popularityTypeName: popularityTypesMap.get(typeId) || "",
      value: Number(row?.value),
      calculatedAt: String(row?.calculated_at ?? "")
    };
  });
}

function resolvePopularityTypeIdByAliases(popularityTypesMap, aliases = []) {
  const entries = Array.from(popularityTypesMap.entries());
  for (const alias of aliases) {
    const normalizedAlias = normalize(alias);
    const match = entries.find(([, name]) => normalize(name).includes(normalizedAlias));
    if (match) return Number(match[0]);
  }
  return null;
}

function minMaxNormalize(values = []) {
  const nums = values.filter((value) => Number.isFinite(value));
  if (!nums.length) return [];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (max === min) return nums.map(() => 0);
  return nums.map((value) => (value - min) / (max - min));
}

function buildTrendingPopularityRanking(metricRowsByName = {}, {
  weights = {},
  minNonZeroMetrics = 2
} = {}) {
  const merged = new Map();
  const metricNames = Object.keys(weights);

  const upsert = (metricName, rows) => {
    const inputRows = Array.isArray(rows) ? rows : [];
    for (const row of inputRows) {
      const gameId = Number(row?.game_id);
      if (!Number.isFinite(gameId) || gameId <= 0) continue;
      const rawValue = Number(row?.value);
      if (!Number.isFinite(rawValue)) continue;
      const value = Math.max(0, rawValue);
      const existing = merged.get(gameId) ?? {
        gameId,
        metrics: {}
      };
      existing.metrics[metricName] = (existing.metrics[metricName] ?? 0) + value;
      merged.set(gameId, existing);
    }
  };

  metricNames.forEach((metricName) => {
    upsert(metricName, metricRowsByName[metricName]);
  });

  const baseRows = Array.from(merged.values());
  if (!baseRows.length) return [];

  const logColumns = {};
  metricNames.forEach((metricName) => {
    logColumns[metricName] = baseRows.map((row) => Math.log1p(Number(row.metrics[metricName] ?? 0)));
  });

  const normalizedColumns = {};
  metricNames.forEach((metricName) => {
    normalizedColumns[metricName] = minMaxNormalize(logColumns[metricName]);
  });

  const ranked = baseRows.map((row, index) => {
    let trendingScore = 0;
    const rawMetrics = {};
    const logMetrics = {};
    const normalizedMetrics = {};

    metricNames.forEach((metricName) => {
      const raw = Number(row.metrics[metricName] ?? 0);
      const logValue = Number(logColumns[metricName][index] ?? 0);
      const normalizedValue = Number(normalizedColumns[metricName][index] ?? 0);
      const weight = Number(weights[metricName] ?? 0);
      trendingScore += weight * normalizedValue;
      rawMetrics[metricName] = raw;
      logMetrics[metricName] = logValue;
      normalizedMetrics[metricName] = normalizedValue;
    });

    const nonZeroMetrics = metricNames.filter((metricName) => Number(rawMetrics[metricName] ?? 0) > 0).length;

    return {
      gameId: row.gameId,
      trendingScore,
      nonZeroMetrics,
      rawMetrics,
      logMetrics,
      normalizedMetrics
    };
  });

  const filtered = ranked.filter((row) => row.nonZeroMetrics >= Math.max(1, Number(minNonZeroMetrics) || 1));
  filtered.sort((a, b) => b.trendingScore - a.trendingScore);
  return filtered;
}

async function resolveIgdbGame(env, title) {
  const candidates = [title, slugifyTitle(title)];

  const strictGames = await queryIgdbGamesBySearch(env, title, { strict: true });
  let match = pickBestIgdbGame(strictGames, candidates);
  if (match) return match;

  const looseGames = await queryIgdbGamesBySearch(env, title, { strict: false });
  match = pickBestIgdbGame(looseGames, candidates);
  if (match) return match;

  const searchResults = await queryIgdbSearchEndpoint(env, title);
  const gameIds = (Array.isArray(searchResults) ? searchResults : [])
    .map((item) => item?.game)
    .filter((value) => Number.isFinite(value));

  const byIdGames = await queryIgdbGamesByIds(env, gameIds);
  match = pickBestIgdbGame(byIdGames, candidates);
  if (match) return match;

  return null;
}

async function handleMetadataRequest(request, env) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? "";

  if (!title.trim()) {
    return json({
      error: "missing_query",
      message: "Provide a title."
    }, { status: 400 });
  }

  const match = await resolveIgdbGame(env, title);

  if (!match) {
    return json({
      developer: "",
      publisher: "",
      releaseDate: "",
      genres: [],
      platforms: [],
      criticSummary: "",
      description: "",
      meta: {
        resolved: false,
        usedFallback: true,
        reason: "no_match"
      }
    });
  }

  return json(normalizeIgdbMetadata(match));
}

async function handleIgdbSearchRequest(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query") ?? "";

  if (!query.trim()) {
    return json({
      results: [],
      meta: {
        resolved: false,
        usedFallback: true,
        reason: "missing_query"
      }
    }, { status: 400 });
  }

  const strictGames = await queryIgdbGamesBySearch(env, query, { strict: true });
  const looseGames = strictGames.length
    ? strictGames
    : await queryIgdbGamesBySearch(env, query, { strict: false });
  const searchRows = looseGames.length
    ? []
    : await queryIgdbSearchEndpoint(env, query);
  const byIdGames = looseGames.length
    ? []
    : await queryIgdbGamesByIds(env, extractGameIdsFromSearchRows(searchRows));
  const resolvedGames = looseGames.length
    ? looseGames
    : byIdGames;

  return json({
    results: normalizeIgdbSearchResults(resolvedGames),
    meta: {
      resolved: true,
      usedFallback: false,
      reason: "igdb_search",
      query,
      strictCount: strictGames.length,
      looseCount: looseGames.length,
      searchRowCount: Array.isArray(searchRows) ? searchRows.length : 0,
      byIdCount: byIdGames.length
    }
  });
}

async function handleIgdbGameRequest(request, env) {
  const url = new URL(request.url);
  const gameId = Number(url.searchParams.get("id"));
  if (!Number.isFinite(gameId) || gameId <= 0) {
    return json({
      error: "missing_id",
      message: "Provide a numeric IGDB game id via ?id=..."
    }, { status: 400 });
  }

  const games = await queryIgdbGamesByIds(env, [gameId], 1);
  const match = Array.isArray(games) ? games.find((game) => Number(game?.id) === gameId) ?? games[0] : null;
  if (!match) {
    return json({
      id: `igdb-${gameId}`,
      igdbId: gameId,
      title: "",
      releaseDate: "",
      developer: "",
      publisher: "",
      genres: [],
      platforms: [],
      criticSummary: "",
      description: "",
      coverArt: "",
      heroArt: "",
      screenshots: [],
      videos: [],
      links: {
        igdb: `https://www.igdb.com/games/${encodeURIComponent(String(gameId))}`,
        official: "",
        storefronts: []
      },
      meta: {
        resolved: false,
        usedFallback: true,
        reason: "no_match",
        igdbId: gameId
      }
    }, { status: 404 });
  }

  return json(normalizeIgdbGameDetails(match));
}

async function handleIgdbRelatedRequest(request, env) {
  const url = new URL(request.url);
  const gameId = Number(url.searchParams.get("id"));
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(4, Math.min(24, Math.floor(requestedLimit)))
    : 12;

  if (!Number.isFinite(gameId) || gameId <= 0) {
    return json({
      results: [],
      meta: {
        resolved: false,
        usedFallback: true,
        reason: "missing_id"
      }
    }, { status: 400 });
  }

  const seedRows = await queryIgdbGamesByIds(env, [gameId], 1);
  const seedGame = Array.isArray(seedRows) ? seedRows.find((row) => Number(row?.id) === gameId) ?? seedRows[0] : null;
  if (!seedGame) {
    return json({
      results: [],
      meta: {
        resolved: false,
        usedFallback: true,
        reason: "seed_not_found"
      }
    }, { status: 404 });
  }

  const similarIds = Array.isArray(seedGame?.similar_games)
    ? seedGame.similar_games.filter((value) => Number.isFinite(Number(value)) && Number(value) > 0).map((value) => Number(value))
    : [];
  let relatedGames = [];
  let reason = "igdb_similar_games";

  if (similarIds.length) {
    relatedGames = await queryIgdbGamesByIds(env, similarIds, limit);
  }

  if (!Array.isArray(relatedGames) || !relatedGames.length) {
    const genreIds = Array.isArray(seedGame?.genres)
      ? seedGame.genres.map((genre) => Number(genre?.id)).filter((value) => Number.isFinite(value) && value > 0)
      : [];
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (genreIds.length) {
      const body = `
        ${buildIgdbGameFields()}
        where category = 0
          & id != ${gameId}
          & genres = (${genreIds.join(",")})
          & first_release_date != null
          & first_release_date <= ${nowSeconds};
        sort aggregated_rating desc;
        limit ${Math.max(limit, 12)};
      `.trim();
      relatedGames = await igdbJson(env, "games", body).catch(() => []);
      reason = "igdb_genre_fallback";
    }
  }

  const normalized = normalizeIgdbSearchResults(relatedGames, limit).filter((row) => Number(row?.igdbId) !== gameId);
  return json({
    results: normalized.slice(0, limit),
    meta: {
      resolved: true,
      usedFallback: reason !== "igdb_similar_games",
      reason,
      seedGameId: gameId
    }
  });
}

async function handleIgdbTopPlayedRequest(request, env) {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(10, Math.min(100, Math.floor(requestedLimit)))
    : 50;
  const stepTrace = [];
  const popularityTypes = await queryIgdbPopularityTypes(env).catch(() => []);
  const popularityTypesMap = buildPopularityTypeMap(popularityTypes);

  const popularityTypeIds = {
    igdbVisits: resolvePopularityTypeIdByAliases(popularityTypesMap, [
      "visit",
      "igdb visits"
    ]),
    igdbWantToPlay: resolvePopularityTypeIdByAliases(popularityTypesMap, [
      "want to play",
      "want-to-play"
    ]),
    igdbPlaying: resolvePopularityTypeIdByAliases(popularityTypesMap, [
      "igdb playing",
      "playing"
    ]),
    steam24hPeak: resolvePopularityTypeIdByAliases(popularityTypesMap, [
      "steam 24hr peak",
      "steam 24h peak",
      "24hr peak players",
      "24h peak players",
      "peak players"
    ])
  };

  const metricQueryPlan = [
    ["igdbVisits", popularityTypeIds.igdbVisits],
    ["igdbWantToPlay", popularityTypeIds.igdbWantToPlay],
    ["igdbPlaying", popularityTypeIds.igdbPlaying],
    ["steam24hPeak", popularityTypeIds.steam24hPeak]
  ];

  const metricRowsByName = {
    igdbVisits: [],
    igdbWantToPlay: [],
    igdbPlaying: [],
    steam24hPeak: []
  };

  await Promise.all(metricQueryPlan.map(async ([metricName, typeId]) => {
    if (!Number.isFinite(Number(typeId))) {
      stepTrace.push(`${metricName}_type_missing`);
      metricRowsByName[metricName] = [];
      return;
    }
    try {
      const rows = await queryIgdbPopularityPrimitives(env, {
        popularityType: Number(typeId),
        limit: 500
      });
      metricRowsByName[metricName] = Array.isArray(rows) ? rows : [];
      stepTrace.push(`${metricName}_loaded`);
    } catch (error) {
      metricRowsByName[metricName] = [];
      stepTrace.push(`${metricName}_load_failed`);
    }
  }));

  const trendingRanking = buildTrendingPopularityRanking(metricRowsByName, {
    weights: {
      igdbVisits: 0.25,
      igdbWantToPlay: 0.25,
      igdbPlaying: 0.20,
      steam24hPeak: 0.30
    },
    minNonZeroMetrics: 2
  });
  const trendingRankingEligible = trendingRanking.filter((row) => (
    Number(row?.rawMetrics?.igdbPlaying ?? 0) > 0
    || Number(row?.rawMetrics?.steam24hPeak ?? 0) > 0
  ));
  const excludedByEligibility = Math.max(0, trendingRanking.length - trendingRankingEligible.length);
  const trendingRankingFinal = trendingRankingEligible.slice(0, limit);
  if (trendingRankingFinal.length) {
    stepTrace.push("trending_ranked");
  }
  const trendingIds = trendingRankingFinal.map((row) => row.gameId);
  const popularityDebugRows = {
    igdbVisits: buildPopularityDebugRows(metricRowsByName.igdbVisits, popularityTypesMap, 12),
    igdbWantToPlay: buildPopularityDebugRows(metricRowsByName.igdbWantToPlay, popularityTypesMap, 12),
    igdbPlaying: buildPopularityDebugRows(metricRowsByName.igdbPlaying, popularityTypesMap, 12),
    steam24hPeak: buildPopularityDebugRows(metricRowsByName.steam24hPeak, popularityTypesMap, 12)
  };
  const popscoreGamesRaw = trendingIds.length
    ? await queryIgdbGamesByIds(env, trendingIds, limit)
    : [];
  const weightedOrder = new Map(trendingIds.map((id, index) => [id, index]));
  const popscoreGames = Array.isArray(popscoreGamesRaw)
    ? popscoreGamesRaw
      .slice()
      .sort((a, b) => (weightedOrder.get(Number(a?.id)) ?? Number.MAX_SAFE_INTEGER) - (weightedOrder.get(Number(b?.id)) ?? Number.MAX_SAFE_INTEGER))
    : [];
  if (popscoreGames.length) {
    stepTrace.push("trending_hydrated");
  }
  const monthlyGames = Array.isArray(popscoreGames) && popscoreGames.length
    ? popscoreGames
    : await queryIgdbTopPlayedMonthly(env);
  if (Array.isArray(monthlyGames) && monthlyGames.length && (!Array.isArray(popscoreGames) || !popscoreGames.length)) {
    stepTrace.push("top_played_month_fallback");
  }
  const broadTopGames = Array.isArray(monthlyGames) && monthlyGames.length
    ? monthlyGames
    : await queryIgdbTopPlayedFallback(env);
  if (Array.isArray(broadTopGames) && broadTopGames.length && (!Array.isArray(monthlyGames) || !monthlyGames.length)) {
    stepTrace.push("top_played_broad_fallback");
  }
  const games = Array.isArray(broadTopGames) && broadTopGames.length
    ? broadTopGames
    : await queryIgdbRecentPopularFallback(env);
  if (Array.isArray(games) && games.length && (!Array.isArray(broadTopGames) || !broadTopGames.length)) {
    stepTrace.push("top_recent_fallback");
  }
  const finalGames = Array.isArray(games) && games.length
    ? games
    : await queryIgdbTopPlayedSearchFallback(env);
  if (Array.isArray(finalGames) && finalGames.length && (!Array.isArray(games) || !games.length)) {
    stepTrace.push("top_search_seed_fallback");
  }

  return json({
    results: normalizeIgdbSearchResults(finalGames, limit),
    meta: {
      resolved: true,
      usedFallback: false,
      reason: Array.isArray(popscoreGames) && popscoreGames.length
        ? "igdb_trending_weighted_log_normalized_v4"
        : (Array.isArray(monthlyGames) && monthlyGames.length
          ? "igdb_top_played_month"
        : (Array.isArray(broadTopGames) && broadTopGames.length
          ? "igdb_top_played_fallback"
          : (Array.isArray(games) && games.length
            ? "igdb_top_recent_fallback"
            : "igdb_top_search_fallback"))),
      popularityRowCounts: {
        igdbVisits: metricRowsByName.igdbVisits.length,
        igdbWantToPlay: metricRowsByName.igdbWantToPlay.length,
        igdbPlaying: metricRowsByName.igdbPlaying.length,
        steam24hPeak: metricRowsByName.steam24hPeak.length
      },
      popularityTypeIds,
      popularityGameIdCount: trendingIds.length,
      popularityTypeCount: Array.isArray(popularityTypes) ? popularityTypes.length : 0,
      rankingMode: "trending_v4_log1p_minmax_min2signals_eligibility_playing_or_steam24h_0.25_visits_0.25_want_0.20_playing_0.30_steam24h",
      eligibilityRule: "requires_playing_or_steam24h",
      excludedByEligibilityCount: excludedByEligibility,
      requestedLimit: limit,
      stepTrace,
      debugTopPopularityRows: popularityDebugRows,
      debugTopTrendingRows: trendingRankingFinal.slice(0, Math.min(limit, 20))
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") ?? "";
    const allowedOrigins = getAllowedOrigins(env);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), origin, allowedOrigins);
    }

    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/api/steamgrid/artwork") {
        const response = await handleArtworkRequest(request, env);
        return withCors(response, origin, allowedOrigins);
      }

      if (request.method === "GET" && url.pathname === "/api/igdb/metadata") {
        const response = await handleMetadataRequest(request, env);
        return withCors(response, origin, allowedOrigins);
      }

      if (request.method === "GET" && url.pathname === "/api/igdb/search") {
        const response = await handleIgdbSearchRequest(request, env);
        return withCors(response, origin, allowedOrigins);
      }

      if (request.method === "GET" && url.pathname === "/api/igdb/game") {
        const response = await handleIgdbGameRequest(request, env);
        return withCors(response, origin, allowedOrigins);
      }

      if (request.method === "GET" && url.pathname === "/api/igdb/top-played") {
        const response = await handleIgdbTopPlayedRequest(request, env);
        return withCors(response, origin, allowedOrigins);
      }

      if (request.method === "GET" && url.pathname === "/api/igdb/related") {
        const response = await handleIgdbRelatedRequest(request, env);
        return withCors(response, origin, allowedOrigins);
      }

      if (request.method === "GET" && url.pathname === "/api/itad/pricing") {
        const response = await handleItadPricingRequest(request, env);
        return withCors(response, origin, allowedOrigins);
      }

      if (request.method === "GET" && url.pathname === "/api/itad/shops") {
        const response = await handleItadShopsRequest(env);
        return withCors(response, origin, allowedOrigins);
      }

      return withCors(json({
        error: "not_found",
        message: "Route not found."
      }, { status: 404 }), origin, allowedOrigins);
    } catch (error) {
      return withCors(json({
        error: "worker_error",
        message: error instanceof Error ? error.message : "Unknown worker error."
      }, { status: 500 }), origin, allowedOrigins);
    }
  }
};
