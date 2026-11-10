// Single source of truth for postcard / stamp image URLs.
// Images are pre-optimised to WebP by scripts/optimize-images.mjs and served
// from /static/optimized (cached by the CDN).

export const POSTCARD_COUNT = 26;
export const STAMP_COUNT = 17;

// Index 0 = newest postcard (LIFO order), matching the previous filename list.
export const postcardNames = Array.from({ length: POSTCARD_COUNT }, (_, i) => `img${POSTCARD_COUNT - i}`);

/** 1-based display number → full-size URL (for modal / edit / post / share). */
export function postcardUrl(imageNum: number): string {
	const name = postcardNames[imageNum - 1];
	return name ? `/optimized/postcards/${name}.webp` : '';
}

/** 1-based display number → small thumbnail URL (for grid / stack / home). */
export function postcardThumbUrl(imageNum: number): string {
	const name = postcardNames[imageNum - 1];
	return name ? `/optimized/postcards/thumb/${name}.webp` : '';
}

/** Stamp filename like "stamp3.jpg" → optimised URL. */
export function stampUrlByName(filename: string): string {
	const base = filename.replace(/\.(jpe?g|png)$/i, '');
	return `/optimized/stamps/${base}.webp`;
}

export const selfPortraitUrl = '/optimized/misc/self-portrait.webp';
