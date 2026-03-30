export function createPersistence({ storageKey, schemaVersion, normalizeState }) {
  function load(seedState) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return normalizeState(null, seedState);
      const parsed = JSON.parse(raw);
      return normalizeState(parsed, seedState);
    } catch (error) {
      console.warn("Checkpoint: unable to load persisted state.", error);
      return normalizeState(null, seedState);
    }
  }

  function save(state) {
    try {
      const normalizedState = normalizeState(
        {
          schemaVersion,
          ...state
        },
        {
          initialLibrary: state.library,
          initialCatalog: state.catalog
        }
      );
      localStorage.setItem(storageKey, JSON.stringify({
        ...normalizedState,
        schemaVersion
      }));
    } catch (error) {
      console.warn("Checkpoint: unable to persist state.", error);
    }
  }

  return { load, save };
}
