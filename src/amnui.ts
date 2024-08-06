const comps = import.meta.glob("./**/*.comp.ts");

export interface AMNUIOptions {
    styleOverride?: any;
    themeOverride?: string;
}

export default class AMNUI {
    styleOverride: any;

    constructor(options?: AMNUIOptions) {
        this.styleOverride = options?.styleOverride || {};
        this.loadTheme(options?.themeOverride);
        this.init();
    }

    async loadTheme(url?: string) {
        const themeLink = document.createElement("link");
        themeLink.rel = "stylesheet";
        themeLink.href = url || new URL("styles/theme.scss", import.meta.url).href;
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
