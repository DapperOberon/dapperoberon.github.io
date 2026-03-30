import { createSteamGridService } from "./steamgrid.js";
import { createStorefrontMetadataService } from "./storefronts.js";
import { createGoogleDriveService } from "./google-drive.js";

export function createIntegrations() {
  return {
    steamGrid: createSteamGridService(),
    storefronts: createStorefrontMetadataService(),
    googleDrive: createGoogleDriveService()
  };
}
