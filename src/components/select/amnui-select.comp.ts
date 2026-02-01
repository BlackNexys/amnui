export default class AmnuiSelect extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLStyleElement;
    selectEl?: HTMLSelectElement;
    static styleText = "";

    private observer?: MutationObserver;

    static get observedAttributes() {
        return ["id", "value", "name", "description", "disabled", "required", "error-msg", "label"]; // keep kebab-case for error-msg
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    static async initStyles() {
        if (this.styleText) return;
        const mod = (await import("../../styles/components/amnui-select.scss?inline")) as any;
        this.styleText = String(mod?.default ?? "");
    }

    connectedCallback() {
        this.observer = new MutationObserver(() => this.render());
        this.observer.observe(this, { childList: true, subtree: true, characterData: true });
        this.render();
    }

    disconnectedCallback() {
        this.observer?.disconnect();
        this.observer = undefined;
    }

    get props() {
        return {
            id: this.getAttribute("id") || "",
            value: this.getAttribute("value") || "",
            name: this.getAttribute("name") || "",
            disabled: this.hasAttribute("disabled"),
            required: this.hasAttribute("required"),
            errorMsg: this.getAttribute("error-msg") || "",
            label: this.getAttribute("label") || "",
            description: this.getAttribute("description") || ""
        };
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (name === "value" && this.selectEl) {
            this.selectEl.value = newValue ?? "";
            return;
        }

        if (name === "disabled" && this.selectEl) {
            this.selectEl.disabled = this.hasAttribute("disabled");
            return;
        }

        this.render();
    }

    refresh() {
        this.render();
    }

    private cloneOptionsInto(select: HTMLSelectElement) {
        const options = Array.from(this.querySelectorAll("option"));
        select.innerHTML = "";
        for (const opt of options) {
            select.appendChild(opt.cloneNode(true));
        }
    }

    render() {
        const props = this.props;
        this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";

        if (!AmnuiSelect.styleText) {
            void AmnuiSelect.initStyles().then(() => this.render());
        }

        this.shadow.innerHTML = `
            <div class="root">
                ${props.label ? `<label for="${props.id}" class="label">${props.label}</label>` : ""}
                <div class="container ${props.label ? "w-label" : ""}">
                    <select
                        ref="selectEl"
                        id="${props.id}"
                        name="${props.name}"
                        ${props.disabled ? "disabled" : ""}
                        ${props.required ? "required" : ""}
                        class="select ${props.errorMsg ? "error" : ""}"
                        aria-required="${props.required}"
                        aria-invalid="${Boolean(props.errorMsg)}"
                        aria-describedby="${props.errorMsg ? `${props.id}-error` : `${props.id}-description`}"
                    ></select>
                    ${props.required ? `<svg class="aside required" viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em" aria-hidden="true">
                        <polygon points="20.79,9.23 18.79,5.77 14,8.54 14,3 10,3 10,8.54 5.21,5.77 3.21,9.23 8,12 3.21,14.77 5.21,18.23 10,15.46 10,21 14,21 14,15.46 18.79,18.23 20.79,14.77 16,12"/>
                    </svg>` : ""}
                    ${props.errorMsg ? `<svg class="aside error" viewBox="0 0 20 20" fill="currentColor" height="1em" width="1em" aria-hidden="true">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>` : ""}
                </div>
                ${props.errorMsg ? `<p id="${props.id}-error" class="message error">${props.errorMsg}</p>` : ""}
                ${!props.errorMsg && props.description ? `<p id="${props.id}-description" class="message">${props.description}</p>` : ""}
            </div>
            <style>${AmnuiSelect.styleText}</style>
        `;

        this.selectEl = this.shadow.querySelector('[ref="selectEl"]') as HTMLSelectElement;
        this.styleSheet = this.shadow.querySelector("style")!;

        this.cloneOptionsInto(this.selectEl);

        if (props.value) this.selectEl.value = props.value;

        this.selectEl.addEventListener("change", () => {
            this.setAttribute("value", this.selectEl?.value ?? "");
            this.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }
}
