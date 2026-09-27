/**
 * Poster image helpers.
 *
 * Posters ship as WebP derivatives alongside their original JPGs
 * (`scripts/build_poster_derivatives.py`). Render sites should use
 * `renderPoster()` so every poster consistently gets:
 *
 * - a WebP source with JPG fallback
 * - lazy loading and async decoding, except above-the-fold art
 * - intrinsic width/height so the browser reserves space (no layout shift)
 *
 * Keep this module presentational: no state, no event wiring.
 */

// Derivative widths, mirroring `scripts/build_poster_derivatives.py`.
// Poster art is consistently 2:3, so these double as the intrinsic aspect box.
export const POSTER_WIDTH = 900;
export const POSTER_HEIGHT = 1350;

// The hero backdrop is full-bleed, so it gets a wider variant. The hero entry
// is dynamic (`getNextObjective`), so every poster has one.
export const HERO_POSTER_WIDTH = 1600;
export const HERO_POSTER_HEIGHT = 2400;

export function getPosterWebpPath(src) {
  if (typeof src !== "string" || !src) return "";
  return src.replace(/\.jpe?g($|\?)/i, ".webp$1");
}

export function getHeroPosterWebpPath(src) {
  if (typeof src !== "string" || !src) return "";
  return src.replace(/\.jpe?g($|\?)/i, "-lg.webp$1");
}

/**
 * Render a poster as a <picture> with a WebP source and JPG fallback.
 *
 * @param {object} options
 * @param {string} options.src        Original poster path (.jpg).
 * @param {string} options.alt        Alt text. Pass "" for decorative art.
 * @param {string} [options.className] Classes applied to the <img>.
 * @param {boolean} [options.eager]   True for above-the-fold art (hero).
 * @param {boolean} [options.hero]    True to use the wide full-bleed variant.
 * @param {string} [options.sizes]    Layout hint for source selection.
 * @param {string} [options.escape]   Escaping function.
 */
export function renderPoster({
  src,
  alt = "",
  className = "",
  eager = false,
  hero = false,
  sizes = "",
  escape = (value) => value
} = {}) {
  if (!src) return "";

  const decorative = alt === "";
  const loadingAttrs = eager
    ? 'loading="eager" decoding="async" fetchpriority="high"'
    : 'loading="lazy" decoding="async"';

  // The hero renders full-bleed, so it needs the wide variant; a 900px source
  // would be upscaled ~2x on a 1920px display. Standard posters never exceed
  // ~594 CSS px, so the 900px variant is already generous there.
  const webp = hero ? getHeroPosterWebpPath(src) : getPosterWebpPath(src);
  const intrinsicWidth = hero ? HERO_POSTER_WIDTH : POSTER_WIDTH;
  const intrinsicHeight = hero ? HERO_POSTER_HEIGHT : POSTER_HEIGHT;

  // `display:contents` on the <picture> keeps it from generating a layout box,
  // so the <img> still sizes against the original container. Without it,
  // percentage sizing like `w-full h-full` would resolve against the <picture>.
  return `<picture style="display:contents">${
    webp ? `<source srcset="${escape(webp)}"${sizes ? ` sizes="${escape(sizes)}"` : ""} type="image/webp">` : ""
  }<img class="${escape(className)}" src="${escape(src)}" alt="${escape(alt)}"${decorative ? ' aria-hidden="true"' : ""} width="${intrinsicWidth}" height="${intrinsicHeight}" ${loadingAttrs}></picture>`;
}
