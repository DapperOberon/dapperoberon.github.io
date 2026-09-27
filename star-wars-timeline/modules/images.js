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

// Derivatives are generated at a fixed 600px width. Poster art is
// consistently 2:3, so this is the right default aspect box.
export const POSTER_WIDTH = 600;
export const POSTER_HEIGHT = 900;

export function getPosterWebpPath(src) {
  if (typeof src !== "string" || !src) return "";
  return src.replace(/\.jpe?g($|\?)/i, ".webp$1");
}

/**
 * Render a poster as a <picture> with a WebP source and JPG fallback.
 *
 * @param {object} options
 * @param {string} options.src        Original poster path (.jpg).
 * @param {string} options.alt        Alt text. Pass "" for decorative art.
 * @param {string} [options.className] Classes applied to the <img>.
 * @param {boolean} [options.eager]   True for above-the-fold art (hero).
 * @param {string} [options.escape]   Escaping function.
 */
export function renderPoster({
  src,
  alt = "",
  className = "",
  eager = false,
  sizes = "",
  escape = (value) => value
} = {}) {
  if (!src) return "";

  const webp = getPosterWebpPath(src);
  const decorative = alt === "";
  const loadingAttrs = eager
    ? 'loading="eager" decoding="async" fetchpriority="high"'
    : 'loading="lazy" decoding="async"';

  // `display:contents` on the <picture> keeps it from generating a layout box,
  // so the <img> still sizes against the original container. Without it,
  // percentage sizing like `w-full h-full` would resolve against the <picture>.
  return `<picture style="display:contents">${
    webp ? `<source srcset="${escape(webp)}"${sizes ? ` sizes="${escape(sizes)}"` : ""} type="image/webp">` : ""
  }<img class="${escape(className)}" src="${escape(src)}" alt="${escape(alt)}"${decorative ? ' aria-hidden="true"' : ""} width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" ${loadingAttrs}></picture>`;
}
