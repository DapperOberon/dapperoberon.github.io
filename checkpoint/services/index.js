import { createSteamGridService } from "./steamgrid.js";
import { createMetadataResolverService } from "./storefronts.js";
import { createGoogleDriveService } from "./google-drive.js";
export { getServiceConfig } from "./config.js";
export { saveSteamGridWorkerUrl, clearSteamGridWorkerUrl } from "./config.js";

export function createIntegrations() {
  return {
    steamGrid: createSteamGridService(),
    metadataResolver: createMetadataResolverService(),
    googleDrive: createGoogleDriveService()
  };
}
