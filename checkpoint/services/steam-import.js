import { getServiceConfig } from "./config.js";

function normalizeWorkerUrl(workerUrl) {
  return String(workerUrl ?? "").trim().replace(/\/+$/, "");
}

async function requestJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
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
    }
  };
}
