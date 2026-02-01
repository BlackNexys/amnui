export default class AmnuiInput extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLStyleElement;
    rootElement?: HTMLDivElement;
    static styleText = "";

    private currentType: string | null = null;

    static get observedAttributes() {
        return [
            "id",
            "value",
            "type",
            "name",
            "description",
            "disabled",
            "required",
            "errorMsg",
            "label",
            "placeholder",
            "min",
            "max",
            "maxLength",
            "minLength",
            "step",
            "pattern",
            "autocomplete"
        ];
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    static async initStyles() {
        if (this.styleText) return;
        const mod = (await import("../../styles/components/amnui-input.scss?inline")) as any;
        this.styleText = String(mod?.default ?? "");
    }

    connectedCallback() {
        this.currentType = this.props.type;
        this.render();
    }

    get props() {
        return {
            id: this.getAttribute("id") || "",
            value: this.getAttribute("value") || "",
            type: this.getAttribute("type") || "text",
            name: this.getAttribute("name") || "",
            disabled: this.hasAttribute("disabled"),
            required: this.hasAttribute("required"),
            readonly: this.hasAttribute("readonly"),
            errorMsg: this.getAttribute("error-msg") || "",
            label: this.getAttribute("label") || "",
            placeholder: this.getAttribute("placeholder") || "",
            min: this.getAttribute("min") || "",
            max: this.getAttribute("max") || "",
            maxLength: this.getAttribute("max-length") || "",
            minLength: this.getAttribute("min-length") || "",
            step: this.getAttribute("step") || "",
            pattern: this.getAttribute("pattern") || "",
            autocomplete: this.getAttribute("autocomplete") || "off",
            description: this.getAttribute("description") || ""
        };
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        const inputEl = this.shadow.querySelector('[ref="inputEl"]') as HTMLInputElement | null;

        if (name === "value" && inputEl) {
            inputEl.value = newValue ?? "";
            return;
        }

        if (name === "disabled" && inputEl) {
            inputEl.disabled = this.hasAttribute("disabled");
            this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";
            return;
        }

        if (name === "type") {
            this.currentType = newValue || "text";
        }

        this.render();
    }

    render() {
        const props = this.props;
        this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";
        if (!AmnuiInput.styleText) {
            void AmnuiInput.initStyles().then(() => this.render());
        }

        const baseType = props.type || "text";
        if (!this.currentType || this.currentType !== baseType) {
            // Reset when type attribute changes from outside.
            this.currentType = baseType;
        }

        const effectiveType = baseType === "password" ? this.currentType : baseType;

        this.shadow.innerHTML = `
            <div class="root">
                ${props.label ? `<label for="${props.id}" class="label">${props.label}</label>` : ""}
                <div class="container ${props.label ? "w-label" : ""}">
                    <input
                        ref="inputEl"
                        id="${props.id}" 
                        value="${props.value}" 
                        type="${effectiveType}" 
                        name="${props.name}"
                        ${props.disabled ? "disabled" : ""}
                        ${props.required ? "required" : ""}
                        ${props.readonly ? "readonly" : ""}
                        class="input ${props.errorMsg ? "error" : ""}"
                        placeholder="${props.placeholder}"
                        min="${props.min}"
                        max="${props.max}"
                        maxLength="${props.maxLength}"
                        minLength="${props.minLength}"
                        step="${props.step}"
                        pattern="${props.pattern}"
                        autocomplete="${props.autocomplete}"
                        aria-required="${props.required}"
                        aria-invalid="${Boolean(props.errorMsg)}" 
                        aria-describedby="${props.errorMsg ? `${props.id}-error` : `${props.id}-description`}"
                    >
                    ${props.required ? `<svg class="input-aside required" viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em" aria-hidden="true">
                            <polygon points="20.79,9.23 18.79,5.77 14,8.54 14,3 10,3 10,8.54 5.21,5.77 3.21,9.23 8,12 3.21,14.77 5.21,18.23 10,15.46 10,21 14,21 14,15.46 18.79,18.23 20.79,14.77 16,12"/>
                        </svg>`
                        : ""
                    }
                    ${props.errorMsg ? `<svg class="input-aside error" viewBox="0 0 20 20" fill="currentColor" height="1em" width="1em" aria-hidden="true">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                        </svg>`: ""
                    }
                    ${baseType === "password" ? `<button type="button" class="toggle" aria-label="Toggle password visibility">${effectiveType === "password" ? "Show" : "Hide"}</button>` : ""}
                </div>
                ${props.errorMsg ? `<p id="${props.id}-error" class="message error">${props.errorMsg}</p>` : ""}
                ${!props.errorMsg && props.description ? `<p id="${props.id}-description" class="message">${props.description}</p>` : ""}
                <slot></slot>
            </div>
            <style>${AmnuiInput.styleText}</style>
        `;

        const inputEl = this.shadow.querySelector('[ref="inputEl"]') as HTMLInputElement;
        this.rootElement = inputEl as any;
        this.styleSheet = this.shadow.querySelector("style")!;

        const toggleBtn = this.shadow.querySelector("button.toggle") as HTMLButtonElement | null;
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                if (baseType !== "password") return;
                this.currentType = this.currentType === "password" ? "text" : "password";
                this.render();
                // keep focus in the input
                (this.shadow.querySelector('[ref="inputEl"]') as HTMLInputElement | null)?.focus();
            });
        }
    }
}
