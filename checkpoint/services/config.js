function readLocalStorageValue(key) {
  try {
    if (typeof globalThis.localStorage === "undefined") return "";
    return globalThis.localStorage.getItem(key) ?? "";
  } catch (error) {
    return "";
  }
}

function writeLocalStorageValue(key, value) {
  try {
    if (typeof globalThis.localStorage === "undefined") return false;
    globalThis.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function removeLocalStorageValue(key) {
  try {
    if (typeof globalThis.localStorage === "undefined") return false;
    globalThis.localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

export function getServiceConfig() {
  const runtimeConfig = globalThis.CHECKPOINT_CONFIG ?? {};

  return {
    steamGridWorkerUrl: runtimeConfig.steamGridWorkerUrl ?? readLocalStorageValue("checkpoint.steamGridWorkerUrl"),
    googleDriveClientId: runtimeConfig.googleDriveClientId ?? ""
  };
}

export function saveSteamGridWorkerUrl(workerUrl) {
  return writeLocalStorageValue("checkpoint.steamGridWorkerUrl", String(workerUrl ?? "").trim());
}

export function clearSteamGridWorkerUrl() {
  return removeLocalStorageValue("checkpoint.steamGridWorkerUrl");
}
