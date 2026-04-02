import { getServiceConfig } from "./config.js";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const BACKUP_FILENAME = "checkpoint-app-state.json";

let accessToken = "";
let tokenClient = null;

function getGoogleAccounts() {
  return globalThis.google?.accounts?.oauth2 ?? null;
}

function getStatusSnapshot() {
  const { googleDriveClientId } = getServiceConfig();

  return {
    available: Boolean(googleDriveClientId && getGoogleAccounts()),
    connected: Boolean(accessToken),
    clientConfigured: Boolean(googleDriveClientId)
  };
}

function isConfigured() {
  return getStatusSnapshot().connected;
}

function getStatus() {
  return getStatusSnapshot();
}

function ensureTokenClient() {
  const oauth = getGoogleAccounts();
  const { googleDriveClientId } = getServiceConfig();

  if (!googleDriveClientId) {
    throw new Error("googleDriveClientId is missing from checkpoint/config.js.");
  }

  if (!oauth) {
    throw new Error("Google Identity Services is not loaded.");
  }

  if (!tokenClient) {
    tokenClient = oauth.initTokenClient({
      client_id: googleDriveClientId,
      scope: DRIVE_SCOPE,
      callback: () => {}
    });
  }

  return tokenClient;
}

function requestAccessToken(prompt = "consent") {
  const client = ensureTokenClient();

  return new Promise((resolve, reject) => {
    client.callback = (response) => {
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }

      accessToken = response?.access_token ?? "";
      if (!accessToken) {
        reject(new Error("No Google access token was returned."));
        return;
      }

      resolve(accessToken);
    };

    client.requestAccessToken({ prompt });
  });
}

async function ensureAccessToken() {
  if (accessToken) {
    return accessToken;
  }

  return requestAccessToken("consent");
}

async function driveJson(url, init = {}) {
  const token = await ensureAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Drive request failed with status ${response.status}: ${body}`);
  }

  return response.json();
}

async function driveText(url, init = {}) {
  const token = await ensureAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Drive request failed with status ${response.status}: ${body}`);
  }

  return response.text();
}

function buildMultipartBody(metadata, content) {
  const boundary = `checkpoint-${Math.random().toString(36).slice(2)}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    content,
    `--${boundary}--`
  ].join("\r\n");

  return {
    body,
    boundary
  };
}

async function findBackupFile() {
  const query = encodeURIComponent(`name='${BACKUP_FILENAME}' and 'appDataFolder' in parents and trashed=false`);
  const fields = encodeURIComponent("files(id,name,modifiedTime,version)");
  const url = `${DRIVE_API_BASE}/files?q=${query}&spaces=appDataFolder&fields=${fields}&pageSize=1`;
  const payload = await driveJson(url);
  return Array.isArray(payload.files) ? payload.files[0] ?? null : null;
}

async function uploadBackupContent(state) {
  const content = JSON.stringify(state, null, 2);
  const existingFile = await findBackupFile();
  const metadata = existingFile
    ? { name: BACKUP_FILENAME }
    : { name: BACKUP_FILENAME, parents: ["appDataFolder"] };
  const { body, boundary } = buildMultipartBody(metadata, content);

  const baseUrl = existingFile
    ? `${DRIVE_UPLOAD_BASE}/files/${existingFile.id}?uploadType=multipart&fields=id,modifiedTime,version`
    : `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,modifiedTime,version`;

  const payload = await driveJson(baseUrl, {
    method: existingFile ? "PATCH" : "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body
  });

  return {
    fileId: payload.id ?? existingFile?.id ?? "",
    modifiedTime: payload.modifiedTime ?? existingFile?.modifiedTime ?? "",
    version: payload.version ? String(payload.version) : "",
    created: !existingFile
  };
}

async function restoreAppState() {
  const existingFile = await findBackupFile();
  if (!existingFile?.id) {
    throw new Error("No Checkpoint Drive backup was found in appDataFolder.");
  }

  const content = await driveText(`${DRIVE_API_BASE}/files/${existingFile.id}?alt=media`);

  return {
    filename: BACKUP_FILENAME,
    content,
    fileId: existingFile.id,
    modifiedTime: existingFile.modifiedTime ?? "",
    version: existingFile.version ? String(existingFile.version) : ""
  };
}

function revokeCurrentToken() {
  const oauth = getGoogleAccounts();
  if (oauth?.revoke && accessToken) {
    oauth.revoke(accessToken, () => {});
  }
  accessToken = "";
}

export function createGoogleDriveService() {
  return {
    isConfigured,
    getStatus,

    async connect() {
      try {
        await requestAccessToken("consent");
        return {
          ok: true,
          mode: "oauth",
          message: "Google Drive connected."
        };
      } catch (error) {
        return {
          ok: false,
          mode: "oauth",
          message: error instanceof Error ? error.message : "Google Drive connection failed."
        };
      }
    },

    disconnect() {
      revokeCurrentToken();
      return {
        ok: true,
        mode: "oauth",
        message: "Google Drive disconnected."
      };
    },

    async syncAppState(input = {}) {
      try {
        const uploadResult = await uploadBackupContent(input.state ?? {});
        return {
          ok: true,
          mode: input.mode ?? "manual",
          message: uploadResult.created
            ? "Checkpoint backup created in Google Drive."
            : "Checkpoint backup updated in Google Drive.",
          remote: {
            fileId: uploadResult.fileId,
            modifiedTime: uploadResult.modifiedTime,
            version: uploadResult.version,
            syncedAt: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          ok: false,
          mode: input.mode ?? "manual",
          message: error instanceof Error ? error.message : "Google Drive sync failed."
        };
      }
    },

    async restoreAppState() {
      return restoreAppState();
    }
  };
}
