import { createMockDriveSyncResult } from "./mock-data.js";

export function createGoogleDriveService() {
  return {
    isConfigured() {
      return false;
    },

    async syncLibrary() {
      return createMockDriveSyncResult();
    }
  };
}
