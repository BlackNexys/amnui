export default class AmnuiButton extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLStyleElement;
    rootElement?: HTMLDivElement;
    static styleText = "";

    static get observedAttributes() {
        return ["variant", "theme", "disabled"];
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
            variant: this.getAttribute("variant") || "contained",
            theme: this.getAttribute("theme") || "primary"
        };
    }

    attributeChangedCallback() {
        this.rootElement?.classList.remove(...this.rootElement.classList);
        this.rootElement?.classList.add('root', this.attrs.variant, this.attrs.theme);
        this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";
    }

    render() {
        this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";
        // Ensure styles are loaded (async) before first render.
        // If it isn't ready yet, render skeleton then re-render.
        if (!AmnuiButton.styleText) {
            void AmnuiButton.initStyles().then(() => this.render());
        }
        this.shadow.innerHTML = `
            <button class="root ${this.attrs.variant} ${this.attrs.theme}">
                <slot></slot>
            </button>
            <style>${AmnuiButton.styleText}</style>
        `;
        this.rootElement = this.shadow.querySelector(".root") as any;
        this.styleSheet = this.shadow.querySelector("style")!;
    }
}
