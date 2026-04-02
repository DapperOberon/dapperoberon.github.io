import fs from "node:fs";
import vm from "node:vm";

const CONFIG_PATH = new URL("../config.js", import.meta.url);
const rawConfig = fs.readFileSync(CONFIG_PATH, "utf8");

const context = {
  window: {},
  globalThis: {}
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(rawConfig, context, { filename: "checkpoint/config.js" });

const runtimeConfig = context.window.CHECKPOINT_CONFIG ?? {};

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function looksLikeHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const results = [];

if (!isNonEmptyString(runtimeConfig.steamGridWorkerUrl)) {
  results.push({
    level: "warn",
    key: "steamGridWorkerUrl",
    message: "SteamGrid worker URL is empty. Artwork refresh will use local fallback behavior."
  });
} else if (!looksLikeHttpUrl(runtimeConfig.steamGridWorkerUrl)) {
  results.push({
    level: "error",
    key: "steamGridWorkerUrl",
    message: "SteamGrid worker URL must be a valid http(s) URL."
  });
}

if (!isNonEmptyString(runtimeConfig.googleDriveClientId)) {
  results.push({
    level: "warn",
    key: "googleDriveClientId",
    message: "Google Drive client ID is empty. Drive sync will remain unavailable."
  });
}

const errors = results.filter((item) => item.level === "error");

console.log("[checkpoint] Config preflight report:");
if (!results.length) {
  console.log("  - PASS: All checked runtime config values look valid.");
} else {
  results.forEach((item) => {
    console.log(`  - ${item.level.toUpperCase()}: ${item.key} -> ${item.message}`);
  });
}

if (errors.length) {
  process.exit(1);
}
