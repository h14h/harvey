/**
 * DOM environment setup for Bun tests that require a browser-like environment.
 */

import { Window } from "happy-dom";

const window = new Window({ url: "https://localhost:8080/" });

// Set up global DOM environment
Object.assign(globalThis, {
	window,
	document: window.document,
	navigator: window.navigator,
	HTMLElement: window.HTMLElement,
	customElements: window.customElements,
});
