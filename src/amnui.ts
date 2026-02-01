const comps = import.meta.glob("./**/*.comp.ts");

import "./styles/theme.scss";

export interface AMNUIOptions {
    styleOverride?: any;
    themeOverride?: string;
    toasts?: boolean;
}

export default class AMNUI {
    styleOverride: any;

    constructor(options?: AMNUIOptions) {
        this.styleOverride = options?.styleOverride || {};
        this.loadTheme(options?.themeOverride);
        this.init();
        if (options?.toasts) this.injectToaster();
    }

    private injectToaster() {
        const add = () => {
            if (document.querySelector("amnui-toaster")) return;
            const el = document.createElement("amnui-toaster");
            // prepend so it's early in DOM, but fixed-position anyway
            document.body.prepend(el);
        };

        if (document.body) {
            add();
            return;
        }

        window.addEventListener("DOMContentLoaded", add, { once: true });
    }

    async loadTheme(url?: string) {
        // Default theme is loaded by the SCSS side-effect import above.
        // If a URL override is provided, append it as an additional stylesheet.
        if (!url) return;
        const themeLink = document.createElement("link");
        themeLink.rel = "stylesheet";
        themeLink.href = url;
        document.head.appendChild(themeLink);
    }

    async init() {
        Object.entries(comps).forEach(async ([fileName, importer]) => {
            const comp = (await importer()) as any;
            const compName = fileName.split("/").pop()?.replace(".comp.ts", "") as string;
            if (this.styleOverride[compName]) comp.default.styleSrc = this.styleOverride[compName];
            customElements.define(compName, comp.default);
        });
    }
}
