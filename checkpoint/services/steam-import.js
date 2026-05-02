import { getServiceConfig } from "./config.js";

function normalizeWorkerUrl(workerUrl) {
  return String(workerUrl ?? "").trim().replace(/\/+$/, "");
}

async function requestJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.message || `Steam import request failed with status ${response.status}`);
    error.status = response.status;
    error.code = payload?.error || "steam_import_request_failed";
    throw error;
  }

  return payload;
}

function normalizeSteamGame(row) {
  const appid = Number(row?.appid);
  const playtimeForeverMinutes = Number(row?.playtimeForeverMinutes);
  const playtime2WeeksMinutes = Number(row?.playtime2WeeksMinutes);

  return {
    appid: Number.isFinite(appid) ? appid : null,
    title: String(row?.title ?? "").trim(),
    appUrl: String(row?.appUrl ?? "").trim(),
    iconUrl: String(row?.iconUrl ?? "").trim(),
    logoUrl: String(row?.logoUrl ?? "").trim(),
    playtimeForeverMinutes: Number.isFinite(playtimeForeverMinutes) ? Math.max(0, playtimeForeverMinutes) : 0,
    playtime2WeeksMinutes: Number.isFinite(playtime2WeeksMinutes) ? Math.max(0, playtime2WeeksMinutes) : 0,
    hasPlayed: Boolean(row?.hasPlayed),
    recentlyPlayed: Boolean(row?.recentlyPlayed),
    importSource: String(row?.importSource ?? "steam-owned-games")
  };
}

function normalizeSteamOwnedGamesPayload(payload) {
  const results = Array.isArray(payload?.results)
    ? payload.results.map(normalizeSteamGame).filter((row) => row.appid && row.title)
    : [];

  return {
    results,
    summary: {
      total: Number(payload?.summary?.total ?? results.length) || results.length,
      played: Number(payload?.summary?.played ?? results.filter((row) => row.playtimeForeverMinutes > 0).length) || 0,
      unplayed: Number(payload?.summary?.unplayed ?? results.filter((row) => row.playtimeForeverMinutes === 0).length) || 0,
      recentlyPlayed: Number(payload?.summary?.recentlyPlayed ?? results.filter((row) => row.playtime2WeeksMinutes > 0).length) || 0
    },
    meta: payload?.meta ?? {
      resolved: false,
      usedFallback: true,
      reason: "steam_payload_normalized"
    }
  };
}

