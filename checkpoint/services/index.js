import { createSteamGridService } from "./steamgrid.js";
import { createMetadataResolverService } from "./storefronts.js";
import { createGoogleDriveService } from "./google-drive.js";
import { createPricingService } from "./pricing.js";
export { getServiceConfig } from "./config.js";

export function createIntegrations() {
  return {
    steamGrid: createSteamGridService(),
    metadataResolver: createMetadataResolverService(),
    googleDrive: createGoogleDriveService(),
    pricing: createPricingService()
  };
}
