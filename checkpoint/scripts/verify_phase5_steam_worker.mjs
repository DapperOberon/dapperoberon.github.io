import assert from "node:assert/strict";
import {
  buildSteamWishlistSourceDescriptor,
  handleSteamParseWishlistRequest,
  handleSteamOwnedGamesRequest,
  handleSteamResolveProfileRequest,
  normalizeSteamOwnedGame,
  parseSteamWishlistText,
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
assert.deepEqual(buildSteamWishlistSourceDescriptor("https://store.steampowered.com/wishlist/id/checkpoint-user/"), {
  type: "wishlist_url",
  value: "https://store.steampowered.com/wishlist/id/checkpoint-user/",
  profileType: "id",
  profileValue: "checkpoint-user"
});
assert.deepEqual(buildSteamWishlistSourceDescriptor("https://steamcommunity.com/profiles/76561198000000000/wishlist"), {
  type: "wishlist_url",
  value: "https://steamcommunity.com/profiles/76561198000000000/wishlist",
  profileType: "profiles",
  profileValue: "76561198000000000"
});

const parsedTextWishlist = parseSteamWishlistText(`https://store.steampowered.com/app/292030/the_witcher_3_wild_hunt/
New Wishlist Title`);
assert.equal(parsedTextWishlist.summary.total, 2);
assert.equal(parsedTextWishlist.summary.withAppIds, 1);
assert.equal(parsedTextWishlist.summary.titleOnly, 1);
assert.equal(parsedTextWishlist.results[0].appid, 292030);
assert.equal(parsedTextWishlist.results[0].parseReason, "Steam app URL");

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
  const response = await handleSteamParseWishlistRequest(
    new Request("https://worker.example/api/steam/parse-wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: "https://store.steampowered.com/app/292030/the_witcher_3_wild_hunt/\nWishlist Discovery Title"
      })
    }),
    {}
  );
  const payload = await readJson(response);
  assert.equal(response.status, 200);
  assert.equal(payload.summary.total, 2);
  assert.equal(payload.meta.sourceType, "text");
  assert.equal(payload.results[0].appid, 292030);
  assert.equal(payload.results[1].title, "Wishlist Discovery Title");
}

{
  const response = await handleSteamParseWishlistRequest(
    new Request("https://worker.example/api/steam/parse-wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: "https://store.steampowered.com/wishlist/id/checkpoint-user/"
      })
    }),
    {}
  );
  const payload = await readJson(response);
  assert.equal(response.status, 500);
  assert.equal(payload.error, "missing_steam_api_key");
}

{
  const restore = mockFetchWith((url) => {
    const parsed = new URL(url);
    if (parsed.hostname === "api.steampowered.com") {
      if (parsed.pathname === "/ISteamUser/ResolveVanityURL/v0001/") {
        return Response.json({
          response: {
            success: 1,
            steamid: "76561198000000001"
          }
        });
      }

      if (parsed.pathname === "/IWishlistService/GetWishlist/v1/") {
        return Response.json({
          response: {
            items: [
              { appid: 292030, priority: 0 },
              { appid: 1145360, priority: 1 },
              { appid: 3552140, priority: 2 }
            ]
          }
        });
      }
    }

    assert.equal(parsed.hostname, "store.steampowered.com");
    assert.equal(parsed.pathname, "/api/appdetails");
    const appids = parsed.searchParams.get("appids");
    if (appids === "292030") {
      return Response.json({
        "292030": {
          success: true,
          data: {
            steam_appid: 292030,
            name: "The Witcher 3: Wild Hunt"
          }
        }
      });
    }
    if (appids === "1145360") {
      return Response.json({
        "1145360": {
          success: true,
          data: {
            steam_appid: 1145360,
            name: "Hades II"
          }
        }
      });
    }
    if (appids === "3552140") {
      return Response.json({
        "3552140": {
          success: false
        }
      });
    }
    throw new Error(`Unexpected URL in wishlist API test: ${url}`);
  });
  try {
    const response = await handleSteamParseWishlistRequest(
      new Request("https://worker.example/api/steam/parse-wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source: "https://store.steampowered.com/wishlist/id/checkpoint-user/"
        })
      }),
      { STEAM_WEB_API_KEY: "test-key" }
    );
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.summary.total, 3);
    assert.equal(payload.summary.withAppIds, 3);
    assert.equal(payload.summary.titleOnly, 0);
    assert.equal(payload.meta.reason, "steam_wishlist_api");
    assert.equal(payload.meta.sourceType, "wishlist_url");
    assert.equal(payload.results[0].appid, 292030);
    assert.equal(payload.results[0].parseReason, "Steam wishlist API");
    assert.equal(payload.results[0].title, "The Witcher 3: Wild Hunt");
    assert.equal(payload.results[1].appid, 1145360);
    assert.equal(payload.results[1].title, "Hades II");
    assert.equal(payload.results[2].appid, 3552140);
    assert.equal(payload.results[2].title, "Steam App 3552140");
    assert.equal(payload.results[2].parseReason, "Steam wishlist API (title unavailable)");
  } finally {
    restore();
  }
}

