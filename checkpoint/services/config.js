export function getServiceConfig() {
  const runtimeConfig = globalThis.CHECKPOINT_CONFIG ?? {};

  return {
    steamGridWorkerUrl: runtimeConfig.steamGridWorkerUrl ?? "",
    googleDriveClientId: runtimeConfig.googleDriveClientId ?? ""
  };
}
