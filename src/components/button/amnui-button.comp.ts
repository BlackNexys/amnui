export default class AmnuiButton extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLLinkElement;
    rootElement?: HTMLDivElement;
    static styleSrc = new URL("/src/styles/components/amnui-button.scss", import.meta.url).href;

    static get observedAttributes() {
        return ["variant", "theme", "disabled"];
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
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
        this.shadow.innerHTML = `
            <button class="root ${this.attrs.variant} ${this.attrs.theme}">
                <slot></slot>
            </button>
            <link rel="stylesheet" href="${AmnuiButton.styleSrc}" />
        `;
        this.rootElement = this.shadow.querySelector("#root")!;
        this.styleSheet = this.shadow.querySelector("link")!;
    }
}
