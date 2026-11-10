// Shared layout maths for the two-card postcard views (post, share, received).

/** Phones: everything up to this width (matches the `mobile` screen in tailwind.config.ts). */
export const PHONE_MAX = 480;

/** Resting position of the artwork card: tilted behind the written side. */
export const ARTWORK_BEHIND = 'translateX(0px) rotate(12deg) scale(1)';

/**
 * Artwork card brought to the front. On phones it grows to fill the screen
 * with 20px on each side; elsewhere it just straightens up.
 *
 * Inside the 600px postcard the artwork card is 450px wide at x=72, and on phones
 * ScaleToFit (phoneFill) scales the whole postcard by (W - 32) / 600.
 */
export function artworkInFront(viewportWidth: number): string {
	if (!viewportWidth || viewportWidth > PHONE_MAX) return 'translateX(0px) rotate(0deg) scale(1)';
	const postcardScale = (viewportWidth - 32) / 600;
	const scale = (viewportWidth - 40) / (450 * postcardScale);
	// Its centre sits 3px left of the postcard's centre (72 + 225 = 297 vs 300)
	return `translateX(3px) rotate(0deg) scale(${scale})`;
}
