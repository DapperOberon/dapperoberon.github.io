import { createMockArtworkResult } from "./mock-data.js";

export function createSteamGridService() {
  return {
    isConfigured() {
      return false;
    },

    async resolveArtwork({ catalogGame }) {
      return createMockArtworkResult(catalogGame);
    }
  };
}
