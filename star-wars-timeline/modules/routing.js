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

export function buildPageUrl(page, baseHref = window.location.href) {
  const url = new URL(baseHref);
  const allowedPages = new Set(["timeline", "guide", "stats", "preferences", "privacy", "terms"]);
  const normalizedPage = allowedPages.has(page) ? page : "timeline";

  if (normalizedPage === "timeline") {
    url.searchParams.delete("page");
    return url;
  }

  url.searchParams.set("page", normalizedPage);
  url.searchParams.delete("entry");
  return url;
}

export function syncPageUrl(page, buildUrl, { mode = "replace" } = {}) {
  const url = buildUrl(page);
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({}, "", nextUrl);
    return;
  }
  window.history.replaceState({}, "", nextUrl);
}

export function getPageFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search);
  const page = String(params.get("page") || "").trim().toLowerCase();
  if (["guide", "stats", "preferences", "privacy", "terms"].includes(page)) {
    return page;
  }
  return "timeline";
}
