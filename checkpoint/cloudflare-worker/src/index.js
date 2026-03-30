const STEAMGRID_BASE_URL = "https://www.steamgriddb.com/api/v2";
const IGDB_BASE_URL = "https://api.igdb.com/v4";
const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";

let igdbAccessToken = "";
let igdbAccessTokenExpiresAt = 0;

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

function getCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
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

function buildIgdbGameFields() {
  return "fields name,slug,summary,storyline,aggregated_rating,first_release_date,genres.name,platforms.name,involved_companies.developer,involved_companies.publisher,involved_companies.company.name;";
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

async function queryIgdbGamesByIds(env, ids) {
  const uniqueIds = Array.from(new Set(ids.filter((value) => Number.isFinite(value) && value > 0)));
  if (!uniqueIds.length) return [];

  const body = `
    ${buildIgdbGameFields()}
    where id = (${uniqueIds.join(",")});
    limit ${Math.min(uniqueIds.length, 10)};
  `.trim();

  return igdbJson(env, "games", body);
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
