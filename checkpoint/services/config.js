export function getServiceConfig() {
  const runtimeConfig = globalThis.CHECKPOINT_CONFIG ?? {};
  const workerBaseUrl = runtimeConfig.workerBaseUrl ?? runtimeConfig.steamGridWorkerUrl ?? "";

  return {
    workerBaseUrl,
    steamGridWorkerUrl: runtimeConfig.steamGridWorkerUrl ?? workerBaseUrl,
    googleDriveClientId: runtimeConfig.googleDriveClientId ?? ""
  };
}