{
  const restore = mockFetchWith((url) => {
    const parsed = new URL(url);
    if (parsed.hostname === "api.steampowered.com") {
      if (parsed.pathname === "/ISteamUser/ResolveVanityURL/v0001/") {
        return Response.json({
          response: {
            success: 1,
            steamid: "76561198000000001"
          }
        });
      }

      if (parsed.pathname === "/IWishlistService/GetWishlist/v1/") {
        return Response.json({
          response: {
            items: {
              "292030": { priority: 0 },
              "3552140": { priority: 1 },
              "2442100": { priority: 2 }
            }
          }
        });
      }
    }

    assert.equal(parsed.hostname, "store.steampowered.com");
    assert.equal(parsed.pathname, "/api/appdetails");
    const appids = parsed.searchParams.get("appids");
    if (appids === "292030") {
      return Response.json({
        "292030": {
          success: true,
          data: {
            steam_appid: 292030,
            name: "The Witcher 3: Wild Hunt"
          }
        }
      });
    }
    if (appids === "3552140") {
      return Response.json({
        "3552140": {
          success: false
        }
      });
    }
    if (appids === "2442100") {
      return new Response("Steam unavailable", { status: 503 });
    }
    throw new Error(`Unexpected URL in partial wishlist API test: ${url}`);
  });
  try {
    const response = await handleSteamParseWishlistRequest(
      new Request("https://worker.example/api/steam/parse-wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source: "https://store.steampowered.com/wishlist/id/checkpoint-user/"
        })
      }),
      { STEAM_WEB_API_KEY: "test-key" }
    );
    const payload = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(payload.results.length, 3);
    const witcherRow = payload.results.find((row) => row.appid === 292030);
    const missingTitleRow = payload.results.find((row) => row.appid === 3552140);
    const unavailableRow = payload.results.find((row) => row.appid === 2442100);
    assert.equal(witcherRow?.title, "The Witcher 3: Wild Hunt");
    assert.equal(missingTitleRow?.title, "Steam App 3552140");
    assert.equal(missingTitleRow?.parseReason, "Steam wishlist API (title unavailable)");
    assert.equal(unavailableRow?.title, "Steam App 2442100");
    assert.equal(unavailableRow?.parseReason, "Steam wishlist API (title unavailable)");
  } finally {
    restore();
  }
}

{
  const restore = mockFetchWith(() => new Response("Not found", { status: 404 }));
  try {
    const response = await handleSteamParseWishlistRequest(
      new Request("https://worker.example/api/steam/parse-wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source: "https://store.steampowered.com/wishlist/id/checkpoint-user/"
        })
      }),
      { STEAM_WEB_API_KEY: "test-key" }
    );
    const payload = await readJson(response);
    assert.equal(response.status, 404);
    assert.equal(payload.error, "steam_api_unavailable");
  } finally {
    restore();
  }
}

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
  const restore = mockFetchWith(() => Response.json({
    response: {
      success: 42
    }
  }));
  try {
    const response = await handleSteamResolveProfileRequest(
      new Request("https://worker.example/api/steam/resolve-profile?profile=checkpoint-user"),
      { STEAM_WEB_API_KEY: "test-key" }
    );
    const payload = await readJson(response);
    assert.equal(response.status, 404);
    assert.equal(payload.error, "profile_not_found");
  } finally {
    restore();
  }
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
