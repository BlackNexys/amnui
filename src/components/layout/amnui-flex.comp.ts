import FlexStyleClass from "./FlexStyle.class";
import ChecksumService from "../../services/checksum.service";
export default class AmnuiFlex extends HTMLElement {
    static styleSources: any = {};
    shadow: ShadowRoot;
    styleSheet?: HTMLLinkElement;
    rootElement?: HTMLDivElement;

    styleSheetURL: string;
    styleCheckSum: string = "";

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
        this.styleSheetURL = this.getStyleSheetUrl();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        // If the style has changed, update the stylesheet
        if (this.getStyleChecksum() !== this.styleCheckSum) {
            this.updateStyleSheet();
        }
    }

    getStyleSheetUrl() {
        this.styleCheckSum = this.getStyleChecksum();
        // If the style has not been generated yet, generate it
        if (!AmnuiFlex.styleSources[this.styleCheckSum]) {
            // Create a new style blob and store it in the styleSources object, to reduce the number of stylesheets
            const style = new Blob([new FlexStyleClass(this.attributes).style]);
            AmnuiFlex.styleSources[this.styleCheckSum] = URL.createObjectURL(style);
        }

        return AmnuiFlex.styleSources[this.styleCheckSum];
    }

    getStyleChecksum() {
        // Generate a checksum based on the attributes
        return ChecksumService.get(
            Object.values(this.attributes)
                .map((x) => x.name + ":" + x.value)
                .join("|")
        );
    }

    updateStyleSheet() {
        this.styleSheetURL = this.getStyleSheetUrl();
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = this.styleSheetURL;
        this.styleSheet?.replaceWith(link);
        this.styleSheet = link;
    }

    render() {
        this.shadow.innerHTML = `
            <div class="root">
                <slot></slot>
            </div>
            <link rel="stylesheet" href="${this.styleSheetURL}">
        `;
        this.rootElement = this.shadow.querySelector(".root") as any;
        this.styleSheet = this.shadow.querySelector("link")!;
    }
}
