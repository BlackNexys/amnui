export default class AmnuiInput extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLLinkElement;
    rootElement?: HTMLDivElement;
    static styleSrc = new URL("/src/styles/components/amnui-input.scss", import.meta.url).href;

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

    connectedCallback() {
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

    attributeChangedCallback() {
        this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";
    }

    noErrorClasses = "'text-gray-900 ring-gray-300 placeholder:text-gray-400 focus:ring-primary-300': !props.errorMsg"
    errorClasses="text-danger-900 ring-danger-300 placeholder:text-danger-300 focus:ring-danger-500 pr-10"
    disabled="props.disabled ? 'pointer-events-none' : 'pointer-events-auto'"

    render() {
        const props = this.props;
        this.style.pointerEvents = this.hasAttribute("disabled") ? "none" : "auto";
        this.shadow.innerHTML = `
            <div class="root">
                ${props.label ? `<label for="${props.id}" class="label">${props.label}</label>` : ""}
                <div class="container ${props.label ? "w-label" : ""}">
                    <input
                        ref="inputEl"
                        id="${props.id}" 
                        value="${props.value}" 
                        type="${props.type}" 
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
                    ${props.type == "password" ? `<button type="button" tabindex="-1" class="group absolute right-0 top-0 bottom-0 flex justify-center items-center px-1 border-0 outline-0 shadow-none hover:shadow-none " @click="toggleDisplayPassword">
                            <component is="currentType == 'password' ? 'w-icon-invisible' : 'w-icon-visible' " class="group-hover:scale-125 transition-transform" />
                        </button>` : ""
                    }
                </div>
                ${props.errorMsg ? `<p id="${props.id}-error" class="message error">${props.errorMsg}</p>` : ""}
                ${!props.errorMsg && props.description ? `<p id="${props.id}-description" class="message">${props.description}</p>` : ""}
                <slot></slot>
            </div>
            <link rel="stylesheet" href="${AmnuiInput.styleSrc}" />
        `;
        this.rootElement = this.shadow.querySelector('[ref="inputEl"]')!;
        this.styleSheet = this.shadow.querySelector("link")!;
    }
}
