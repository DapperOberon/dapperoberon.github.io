/**
 * Presentational UI primitives (Workstream D3).
 *
 * These helpers exist so recurring markup is written once instead of being
 * re-typed as a long inline class string at every call site. Before this
 * module, the nav active/inactive ternary alone was duplicated eleven times
 * across the desktop nav, mobile nav, and footer.
 *
 * Rules for this module:
 * - **Presentational only.** No state, no event wiring, no data access.
 *   Callers pass everything in and attach their own `data-*` hooks.
 * - **Tokens only.** No raw hex, no arbitrary `text-[Npx]` or `tracking-[...]`.
 *   `scripts/check_design_tokens.py` enforces this.
 * - Helpers return HTML strings, matching the rest of the render layer.
 */

/** Join class names, dropping empty/falsy entries and collapsing whitespace. */
export function cx(...values) {
  return values
    .flat()
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pick between active and inactive class strings.
 *
 * Replaces the `${isCurrentPage(x, y) ? "a" : "b"}` ternary that was repeated
 * across every nav and footer link.
 */
export function stateClass(isActive, activeClass, inactiveClass = "") {
  return isActive ? activeClass : inactiveClass;
}

/**
 * Attributes that mark the current page for assistive tech.
 * Returns an empty string when not active so it can be interpolated inline.
 */
export function currentPageAttr(isActive) {
  return isActive ? 'aria-current="page"' : "";
}

/**
 * Material Symbols icon.
 *
 * @param {string} name        Ligature name, e.g. "tune".
 * @param {object} [options]
 * @param {string} [options.className] Extra classes (size, color).
 * @param {boolean} [options.filled]   Use the filled variant.
 * @param {boolean} [options.decorative] Hide from assistive tech (default true;
 *   icons here sit beside visible text labels).
 */
export function icon(name, { className = "", filled = false, decorative = true } = {}) {
  const fill = filled ? ` style="font-variation-settings: 'FILL' 1;"` : "";
  const hidden = decorative ? ' aria-hidden="true"' : "";
  return `<span class="${cx("material-symbols-outlined", className)}"${fill}${hidden}>${name}</span>`;
}

/**
 * Icon whose fill tracks an active state, used by the mobile bottom nav.
 * Kept separate from `icon()` because the fill is dynamic rather than fixed.
 */
export function stateIcon(name, isActive, { className = "" } = {}) {
  return `<span class="${cx("material-symbols-outlined", className)}" style="font-variation-settings: 'FILL' ${isActive ? 1 : 0};" aria-hidden="true">${name}</span>`;
}

/**
 * Bare button with the chrome reset this codebase applies everywhere.
 *
 * @param {object} options
 * @param {string} options.label     Inner HTML.
 * @param {string} [options.className]
 * @param {string} [options.attrs]   Raw attribute string, e.g. `data-nav-page="x"`.
 * @param {string} [options.ariaLabel]
 */
export function button({ label, className = "", attrs = "", ariaLabel = "" } = {}) {
  const aria = ariaLabel ? ` aria-label="${ariaLabel}"` : "";
  return `<button class="${cx("bg-transparent border-0 p-0", className)}" type="button"${aria} ${attrs}>${label}</button>`;
}

/**
 * Primary navigation button (desktop top bar).
 * The active treatment and `aria-current` are applied consistently here.
 */
export function navButton({ page, label, currentPage, className = "", iconName = "" } = {}) {
  const isActive = currentPage === page;
  const inner = iconName
    ? `${icon(iconName, { className: "text-base" })}<span>${label}</span>`
    : label;

  return button({
    label: inner,
    className: cx(
      "nav-underline-button pb-1",
      iconName ? "inline-flex items-center gap-2" : "",
      stateClass(isActive, "is-active text-primary-fixed", "text-white/60"),
      className
    ),
    attrs: `data-nav-page="${page}" ${currentPageAttr(isActive)}`
  });
}

/** Mobile bottom-nav button: stacked icon over label, fill tracks active state. */
export function mobileNavButton({ page, label, currentPage, iconName } = {}) {
  const isActive = currentPage === page;

  return `<button class="${cx(
    "nav-underline-button bg-transparent border-0 flex flex-col items-center justify-center gap-1 py-3",
    stateClass(isActive, "is-active text-primary-fixed", "text-white/45")
  )}" type="button" data-nav-page="${page}" ${currentPageAttr(isActive)}>
          ${stateIcon(iconName, isActive)}
          <span class="font-label text-label uppercase tracking-hud-wider">${label}</span>
        </button>`;
}

/** Footer link. Renders an anchor for external URLs, a nav button otherwise. */
export function footerLink({ page, label, activeLink = "", href = "" } = {}) {
  const base = "font-label uppercase tracking-widest text-label";
  const inactive = "text-white/40 hover:text-primary-fixed transition-colors";

  if (href) {
    return `<a class="${cx(base, inactive)}" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }

  return button({
    label,
    className: cx(base, stateClass(activeLink === page, "text-primary-fixed", inactive)),
    attrs: `data-nav-page="${page}"`
  });
}
