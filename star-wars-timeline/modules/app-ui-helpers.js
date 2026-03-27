export function hasActiveOverlay(appState) {
  return Boolean(
    appState.activeEntryId ||
    appState.isFilterPanelOpen
  );
}

export function getCurrentPage(appState) {
  return appState.currentPage || "timeline";
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToTargetElement(target) {
  if (!target) return;
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start"
  });
}

export function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter((element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"));
}

function setActiveScrollTarget(targetId) {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.classList.toggle("is-active", button.getAttribute("data-scroll-target") === targetId);
  });
}

export function initializeActiveSectionTracking({
  activeSectionCleanup,
  currentPage,
  requestAnimationFrameImpl = window.requestAnimationFrame.bind(window)
}) {
  if (typeof activeSectionCleanup === "function") {
    activeSectionCleanup();
  }

  const isMobile = window.innerWidth < 768;
  let targetIds = [];

  if (currentPage === "preferences") {
    targetIds = ["prefs-temporal", "prefs-content", "prefs-interface", "prefs-system"];
  } else if (currentPage === "stats") {
    targetIds = ["stats-overview", "stats-era-breakdown", "stats-media-distribution", "stats-next-objective"];
  } else if (currentPage === "guide" || currentPage === "privacy" || currentPage === "terms") {
    targetIds = Array.from(document.querySelectorAll("[data-scroll-target]"))
      .map((button) => button.getAttribute("data-scroll-target"))
      .filter(Boolean);
  } else {
    targetIds = Array.from(document.querySelectorAll("[data-scroll-target]"))
      .map((button) => button.getAttribute("data-scroll-target"))
      .filter((id) => id && (isMobile ? id.startsWith("mobile-era-") : id.startsWith("era-")));
  }

  const sections = targetIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (sections.length === 0) return null;

  let ticking = false;

  const updateActiveSection = () => {
    ticking = false;

    const focusLine = window.innerHeight * (isMobile ? 0.28 : 0.33);
    const orderedSections = sections
      .map((section) => ({ section, rect: section.getBoundingClientRect() }))
      .sort((a, b) => a.rect.top - b.rect.top);

    const crossedSections = orderedSections.filter(({ rect }) => rect.top <= focusLine);
    const activeSection = crossedSections.length > 0
      ? crossedSections[crossedSections.length - 1].section
      : orderedSections[0].section;

    if (activeSection) {
      setActiveScrollTarget(activeSection.id);
    }
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrameImpl(updateActiveSection);
  };

  updateActiveSection();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  return () => {
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", requestUpdate);
  };
}
