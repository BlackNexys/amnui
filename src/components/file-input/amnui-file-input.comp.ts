export default class AmnuiFileInput extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLStyleElement;
    inputEl?: HTMLInputElement;
    fileNameEl?: HTMLElement;
    buttonEl?: HTMLButtonElement;
    static styleText = "";

    static get observedAttributes() {
        return [
            "id",
            "name",
            "accept",
            "multiple",
            "disabled",
            "required",
            "error-msg",
            "label",
            "description"
        ];
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    static async initStyles() {
        if (this.styleText) return;
        const mod = (await import("../../styles/components/amnui-file-input.scss?inline")) as any;
        this.styleText = String(mod?.default ?? "");
    }

    connectedCallback() {
        this.render();
    }

    get props() {
        return {
            id: this.getAttribute("id") || "",
            name: this.getAttribute("name") || "",
            accept: this.getAttribute("accept") || "",
            multiple: this.hasAttribute("multiple"),
            disabled: this.hasAttribute("disabled"),
            required: this.hasAttribute("required"),
            errorMsg: this.getAttribute("error-msg") || "",
            label: this.getAttribute("label") || "",
            description: this.getAttribute("description") || ""
        };
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (name === "disabled" && this.inputEl) {
            this.inputEl.disabled = this.hasAttribute("disabled");
            return;
        }

        this.render();
    }

    refresh() {
        this.render();
    }

    private updateFileName() {
        const files = this.inputEl?.files;
        if (!this.fileNameEl) return;

        if (!files || files.length === 0) {
            this.fileNameEl.textContent = "No file selected";
            return;
        }

        if (files.length === 1) {
            this.fileNameEl.textContent = files[0].name;
            return;
        }

        this.fileNameEl.textContent = `${files.length} files selected`;
    }

    render() {
        const props = this.props;
        this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";

        if (!AmnuiFileInput.styleText) {
            void AmnuiFileInput.initStyles().then(() => this.render());
        }

        this.shadow.innerHTML = `
            <div class="root">
                ${props.label ? `<label for="${props.id}" class="label">${props.label}</label>` : ""}
                <div class="container ${props.label ? "w-label" : ""}">
                    <button ref="buttonEl" class="button" type="button" ${props.disabled ? "disabled" : ""}>
                        Choose file
                    </button>
                    <div class="filename" ref="fileNameEl">No file selected</div>
                    <input
                        ref="inputEl"
                        class="native"
                        id="${props.id}"
                        name="${props.name}"
                        type="file"
                        ${props.disabled ? "disabled" : ""}
                        ${props.required ? "required" : ""}
                        ${props.multiple ? "multiple" : ""}
                        ${props.accept ? `accept="${props.accept}"` : ""}
                        aria-required="${props.required}"
                        aria-invalid="${Boolean(props.errorMsg)}"
                        aria-describedby="${props.errorMsg ? `${props.id}-error` : `${props.id}-description`}"
                        tabindex="-1"
                    />
                </div>
                ${props.errorMsg ? `<p id="${props.id}-error" class="message error">${props.errorMsg}</p>` : ""}
                ${!props.errorMsg && props.description ? `<p id="${props.id}-description" class="message">${props.description}</p>` : ""}
                <slot></slot>
            </div>
            <style>${AmnuiFileInput.styleText}</style>
        `;

        this.inputEl = this.shadow.querySelector('[ref="inputEl"]') as HTMLInputElement;
        this.fileNameEl = this.shadow.querySelector('[ref="fileNameEl"]') as HTMLElement;
        this.buttonEl = this.shadow.querySelector('[ref="buttonEl"]') as HTMLButtonElement;
        this.styleSheet = this.shadow.querySelector("style")!;

        this.buttonEl.addEventListener("click", () => {
            if (this.inputEl?.disabled) return;
            this.inputEl?.click();
        });

        this.inputEl.addEventListener("change", () => {
            this.updateFileName();
            this.dispatchEvent(new Event("change", { bubbles: true }));
        });

        this.updateFileName();
    }
}
