import assert from "node:assert/strict";
import {
  handleSteamOwnedGamesRequest,
  handleSteamResolveProfileRequest,
  normalizeSteamOwnedGame,
  parseSteamProfileInput,
  summarizeSteamOwnedGames
} from "../cloudflare-worker/src/index.js";

async function readJson(response) {
  return response.json();
}

function mockFetchWith(handler) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url ?? "";
    return handler(url, init);
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}

assert.deepEqual(parseSteamProfileInput("76561198000000000"), {
  type: "steamid",
  value: "76561198000000000"
});
assert.deepEqual(parseSteamProfileInput("https://steamcommunity.com/profiles/76561198000000000/"), {
  type: "steamid",
  value: "76561198000000000"
});
assert.deepEqual(parseSteamProfileInput("https://steamcommunity.com/id/checkpoint-user/"), {
  type: "vanity",
  value: "checkpoint-user"
});

const normalized = normalizeSteamOwnedGame({
  appid: "292030",
  name: "The Witcher 3: Wild Hunt",
  img_icon_url: "iconhash",
  playtime_forever: "1234",
  playtime_2weeks: "56"
});
assert.equal(normalized.appid, 292030);
assert.equal(normalized.title, "The Witcher 3: Wild Hunt");
assert.equal(normalized.appUrl, "https://store.steampowered.com/app/292030/");
assert.equal(normalized.iconUrl, "https://media.steampowered.com/steamcommunity/public/images/apps/292030/iconhash.jpg");
assert.equal(normalized.playtimeForeverMinutes, 1234);
assert.equal(normalized.playtime2WeeksMinutes, 56);
assert.equal(normalized.hasPlayed, true);
assert.equal(normalized.recentlyPlayed, true);

assert.deepEqual(summarizeSteamOwnedGames([
  normalized,
  normalizeSteamOwnedGame({ appid: 70, name: "Half-Life", playtime_forever: 0, playtime_2weeks: 0 })
]), {
  total: 2,
  played: 1,
  unplayed: 1,
  recentlyPlayed: 1
});

{
  const response = await handleSteamResolveProfileRequest(
    new Request("https://worker.example/api/steam/resolve-profile?profile=76561198000000000"),
    {}
  );
  const payload = await readJson(response);
  assert.equal(response.status, 200);
  assert.equal(payload.steamid, "76561198000000000");
  assert.equal(payload.inputType, "steamid");
}

{
  const response = await handleSteamResolveProfileRequest(
    new Request("https://worker.example/api/steam/resolve-profile?profile=checkpoint-user"),
    {}
  );
  const payload = await readJson(response);
  assert.equal(response.status, 500);
  assert.equal(payload.error, "missing_steam_api_key");
}

{
  const restore = mockFetchWith((url) => {
    assert.equal(new URL(url).pathname, "/ISteamUser/ResolveVanityURL/v0001/");
    return Response.json({
      response: {
        success: 1,
        steamid: "76561198000000001"
      }
    });
  });
  try {
    const response = await handleSteamResolveProfileRequest(
      new Request("https://worker.example/api/steam/resolve-profile?profile=checkpoint-user"),
      { STEAM_WEB_API_KEY: "test-key" }
    );
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.steamid, "76561198000000001");
    assert.equal(payload.inputType, "vanity");
  } finally {
    restore();
  }
}

{
  const restore = mockFetchWith(() => new Response("Steam down", { status: 503 }));
  try {
    const response = await handleSteamResolveProfileRequest(
      new Request("https://worker.example/api/steam/resolve-profile?profile=checkpoint-user"),
      { STEAM_WEB_API_KEY: "test-key" }
    );
    const payload = await readJson(response);
    assert.equal(response.status, 503);
    assert.equal(payload.error, "steam_api_unavailable");
  } finally {
    restore();
  }
}

{
  const response = await handleSteamOwnedGamesRequest(
    new Request("https://worker.example/api/steam/owned-games?steamid=not-a-steamid"),
    { STEAM_WEB_API_KEY: "test-key" }
  );
  const payload = await readJson(response);
  assert.equal(response.status, 400);
  assert.equal(payload.error, "invalid_steamid");
}

{
  const response = await handleSteamOwnedGamesRequest(
    new Request("https://worker.example/api/steam/owned-games?steamid=76561198000000000"),
    {}
  );
  const payload = await readJson(response);
  assert.equal(response.status, 500);
  assert.equal(payload.error, "missing_steam_api_key");
}

{
  const restore = mockFetchWith((url) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, "/IPlayerService/GetOwnedGames/v0001/");
    assert.equal(parsed.searchParams.get("include_appinfo"), "1");
    assert.equal(parsed.searchParams.get("include_played_free_games"), "0");
    return Response.json({
      response: {
        game_count: 2,
        games: [
          {
            appid: 292030,
            name: "The Witcher 3: Wild Hunt",
            img_icon_url: "iconhash",
            playtime_forever: 1234,
            playtime_2weeks: 56
          },
          {
            appid: 70,
            name: "Half-Life",
            playtime_forever: 0,
            playtime_2weeks: 0
          }
        ]
      }
    });
  });
  try {
    const response = await handleSteamOwnedGamesRequest(
      new Request("https://worker.example/api/steam/owned-games?steamid=76561198000000000&includeFreePlayed=false"),
      { STEAM_WEB_API_KEY: "test-key" }
    );
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.results.length, 2);
    assert.equal(payload.results[0].appid, 292030);
    assert.equal(payload.results[0].playtimeForeverMinutes, 1234);
    assert.equal(payload.results[0].recentlyPlayed, true);
    assert.deepEqual(payload.summary, {
      total: 2,
      played: 1,
      unplayed: 1,
      recentlyPlayed: 1
    });
    assert.equal(payload.meta.reason, "steam_owned_games");
    assert.equal(payload.meta.includeFreePlayed, false);
  } finally {
    restore();
  }
}

{
  const restore = mockFetchWith(() => Response.json({ response: {} }));
  try {
    const response = await handleSteamOwnedGamesRequest(
      new Request("https://worker.example/api/steam/owned-games?steamid=76561198000000000"),
      { STEAM_WEB_API_KEY: "test-key" }
    );
    const payload = await readJson(response);
    assert.equal(response.status, 403);
    assert.equal(payload.error, "private_or_inaccessible_library");
    assert.equal(payload.meta.reason, "steam_private_or_inaccessible_library");
  } finally {
    restore();
  }
}

console.log("[checkpoint] Phase 5 Steam worker verification passed.");
