export default class AmnuiLink extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLStyleElement;
    rootElement?: HTMLAnchorElement;
    static styleText = "";

    static get observedAttributes() {
        return ["variant", "theme", "href"];
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    static async initStyles() {
        if (this.styleText) return;
        const mod = (await import("../../styles/components/amnui-button.scss?inline")) as any;
        this.styleText = String(mod?.default ?? "");
    }

    connectedCallback() {
        this.render();
    }

    get attrs() {
        return {
            variant: this.getAttribute("variant") || "text",
            theme: this.getAttribute("theme") || "primary",
            href: this.getAttribute("href") || "#"
        };
    }

    attributeChangedCallback() {
        this.rootElement?.classList.remove(...this.rootElement.classList);
        this.rootElement?.classList.add('root', this.attrs.variant, this.attrs.theme);
    }

    render() {
        if (!AmnuiLink.styleText) {
            void AmnuiLink.initStyles().then(() => this.render());
        }
        this.shadow.innerHTML = `
            <a href="${this.attrs.href}" class="root ${this.attrs.variant} ${this.attrs.theme}">
                <slot></slot>
            </a>
            <style>${AmnuiLink.styleText}</style>
        `;
        this.rootElement = this.shadow.querySelector("a.root")!;
        this.styleSheet = this.shadow.querySelector("style")!;
    }
}