function titleCaseSlug(value) {
  return String(value ?? "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeWishlistTitle(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSteamWishlistRow(row) {
  const appid = Number(row?.appid);
  return {
    appid: Number.isFinite(appid) && appid > 0 ? Math.trunc(appid) : null,
    title: normalizeWishlistTitle(row?.title),
    appUrl: String(row?.appUrl ?? "").trim(),
    iconUrl: "",
    logoUrl: "",
    playtimeForeverMinutes: 0,
    playtime2WeeksMinutes: 0,
    hasPlayed: false,
    recentlyPlayed: false,
    importSource: "steam-wishlist-import",
    parseConfidence: String(row?.parseConfidence ?? "low").trim() || "low",
    parseReason: String(row?.parseReason ?? "").trim() || "Parsed title"
  };
}

function normalizeSteamWishlistPayload(payload) {
  const results = Array.isArray(payload?.results)
    ? payload.results
      .map(normalizeSteamWishlistRow)
      .filter((row) => row.appid || row.title)
    : [];

  return {
    results,
    summary: {
      total: Number(payload?.summary?.total ?? results.length) || results.length,
      played: 0,
      unplayed: Number(payload?.summary?.unplayed ?? results.length) || results.length,
      recentlyPlayed: 0,
      withAppIds: results.filter((row) => row.appid).length,
      titleOnly: results.filter((row) => !row.appid).length
    },
    meta: payload?.meta ?? {
      resolved: true,
      usedFallback: false,
      reason: "steam_wishlist_parsed"
    }
  };
}

function parseWishlistSourceText(sourceText) {
  const raw = String(sourceText ?? "").trim();
  if (!raw) {
    throw Object.assign(new Error("Paste a Steam wishlist URL, copied wishlist content, or Steam app lines first."), {
      code: "missing_wishlist_source"
    });
  }

  const appMap = new Map();
  const titleSet = new Set();

  const appUrlRegex = /https?:\/\/store\.steampowered\.com\/app\/(\d+)(?:\/([^/?#"'\\\s<]+))?/gi;
  for (const match of raw.matchAll(appUrlRegex)) {
    const appid = Number(match[1]);
    const slugTitle = titleCaseSlug(match[2] || "");
    if (!Number.isFinite(appid) || appid <= 0) continue;
    const key = String(Math.trunc(appid));
    appMap.set(key, {
      appid: Math.trunc(appid),
      title: slugTitle,
      appUrl: `https://store.steampowered.com/app/${Math.trunc(appid)}/`,
      parseConfidence: "high",
      parseReason: "Steam app URL"
    });
  }

  const dataAppIdRegex = /data-ds-appid=["']?(\d+)["']?/gi;
  for (const match of raw.matchAll(dataAppIdRegex)) {
    const appid = Number(match[1]);
    if (!Number.isFinite(appid) || appid <= 0) continue;
    const key = String(Math.trunc(appid));
    if (!appMap.has(key)) {
      appMap.set(key, {
        appid: Math.trunc(appid),
        title: "",
        appUrl: `https://store.steampowered.com/app/${Math.trunc(appid)}/`,
        parseConfidence: "medium",
        parseReason: "Steam app id"
      });
    }
  }

  const lines = raw
    .split(/\r?\n+/)
    .map((line) => line.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/^https?:\/\/steamcommunity\.com\/(id|profiles)\/[^/\s]+\/wishlist\/?$/i.test(line)) {
      continue;
    }
    if (/store\.steampowered\.com\/app\/\d+/i.test(line)) {
      continue;
    }
    if (/^wishlist$/i.test(line) || /^steam wishlist$/i.test(line)) {
      continue;
    }
    if (/^\d+$/.test(line)) {
      const appid = Number(line);
      if (Number.isFinite(appid) && appid > 0) {
        const key = String(Math.trunc(appid));
        if (!appMap.has(key)) {
          appMap.set(key, {
            appid: Math.trunc(appid),
            title: "",
            appUrl: `https://store.steampowered.com/app/${Math.trunc(appid)}/`,
            parseConfidence: "medium",
            parseReason: "Steam app id"
          });
        }
      }
      continue;
    }
    if (line.length < 2 || line.length > 120) continue;
    if (/^[\W_]+$/.test(line)) continue;
    if (/^\$\d/.test(line) || /save up to/i.test(line)) continue;
    const normalizedTitle = normalizeWishlistTitle(line);
    if (!normalizedTitle) continue;
    titleSet.add(normalizedTitle);
  }

  const results = [
    ...Array.from(appMap.values()),
    ...Array.from(titleSet.values()).map((title) => ({
      appid: null,
      title,
      appUrl: "",
      parseConfidence: "low",
      parseReason: "Pasted title"
    }))
  ];

  if (!results.length) {
    throw Object.assign(new Error("Checkpoint could not parse any Steam wishlist entries from that input. Paste copied wishlist content, Steam app URLs, or one title per line."), {
      code: "wishlist_parse_failed"
    });
  }

  return normalizeSteamWishlistPayload({
    results,
    summary: {
      total: results.length,
      unplayed: results.length
    }
  });
}

export function createSteamImportService() {
  return {
    isConfigured() {
      return Boolean(normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl));
    },

    async resolveProfile(profile) {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);
      if (!workerUrl) {
        const error = new Error("Worker endpoint is not configured.");
        error.code = "missing_worker_url";
        throw error;
      }

      return requestJson(`${workerUrl}/api/steam/resolve-profile?profile=${encodeURIComponent(profile)}`);
    },

    async fetchOwnedGames({ steamid, includeFreePlayed = true }) {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);
      if (!workerUrl) {
        const error = new Error("Worker endpoint is not configured.");
        error.code = "missing_worker_url";
        throw error;
      }

      const payload = await requestJson(
        `${workerUrl}/api/steam/owned-games?steamid=${encodeURIComponent(steamid)}&includeFreePlayed=${includeFreePlayed ? "true" : "false"}`
      );

      return normalizeSteamOwnedGamesPayload(payload);
    },

    async parseWishlistSource(sourceText) {
      const workerUrl = normalizeWorkerUrl(getServiceConfig().steamGridWorkerUrl);
      if (!workerUrl) {
        return parseWishlistSourceText(sourceText);
      }

      const payload = await requestJson(`${workerUrl}/api/steam/parse-wishlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source: String(sourceText ?? "")
        })
      });

      return normalizeSteamWishlistPayload(payload);
    }
  };
}
