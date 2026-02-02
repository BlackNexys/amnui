export default class AmnuiCheckbox extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLStyleElement;
    inputEl?: HTMLInputElement;
    static styleText = "";

    static get observedAttributes() {
        return ["id", "checked", "name", "value", "description", "disabled", "required", "error-msg", "label"];
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    static async initStyles() {
        if (this.styleText) return;
        const mod = (await import("../../styles/components/amnui-checkbox.scss?inline")) as any;
        this.styleText = String(mod?.default ?? "");
    }

    connectedCallback() {
        this.render();
    }

    get props() {
        return {
            id: this.getAttribute("id") || "",
            name: this.getAttribute("name") || "",
            value: this.getAttribute("value") || "on",
            checked: this.parseBoolAttr("checked"),
            disabled: this.hasAttribute("disabled"),
            required: this.hasAttribute("required"),
            errorMsg: this.getAttribute("error-msg") || "",
            label: this.getAttribute("label") || "",
            description: this.getAttribute("description") || ""
        };
    }

    private parseBoolAttr(name: string) {
        const val = this.getAttribute(name);
        if (val === null) return false;
        if (val === "false" || val === "0") return false;
        return true;
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (name === "disabled" && this.inputEl) {
            this.inputEl.disabled = this.hasAttribute("disabled");
            this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";
            return;
        }

        if (name === "checked" && this.inputEl) {
            this.inputEl.checked = this.parseBoolAttr("checked");
            return;
        }

        this.render();
    }

    render() {
        const props = this.props;
        this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";

        if (!AmnuiCheckbox.styleText) {
            void AmnuiCheckbox.initStyles().then(() => this.render());
        }

        this.shadow.innerHTML = `
            <div class="root">
                <label class="row">
                    <input
                        ref="inputEl"
                        class="checkbox"
                        type="checkbox"
                        id="${props.id}"
                        name="${props.name}"
                        value="${props.value}"
                        ${props.checked ? "checked" : ""}
                        ${props.disabled ? "disabled" : ""}
                        ${props.required ? "required" : ""}
                        aria-required="${props.required}"
                        aria-invalid="${Boolean(props.errorMsg)}"
                        aria-describedby="${props.errorMsg ? `${props.id}-error` : `${props.id}-description`}"
                    />
                    ${props.label ? `<span class="labelText">${props.label}</span>` : ""}
                </label>

                ${props.errorMsg ? `<p id="${props.id}-error" class="message error">${props.errorMsg}</p>` : ""}
                ${!props.errorMsg && props.description ? `<p id="${props.id}-description" class="message">${props.description}</p>` : ""}

                <slot></slot>
            </div>
            <style>${AmnuiCheckbox.styleText}</style>
        `;

        this.inputEl = this.shadow.querySelector('[ref="inputEl"]') as HTMLInputElement;
        this.styleSheet = this.shadow.querySelector("style")!;

        this.inputEl.addEventListener("change", () => {
            if (this.inputEl?.checked) this.setAttribute("checked", "");
            else this.removeAttribute("checked");
            this.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }
}
