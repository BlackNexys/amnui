export default class AmnuiFlex extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLLinkElement;
    rootElement?: HTMLDivElement;
    static styleSrc = new URL("/src/styles/components/amnui-flex.scss", import.meta.url).href;

    static get observedAttributes() {
        return [
            "align",
            "justify",
            "direction",
            "wrap",
            "gap",
            "grow",
            "shrink",
            "order",
            "align-self",
            "align-content",
            "inline"
        ];
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
    }

    get styleClasses() {
        const { align, justify, direction, wrap, self, content } = {
            align: this.getAttribute("align") || "start", // Class
            justify: this.getAttribute("justify") || "start", // Class
            direction: this.getAttribute("direction") || "row", // Class
            wrap: this.getAttribute("wrap") || "wrap", // Class
            self: this.getAttribute("align-self") || "auto", // Class
            content: this.getAttribute("align-content") || "normal" // Class
        };
        return `
            align--${align} justify--${justify} direction--${direction} wrap--${wrap} align-self--${self} align-content--${content}
        `;
    }

    get styleProps() {
        const { inline, gap, grow, shrink, basis, order } = {
            inline: this.hasAttribute("inline"), // Style
            gap: this.getAttribute("gap") || "0", // Style
            grow: this.getAttribute("grow") || "0", // Style
            shrink: this.getAttribute("shrink") || "1", // Style
            basis: this.getAttribute("basis") || "auto", // Style
            order: this.getAttribute("order") || "0" // Style
        };
        return `
            display: ${inline ? "inline-flex" : "flex"}; gap: ${gap}; flex-grow: ${grow}; flex-shrink: ${shrink}; flex-basis: ${basis}; order: ${order};
        `;
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        this.shadow.innerHTML = `
            <div id="root" class="${this.styleClasses}" style="${this.styleProps}">
                <slot></slot>
            </div>
            <link rel="stylesheet" href="${AmnuiFlex.styleSrc}" />
        `;
        this.rootElement = this.shadow.querySelector("#root")!;
        this.styleSheet = this.shadow.querySelector("link")!;
    }
}
