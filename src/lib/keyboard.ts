// Opening the on-screen keyboard on the *next* page (iOS).
//
// iOS only shows the keyboard when focus happens inside a user tap, so a page
// that focuses its input after loading never gets one. Instead, during the tap
// that navigates, we focus a hidden "proxy" input (keyboard opens), and the next
// page moves focus from it to its real field — moving focus between inputs keeps
// the keyboard up.

const PROXY_ID = 'keyboard-proxy';
const PHONE = '(max-width: 480px)';

/** Call synchronously inside the tap handler that navigates to the next page. */
export function holdKeyboardForNextPage() {
	if (!window.matchMedia(`${PHONE} and (pointer: coarse)`).matches) return;
	let proxy = document.getElementById(PROXY_ID) as HTMLInputElement | null;
	if (!proxy) {
		proxy = document.createElement('input');
		proxy.id = PROXY_ID;
		proxy.setAttribute('aria-hidden', 'true');
		proxy.tabIndex = -1;
		// 16px so iOS doesn't zoom; invisible and out of the way
		proxy.style.cssText =
			'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;';
		document.body.appendChild(proxy);
	}
	proxy.focus({ preventScroll: true });
}

/** Call from the next page's onMount with the field that should get the keyboard. */
export function handOffKeyboard(field: HTMLElement | null | undefined) {
	if (field && window.matchMedia(PHONE).matches) field.focus({ preventScroll: true });
	document.getElementById(PROXY_ID)?.remove();
}
