import { createMockStorefrontMetadata } from "./mock-data.js";

export function createStorefrontMetadataService() {
  return {
    isConfigured() {
      return false;
    },

    async lookupGame({ title, storefront, catalogGame }) {
      return createMockStorefrontMetadata({ title, storefront, catalogGame });
    }
  };
}
