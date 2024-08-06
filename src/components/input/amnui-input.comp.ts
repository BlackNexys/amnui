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
            errorMsg: this.getAttribute("errorMsg") || "",
            label: this.getAttribute("label") || "",
            placeholder: this.getAttribute("placeholder") || "",
            min: this.getAttribute("min") || "",
            max: this.getAttribute("max") || "",
            maxLength: this.getAttribute("maxLength") || "",
            minLength: this.getAttribute("minLength") || "",
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
                ${props.label ? `<label for="${props.id}" class="block text-sm font-medium leading-6 text-inherit">${props.label}</label>` : ""}
                <div class="relative rounded flex-grow ${props.label ? 'mt-1' : ''}">
                    <input
                        ref="inputEl"
                        id="${props.id}" 
                        value="${props.value}" 
                        type="${props.type}" 
                        name="${props.name}"
                        disabled="${props.disabled}"
                        required="${props.required}"
                        class="block w-full h-full min-h-[2.5rem] !mb-0 shadow shadow-gray-300 rounded border-0 py-1.5 pl-2 ring-1 focus:ring-2 sm:text-sm sm:leading-6 text-ellipsis"
                        placeholder="${props.placeholder}"
                        min="${props.min}"
                        max="${props.max}"
                        maxLength="${props.maxLength}"
                        minLength="${props.minLength}"
                        step="${props.step}"
                        pattern="${props.pattern}"
                        autocomplete="${props.autocomplete}"
                        aria-invalid="${Boolean(props.errorMsg)}" 
                        aria-describedby="${props.errorMsg ? `${props.id}-error` : `${props.id}-description`}"
                    >
                    ${props.required ? `<w-icon-asterisk class="text-danger-900 text-xs absolute top-1 right-1" />` : ""}
                    ${props.errorMsg ? `<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg class="h-5 w-5 text-danger-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                        </svg>
                    </div>` : ""}
                    ${props.type == 'password' ? `<button v-if="props.type == 'password'" type="button" tabindex="-1" class="group absolute right-0 top-0 bottom-0 flex justify-center items-center px-1 border-0 outline-0 shadow-none hover:shadow-none " @click="toggleDisplayPassword">
                        <component is="currentType == 'password' ? 'w-icon-invisible' : 'w-icon-visible' " class="group-hover:scale-125 transition-transform" />
                    </button>` : ""}
                </div>
                ${props.errorMsg ? `<p id="${props.id}-error" class="mt-2 text-sm text-danger-600">${props.errorMsg}</p>` : ""}
                ${!props.errorMsg && props.description ? `<p id="${props.id}-description" class="mt-2 pb-0 text-xs text-gray-500">${props.description}</p>` : ""}
                <slot></slot>
            </div>
            <link rel="stylesheet" href="${AmnuiInput.styleSrc}" />
        `;
        this.rootElement = this.shadow.querySelector('[ref="inputEl"]')!;
        this.styleSheet = this.shadow.querySelector("link")!;
    }
}
