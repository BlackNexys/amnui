export default class AmnuiLink extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLLinkElement;
    rootElement?: HTMLAnchorElement;
    static styleSrc = new URL("/src/styles/components/amnui-button.scss", import.meta.url).href;

    static get observedAttributes() {
        return ["variant", "theme", "href"];
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
        this.shadow.innerHTML = `
            <a href="${this.attrs.href}" class="root ${this.attrs.variant} ${this.attrs.theme}">
                <slot></slot>
            </a>
            <link rel="stylesheet" href="${AmnuiLink.styleSrc}" />
        `;
        this.rootElement = this.shadow.querySelector("#root")!;
        this.styleSheet = this.shadow.querySelector("link")!;
    }
}