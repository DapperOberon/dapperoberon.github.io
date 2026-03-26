export function initializeShellInteractions({
  searchInputValue,
  onSearchInput,
  onScrollTarget,
  onNavigatePage,
  onOpenStats,
  onOpenPreferences
}) {
  const searchInput = document.getElementById("timeline-search-input");
  if (searchInput && typeof onSearchInput === "function") {
    searchInput.addEventListener("input", (event) => {
      onSearchInput(event, searchInputValue);
    });
  }

  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-scroll-target");
      if (typeof onScrollTarget === "function") {
        onScrollTarget(targetId);
      }
    });
  });

  document.querySelectorAll("[data-nav-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.getAttribute("data-nav-page");
      if (typeof onNavigatePage === "function") {
        onNavigatePage(page);
      }
    });
  });

  document.querySelectorAll("[data-open-stats]").forEach((button) => {
    button.addEventListener("click", () => {
      if (typeof onOpenStats === "function") {
        onOpenStats();
      }
    });
  });

  document.querySelectorAll("[data-open-preferences]").forEach((button) => {
    button.addEventListener("click", () => {
      if (typeof onOpenPreferences === "function") {
        onOpenPreferences();
      }
    });
  });
}

export function initializeAppInteractions(callbacks) {
  const {
    onOpenModal,
    onCloseModal,
    onOpenFilters,
    onCloseFilters,
    onToggleFilterEra,
    onSetFilterType,
    onSetFilterCanon,
    onSetFilterProgress,
    onSetFilterArc,
    onClearFilters,
    onApplyFilters,
    onToggleEntry,
    onEntryPlay,
    onToggleEpisode,
    onEpisodePlay,
    onModalPrimary,
    onModalNavigate,
    onShareEntry,
    onEntryInfo,
    onCloseStats,
    onClosePreferences,
    onStatsOpenEntry,
    onTogglePreference,
    onRangePreference,
    onThemePreference,
    onResetProgress
  } = callbacks;

  document.querySelectorAll("[data-entry-id]").forEach((card) => {
    card.addEventListener("click", (event) => {
      const modalTrigger = event.target.closest("[data-open-modal]");
      const toggleTrigger = event.target.closest("[data-toggle-entry]");
      if (toggleTrigger) return;
      if (modalTrigger || !event.target.closest("button")) {
        onOpenModal?.(card.getAttribute("data-entry-id"));
      }
    });

    card.addEventListener("keydown", (event) => {
      if (event.target !== card) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      onOpenModal?.(card.getAttribute("data-entry-id"));
    });
  });

  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onOpenModal?.(button.getAttribute("data-open-modal"));
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => onCloseModal?.());
  });

  document.querySelectorAll("[data-open-filters]").forEach((button) => {
    button.addEventListener("click", () => onOpenFilters?.());
  });

  document.querySelectorAll("[data-close-filters]").forEach((button) => {
    button.addEventListener("click", () => onCloseFilters?.());
  });

  document.querySelectorAll("[data-filter-era]").forEach((button) => {
    button.addEventListener("click", () => {
      onToggleFilterEra?.(button.getAttribute("data-filter-era"));
    });
  });

  document.querySelectorAll("[data-filter-type]").forEach((button) => {
    button.addEventListener("click", () => {
      onSetFilterType?.(button.getAttribute("data-filter-type") || "all");
    });
  });

  document.querySelectorAll("[data-filter-canon]").forEach((button) => {
    button.addEventListener("click", () => {
      onSetFilterCanon?.(button.getAttribute("data-filter-canon") || "all");
    });
  });

  document.querySelectorAll("[data-filter-progress]").forEach((button) => {
    button.addEventListener("click", () => {
      onSetFilterProgress?.(button.getAttribute("data-filter-progress") || "all");
    });
  });

  document.querySelectorAll("[data-filter-arc]").forEach((button) => {
    button.addEventListener("click", () => {
      onSetFilterArc?.(button.getAttribute("data-filter-arc") || "all");
    });
  });

  document.querySelectorAll("[data-clear-filters]").forEach((button) => {
    button.addEventListener("click", () => onClearFilters?.());
  });

  document.querySelectorAll("[data-apply-filters]").forEach((button) => {
    button.addEventListener("click", () => onApplyFilters?.());
  });

  document.querySelectorAll("[data-toggle-entry]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onToggleEntry?.(button.getAttribute("data-toggle-entry"));
    });
  });

  document.querySelectorAll("[data-entry-play]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.stopPropagation();
      onEntryPlay?.();
    });
  });

  document.querySelectorAll("[data-episode-toggle]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onToggleEpisode?.(Number(button.getAttribute("data-episode-toggle")));
    });
  });

  document.querySelectorAll("[data-episode-play]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.stopPropagation();
      onEpisodePlay?.();
    });
  });

  document.querySelectorAll("[data-modal-primary]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onModalPrimary?.();
    });
  });

  document.querySelectorAll("[data-modal-nav]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onModalNavigate?.(button.getAttribute("data-modal-nav"));
    });
  });

  document.querySelectorAll("[data-share-entry]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await onShareEntry?.(button.getAttribute("data-share-entry"));
    });
  });

  document.querySelectorAll("[data-entry-info]").forEach((link) => {
    link.addEventListener("click", () => onEntryInfo?.());
  });

  document.querySelectorAll("[data-close-stats]").forEach((button) => {
    button.addEventListener("click", () => onCloseStats?.());
  });

  document.querySelectorAll("[data-close-preferences]").forEach((button) => {
    button.addEventListener("click", () => onClosePreferences?.());
  });

  document.querySelectorAll("[data-stats-open-entry]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onStatsOpenEntry?.(button.getAttribute("data-stats-open-entry"));
    });
  });

  document.querySelectorAll("[data-pref-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      onTogglePreference?.(button.getAttribute("data-pref-toggle"));
    });
  });

  document.querySelectorAll("[data-pref-range]").forEach((input) => {
    input.addEventListener("input", () => {
      onRangePreference?.(input.getAttribute("data-pref-range"), Number(input.value));
    });
  });

  document.querySelectorAll("[data-pref-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      onThemePreference?.(button.getAttribute("data-pref-theme"));
    });
  });

  document.querySelectorAll("[data-reset-progress]").forEach((button) => {
    button.addEventListener("click", () => onResetProgress?.());
  });
}
