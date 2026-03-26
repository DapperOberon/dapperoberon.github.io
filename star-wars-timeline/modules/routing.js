export function buildEntryShareUrl(entry, baseHref = window.location.href) {
  const url = new URL(baseHref);
  if (!entry || !entry.id) {
    url.searchParams.delete("entry");
    return url;
  }

  url.searchParams.set("entry", entry.id);
  url.searchParams.delete("title");
  return url;
}

export function syncEntryUrl(entry, buildUrl, { mode = "replace" } = {}) {
  const url = buildUrl(entry);
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({}, "", nextUrl);
    return;
  }
  window.history.replaceState({}, "", nextUrl);
}

export function getEntryIdFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search);
  const entryId = params.get("entry");
  return entryId ? String(entryId).trim() : "";
}
