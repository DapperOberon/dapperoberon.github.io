export function createDriveSyncActions(ctx) {
  const {
    state,
    emit,
    integrations,
    setActionState,
    buildExportState,
    buildComparableStateSignature,
    getDeviceIdentity,
    getSyncConflict,
    setSyncConflict,
    updateSyncMeta,
    importLibraryBackup,
    normalizePersistedState,
    createSyncHistoryEntry
  } = ctx;

  function buildSyncPayload() {
    const deviceIdentity = getDeviceIdentity();
    const syncAt = new Date().toISOString();

    return {
      syncAt,
      state: {
        ...buildExportState(),
        syncMeta: {
          ...state.syncMeta,
          lastRemoteSyncAt: syncAt,
          lastSyncedByDeviceId: deviceIdentity.deviceId,
          lastSyncedByDeviceLabel: deviceIdentity.deviceLabel
        }
      }
    };
  }

  function pushSyncHistory(entry) {
    state.syncHistory = [entry, ...state.syncHistory].slice(0, 6);
  }

  function connectGoogleDrive() {
    return (async () => {
      setActionState("sync", {
        tone: "info",
        message: "Connecting to Google Drive..."
      });
      emit();

      const result = await integrations.googleDrive.connect();
      setActionState("sync", {
        tone: result.ok ? "success" : "error",
        message: result.message
      });
      state.notice = {
        tone: result.ok ? "success" : "error",
        message: result.message
      };
      emit();
    })();
  }

  function disconnectGoogleDrive() {
    const result = integrations.googleDrive.disconnect();
    ctx.driveRuntime.clearAutoBackupQueue();
    setSyncConflict(null);
    state.library = state.library.map((entry) => ({
      ...entry,
      syncState: "offline"
    }));
    setActionState("sync", {
      tone: result.ok ? "success" : "error",
      message: result.message
    });
    state.notice = {
      tone: result.ok ? "success" : "error",
      message: result.message
    };
    emit();
  }

  function updateDeviceLabel(label) {
    const nextLabel = String(label ?? "").trim() || "This Device";
    if (nextLabel === state.deviceIdentity.deviceLabel) return;

    state.deviceIdentity = {
      ...state.deviceIdentity,
      deviceLabel: nextLabel
    };
    state.notice = {
      tone: "success",
      message: `Current device label updated to ${nextLabel}.`
    };
    emit();
  }

  function saveLocalRestorePoint(source) {
    const payload = {
      timestamp: new Date().toISOString(),
      source,
      content: JSON.stringify(buildExportState(), null, 2)
    };
    const saved = ctx.writeLocalRestorePoint(payload);
    if (saved) {
      state.restorePointMeta = {
        timestamp: payload.timestamp,
        source: payload.source
      };
    }
    return saved;
  }

  function restoreLocalSafetySnapshot() {
    const restorePoint = ctx.readLocalRestorePoint();
    if (!restorePoint?.content) {
      setActionState("backup", {
        tone: "error",
        message: "No local restore safety snapshot is available."
      });
      state.notice = {
        tone: "error",
        message: "No local restore safety snapshot is available."
      };
      emit();
      return false;
    }

    const restored = importLibraryBackup(restorePoint.content, "local restore snapshot");
    if (restored) {
      setSyncConflict(null);
      setActionState("backup", {
        tone: "success",
        message: "Local restore safety snapshot applied."
      });
      pushSyncHistory(createSyncHistoryEntry({
        ok: true,
        mode: "local-restore",
        message: "Local restore safety snapshot applied."
      }));
    }
    return restored;
  }

  async function loadRemoteSyncSnapshot() {
    const backup = await integrations.googleDrive.restoreAppState();
    const imported = JSON.parse(backup.content);
    const normalized = normalizePersistedState(imported, { initialLibrary: [], initialCatalog: [] });
    const remoteComparableSignature = buildComparableStateSignature(normalized);
    const localComparableSignature = buildComparableStateSignature(buildExportState());
    const localKnownRemoteAt = state.syncMeta.lastRemoteSyncAt ? new Date(state.syncMeta.lastRemoteSyncAt).getTime() : 0;
    const localMutationAt = state.syncMeta.lastLocalMutationAt ? new Date(state.syncMeta.lastLocalMutationAt).getTime() : 0;
    const remoteSyncAt = normalized?.syncMeta?.lastRemoteSyncAt
      ? new Date(normalized.syncMeta.lastRemoteSyncAt).getTime()
      : (backup.modifiedTime ? new Date(backup.modifiedTime).getTime() : 0);
    const remoteChangedSinceKnown = remoteSyncAt > localKnownRemoteAt
      || (backup.version && backup.version !== state.syncMeta.lastRemoteVersion)
      || (backup.fileId && backup.fileId !== state.syncMeta.lastRemoteFileId);
    const localChangedSinceKnown = localMutationAt > localKnownRemoteAt;
    const signaturesMatch = remoteComparableSignature === localComparableSignature;

    return {
      backup,
      normalized,
      signaturesMatch,
      localKnownRemoteAt,
      localMutationAt,
      remoteSyncAt,
      remoteChangedSinceKnown,
      localChangedSinceKnown
    };
  }

  function deriveConflictState(remoteSnapshot) {
    if (remoteSnapshot.signaturesMatch) {
      return null;
    }

    let mode = "diverged";
    if (!remoteSnapshot.localChangedSinceKnown && remoteSnapshot.remoteChangedSinceKnown) {
      mode = "remote-newer";
    } else if (remoteSnapshot.localChangedSinceKnown && !remoteSnapshot.remoteChangedSinceKnown) {
      mode = "local-newer";
    } else if (!remoteSnapshot.localChangedSinceKnown && !remoteSnapshot.remoteChangedSinceKnown) {
      mode = remoteSnapshot.remoteSyncAt >= remoteSnapshot.localMutationAt ? "remote-newer" : "local-newer";
    }

    const remoteLabel = remoteSnapshot.normalized?.syncMeta?.lastSyncedByDeviceLabel || "Another device";
    const localLabel = state.deviceIdentity.deviceLabel;

    return {
      mode,
      local: {
        deviceLabel: localLabel,
        modifiedAt: state.syncMeta.lastLocalMutationAt || "",
        summary: `${localLabel} local state`
      },
      remote: {
        deviceLabel: remoteLabel,
        modifiedAt: remoteSnapshot.normalized?.syncMeta?.lastRemoteSyncAt || remoteSnapshot.backup.modifiedTime || "",
        summary: `${remoteLabel} Drive backup`
      },
      preferredResolution: mode === "remote-newer" ? "restore-remote" : "keep-local",
      remoteBackupContent: remoteSnapshot.backup.content,
      remoteFilename: remoteSnapshot.backup.filename
    };
  }

  async function preflightRemoteConflict() {
    if (!integrations.googleDrive.isConfigured()) {
      return null;
    }

    try {
      const remoteSnapshot = await loadRemoteSyncSnapshot();
      const conflict = deriveConflictState(remoteSnapshot);
      setSyncConflict(conflict);
      return conflict;
    } catch (error) {
      return null;
    }
  }

  async function restoreFromGoogleDrive() {
    setActionState("sync", {
      tone: "info",
      message: "Fetching Checkpoint backup from Google Drive..."
    });
    emit();

    try {
      const existingConflict = getSyncConflict();
      const backup = existingConflict?.remoteBackupContent
        ? {
            content: existingConflict.remoteBackupContent
          }
        : await integrations.googleDrive.restoreAppState();
      saveLocalRestorePoint("before Google Drive restore");
      const imported = importLibraryBackup(backup.content, "Google Drive backup");
      if (!imported) {
        setActionState("sync", {
          tone: "error",
          message: "Drive backup was found, but it could not be restored."
        });
        emit();
        return false;
      }

      setSyncConflict(null);
      setActionState("sync", {
        tone: "success",
        message: "Google Drive backup restored into local Checkpoint state. A local safety snapshot was saved first."
      });
      pushSyncHistory(createSyncHistoryEntry({
        ok: true,
        mode: "restore-remote",
        message: "Google Drive backup restored after saving a local safety snapshot."
      }));
      emit();
      return true;
    } catch (error) {
      setActionState("sync", {
        tone: "error",
        message: error instanceof Error ? error.message : "Google Drive restore failed."
      });
      state.notice = {
        tone: "error",
        message: error instanceof Error ? error.message : "Google Drive restore failed."
      };
      emit();
      return false;
    }
  }

  async function markAllSynced(options = {}) {
    setActionState("sync", {
      tone: "info",
      message: integrations.googleDrive.isConfigured()
        ? "Syncing library to Google Drive..."
        : "Connect Google Drive before syncing."
    });
    if (!integrations.googleDrive.isConfigured()) {
      state.notice = {
        tone: "error",
        message: "Google Drive must be connected before sync can run."
      };
      emit();
      return;
    }
    emit();

    const conflict = options.force ? null : await preflightRemoteConflict();
    if (conflict?.mode === "remote-newer" || conflict?.mode === "diverged") {
      pushSyncHistory(createSyncHistoryEntry({
        ok: false,
        mode: "conflict",
        message: conflict.mode === "remote-newer"
          ? "Drive had a newer backup from another device."
          : "Local and Drive state diverged and require an explicit choice."
      }));
      setActionState("sync", {
        tone: "warning",
        message: conflict.mode === "remote-newer"
          ? "Drive has a newer backup from another device. Choose how to resolve it before syncing."
          : "Local and Drive state have diverged. Choose how to resolve the conflict before syncing."
      });
      state.notice = {
        tone: "warning",
        message: conflict.mode === "remote-newer"
          ? "Drive has a newer backup from another device."
          : "Checkpoint found a sync conflict between this device and Drive."
      };
      emit();
      return;
    }

    let syncResult;
    try {
      const syncPayload = buildSyncPayload();
      syncResult = await integrations.googleDrive.syncAppState({
        state: syncPayload.state,
        mode: "manual"
      });
    } catch (error) {
      setActionState("sync", {
        tone: "error",
        message: "Sync failed before completion."
      });
      pushSyncHistory(createSyncHistoryEntry({
        ok: false,
        mode: "manual",
        message: "Sync failed before completion."
      }));
      state.notice = {
        tone: "error",
        message: "Checkpoint could not complete the sync."
      };
      emit();
      return;
    }

    state.library = state.library.map((entry) => ({
      ...entry,
      syncState: integrations.googleDrive.isConfigured() ? "ready" : "offline",
      updatedAt: entry.updatedAt
    }));
    if (typeof ctx.driveRuntime.setLastTrackedSyncDataSignature === "function") {
      ctx.driveRuntime.setLastTrackedSyncDataSignature();
    }
    updateSyncMeta({
      lastRemoteSyncAt: syncResult?.remote?.syncedAt ?? new Date().toISOString(),
      lastRemoteFileId: syncResult?.remote?.fileId ?? state.syncMeta.lastRemoteFileId,
      lastRemoteModifiedTime: syncResult?.remote?.modifiedTime ?? state.syncMeta.lastRemoteModifiedTime,
      lastRemoteVersion: syncResult?.remote?.version ?? state.syncMeta.lastRemoteVersion,
      lastSyncedByDeviceId: getDeviceIdentity().deviceId,
      lastSyncedByDeviceLabel: getDeviceIdentity().deviceLabel
    });
    ctx.driveRuntime.setLastAutoBackupSignature(JSON.stringify(buildExportState()));
    ctx.driveRuntime.clearQueuedAutoBackupSignature();
    setActionState("sync", {
      tone: syncResult?.ok === false ? "error" : "success",
      message: syncResult?.message ?? "Sync complete."
    });
    pushSyncHistory(createSyncHistoryEntry({
      ok: syncResult?.ok !== false,
      mode: syncResult?.mode ?? "manual",
      message: syncResult?.message ?? "Sync complete."
    }));
    state.notice = {
      tone: syncResult?.ok === false ? "error" : "success",
      message: syncResult?.message ?? "Checkpoint sync finished."
    };
    setSyncConflict(null);
    emit();
  }

  async function keepLocalDuringConflict() {
    saveLocalRestorePoint("before keeping local over Drive conflict");
    setSyncConflict(null);
    await markAllSynced({ force: true });
  }

  return {
    connectGoogleDrive,
    disconnectGoogleDrive,
    updateDeviceLabel,
    saveLocalRestorePoint,
    restoreLocalSafetySnapshot,
    restoreFromGoogleDrive,
    markAllSynced,
    keepLocalDuringConflict
  };
}
