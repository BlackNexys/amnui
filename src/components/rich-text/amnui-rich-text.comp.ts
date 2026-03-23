import {
    applyRichTextCommand,
    applyRichTextLink,
    getRichTextLinkHref,
    getRichTextSelectionState,
    insertRichTextHtml,
    isRichTextBlank,
    parseRichTextActions,
    plainTextToRichText,
    removeRichTextLink,
    sanitizeRichText,
    type RichTextAction,
    type RichTextBlockFormat,
    type RichTextSelectionState
} from "./rich-text.utils";

type RichTextToolbarMode = "visible" | "hidden";

interface RichTextProps {
    id: string;
    name: string;
    value: string;
    label: string;
    description: string;
    placeholder: string;
    disabled: boolean;
    readonly: boolean;
    toolbar: RichTextToolbarMode;
    actions: RichTextAction[];
}

const BLOCK_FORMAT_ACTIONS: RichTextBlockFormat[] = ["paragraph", "heading-2", "heading-3", "quote"];
const BUTTON_ACTIONS: RichTextAction[] = [
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "unordered-list",
    "ordered-list",
    "clear"
];

export default class AmnuiRichText extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLStyleElement;
    static styleText = "";
    static styleOverrideText = "";

    private editorEl?: HTMLDivElement;
    private toolbarEl?: HTMLDivElement;
    private labelEl?: HTMLLabelElement;
    private formatSelectEl?: HTMLSelectElement;
    private linkToggleButtonEl?: HTMLButtonElement;
    private linkRowEl?: HTMLDivElement;
    private linkInputEl?: HTMLInputElement;
    private savedSelection: Range | null = null;
    private isSyncingValue = false;
    private lastCommittedValue = "";
    private linkControlsVisible = false;
    private readonly selectionChangeHandler = () => {
        this.captureSelection();
        this.updateToolbarState();
    };

    static get observedAttributes() {
        return ["id", "name", "value", "label", "description", "placeholder", "disabled", "readonly", "toolbar", "actions"];
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    static async initStyles() {
        if (this.styleText) return;
        const mod = (await import("../../styles/components/amnui-rich-text.css?inline")) as any;
        this.styleText = String(mod?.default ?? "");
    }

    connectedCallback() {
        document.addEventListener("selectionchange", this.selectionChangeHandler);
        this.render();
    }

    disconnectedCallback() {
        document.removeEventListener("selectionchange", this.selectionChangeHandler);
    }

    get value() {
        return this.getAttribute("value") || "";
    }

    set value(nextValue: string) {
        this.setAttribute("value", nextValue);
    }

    focus(options?: FocusOptions) {
        this.editorEl?.focus(options);
    }

    blur() {
        this.editorEl?.blur();
    }

    get props(): RichTextProps {
        const toolbarAttr = this.getAttribute("toolbar")?.trim().toLowerCase();

        return {
            id: this.getAttribute("id") || "",
            name: this.getAttribute("name") || "",
            value: sanitizeRichText(this.getAttribute("value") || ""),
            label: this.getAttribute("label") || "",
            description: this.getAttribute("description") || "",
            placeholder: this.getAttribute("placeholder") || "",
            disabled: this.hasAttribute("disabled"),
            readonly: this.hasAttribute("readonly"),
            toolbar: toolbarAttr === "hidden" ? "hidden" : "visible",
            actions: parseRichTextActions(this.getAttribute("actions"))
        };
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (name === "value") {
            if (this.isSyncingValue) {
                return;
            }

            if (this.editorEl) {
                this.setEditorHtml(sanitizeRichText(newValue || ""));
                this.lastCommittedValue = this.value;
                return;
            }
        }

        this.render();
    }

    private render() {
        const props = this.props;
        const editorId = props.id ? `${props.id}-editor` : "amnui-rich-text-editor";
        const descriptionId = props.id ? `${props.id}-description` : "";
        const toolbarVisible = props.toolbar === "visible" && !props.readonly && !props.disabled;
        const actionSet = new Set(props.actions);
        const showFormatControl = BLOCK_FORMAT_ACTIONS.some((action) => actionSet.has(action));
        const buttonActions = BUTTON_ACTIONS.filter((action) => actionSet.has(action));
        const showLinkControls = actionSet.has("link") || actionSet.has("unlink");

        this.style.pointerEvents = props.disabled ? "none" : "auto";

        if (!AmnuiRichText.styleText) {
            void AmnuiRichText.initStyles().then(() => this.render());
        }

        this.shadow.innerHTML = `
            <div class="root ${props.readonly ? "is-readonly" : ""}">
                ${props.label ? `<label class="label" for="${escapeAttribute(editorId)}">${escapeHtml(props.label)}</label>` : ""}
                ${
                    toolbarVisible
                        ? renderToolbar({
                              showFormatControl,
                              buttonActions,
                              showLinkControls,
                              linkControlsVisible: this.linkControlsVisible,
                              canRemoveLink: actionSet.has("unlink")
                          })
                        : ""
                }
                <div class="container ${props.label ? "w-label" : ""}">
                    <div
                        ref="editorEl"
                        id="${escapeAttribute(editorId)}"
                        class="editor"
                        contenteditable="${props.readonly || props.disabled ? "false" : "true"}"
                        role="textbox"
                        aria-multiline="true"
                        spellcheck="true"
                        ${descriptionId ? `aria-describedby="${escapeAttribute(descriptionId)}"` : ""}
                        aria-disabled="${String(props.disabled)}"
                        aria-readonly="${String(props.readonly)}"
                        data-placeholder="${escapeAttribute(props.placeholder)}"
                    >${props.value}</div>
                </div>
                ${props.description ? `<p id="${escapeAttribute(descriptionId)}" class="message">${escapeHtml(props.description)}</p>` : ""}
            </div>
            <style>${AmnuiRichText.styleText}\n${AmnuiRichText.styleOverrideText}</style>
        `;

        this.editorEl = this.shadow.querySelector('[ref="editorEl"]') as HTMLDivElement;
        this.toolbarEl = this.shadow.querySelector(".toolbar") as HTMLDivElement | undefined;
        this.labelEl = this.shadow.querySelector(".label") as HTMLLabelElement | undefined;
        this.formatSelectEl = this.shadow.querySelector('[data-role="format-select"]') as HTMLSelectElement | undefined;
        this.linkToggleButtonEl = this.shadow.querySelector('[data-action="toggle-link-menu"]') as HTMLButtonElement | undefined;
        this.linkRowEl = this.shadow.querySelector(".link-row") as HTMLDivElement | undefined;
        this.linkInputEl = this.shadow.querySelector('[data-role="link-input"]') as HTMLInputElement | undefined;
        this.styleSheet = this.shadow.querySelector("style")!;
        this.lastCommittedValue = props.value;

        this.labelEl?.addEventListener("click", (event) => {
            event.preventDefault();
            this.focus();
        });

        this.editorEl.addEventListener("focus", () => {
            this.captureSelection();
            this.updateToolbarState();
        });

        this.editorEl.addEventListener("mouseup", () => {
            this.captureSelection();
            this.updateToolbarState();
        });

        this.editorEl.addEventListener("keyup", () => {
            this.captureSelection();
            this.updateToolbarState();
        });

        this.editorEl.addEventListener("input", () => {
            this.syncValueFromEditor({ sanitize: false, emitInput: true });
            this.captureSelection();
            this.updateToolbarState();
        });

        this.editorEl.addEventListener("blur", () => {
            this.syncValueFromEditor({ sanitize: true, emitChange: true });
            this.updateToolbarState();
        });

        this.editorEl.addEventListener("keydown", (event) => {
            this.handleEditorKeydown(event);
        });

        this.editorEl.addEventListener("paste", (event) => {
            this.handlePaste(event);
        });

        this.toolbarEl?.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
            button.addEventListener("mousedown", (event) => {
                event.preventDefault();
            });

            button.addEventListener("click", (event) => {
                event.preventDefault();
                this.handleToolbarAction(button.dataset.action || "");
            });
        });

        this.formatSelectEl?.addEventListener("change", () => {
            this.restoreSelection();
            this.applyAction(this.formatSelectEl?.value as RichTextAction);
        });

        this.linkInputEl?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.applyLinkFromInput();
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                this.setLinkControlsVisible(false);
                this.focus();
            }
        });

        this.syncEmptyState();
        this.updateToolbarState();
        this.syncLinkControls();
    }

    private handleEditorKeydown(event: KeyboardEvent) {
        if (!this.editorEl || this.hasAttribute("readonly") || this.hasAttribute("disabled")) {
            return;
        }

        if (!(event.metaKey || event.ctrlKey) || event.altKey) {
            return;
        }

        let action: RichTextAction | null = null;

        switch (event.key.toLowerCase()) {
            case "b":
                action = "bold";
                break;
            case "i":
                action = "italic";
                break;
            case "u":
                action = "underline";
                break;
            case "k":
                this.captureSelection();
                this.openLinkControls();
                event.preventDefault();
                return;
            default:
                break;
        }

        if (!action) {
            return;
        }

        event.preventDefault();
        this.applyAction(action);
    }

    private handlePaste(event: ClipboardEvent) {
        if (!this.editorEl || this.hasAttribute("readonly") || this.hasAttribute("disabled")) {
            return;
        }

        event.preventDefault();

        const clipboard = event.clipboardData;
        const html = clipboard?.getData("text/html") || "";
        const text = clipboard?.getData("text/plain") || "";
        const markup = html ? sanitizeRichText(html) : plainTextToRichText(text);

        if (!markup) {
            return;
        }

        this.restoreSelection();
        if (!this.editorEl) {
            return;
        }

        const pasted = insertRichTextHtml(this.editorEl, markup);
        if (!pasted) {
            return;
        }

        this.syncValueFromEditor({ sanitize: true, emitInput: true });
        this.captureSelection();
        this.updateToolbarState();
    }

    private handleToolbarAction(action: string) {
        switch (action) {
            case "toggle-link-menu":
                this.captureSelection();
                this.setLinkControlsVisible(!this.linkControlsVisible);
                if (this.linkControlsVisible) {
                    this.linkInputEl?.focus();
                    this.linkInputEl?.select();
                } else {
                    this.focus();
                }
                return;
            case "apply-link":
                this.applyLinkFromInput();
                return;
            case "remove-link":
                this.removeLink();
                return;
            case "close-link-menu":
                this.setLinkControlsVisible(false);
                this.focus();
                return;
            default:
                this.applyAction(action as RichTextAction);
                return;
        }
    }

    private applyAction(action: RichTextAction) {
        if (!this.editorEl || this.hasAttribute("readonly") || this.hasAttribute("disabled")) {
            return;
        }

        this.restoreSelection();

        const applied = applyRichTextCommand(this.editorEl, action);
        if (!applied) {
            this.updateToolbarState();
            return;
        }

        this.syncValueFromEditor({ sanitize: true, emitInput: true });
        this.captureSelection();
        this.updateToolbarState();
        this.focus();
    }

    private applyLinkFromInput() {
        if (!this.editorEl || !this.linkInputEl) {
            return;
        }

        this.restoreSelection();

        const applied = applyRichTextLink(this.editorEl, this.linkInputEl.value.trim());
        if (!applied) {
            this.linkInputEl.focus();
            return;
        }

        this.syncValueFromEditor({ sanitize: true, emitInput: true });
        this.captureSelection();
        this.updateToolbarState();
        this.setLinkControlsVisible(false);
        this.focus();
    }

    private removeLink() {
        if (!this.editorEl) {
            return;
        }

        this.restoreSelection();

        const removed = removeRichTextLink(this.editorEl);
        if (!removed) {
            this.updateToolbarState();
            return;
        }

        this.syncValueFromEditor({ sanitize: true, emitInput: true });
        this.captureSelection();
        this.updateToolbarState();
        this.setLinkControlsVisible(false);
        this.focus();
    }

    private syncValueFromEditor(options: { sanitize: boolean; emitInput?: boolean; emitChange?: boolean }) {
        if (!this.editorEl) {
            return;
        }

        const rawValue = this.editorEl.innerHTML;
        let nextValue = options.sanitize ? sanitizeRichText(rawValue) : rawValue;

        if (isRichTextBlank(nextValue)) {
            nextValue = "";
        }

        if (options.sanitize && this.editorEl.innerHTML !== nextValue) {
            this.editorEl.innerHTML = nextValue;
        }

        this.isSyncingValue = true;
        this.setAttribute("value", nextValue);
        this.isSyncingValue = false;

        this.syncEmptyState();

        if (options.emitInput) {
            this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        }

        if (options.emitChange && nextValue !== this.lastCommittedValue) {
            this.lastCommittedValue = nextValue;
            this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
        }
    }

    private setEditorHtml(value: string) {
        if (!this.editorEl) {
            return;
        }

        const nextValue = isRichTextBlank(value) ? "" : value;
        if (this.editorEl.innerHTML !== nextValue) {
            this.editorEl.innerHTML = nextValue;
        }

        this.syncEmptyState();
        this.updateToolbarState();
        this.syncLinkControls();
    }

    private syncEmptyState() {
        if (!this.editorEl) {
            return;
        }

        this.editorEl.classList.toggle("is-empty", isRichTextBlank(this.editorEl.innerHTML));
    }

    private updateToolbarState() {
        if (!this.toolbarEl || !this.editorEl) {
            return;
        }

        const selectionState = getRichTextSelectionState(this.editorEl);

        this.toolbarEl.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
            const action = button.dataset.command as RichTextAction | undefined;
            const active = action ? isToolbarActionActive(action, selectionState) : false;
            button.setAttribute("aria-pressed", String(active));
        });

        if (this.formatSelectEl) {
            this.formatSelectEl.value = selectionState.block;
        }

        this.syncLinkControls(selectionState);
    }

    private syncLinkControls(selectionState?: RichTextSelectionState) {
        if (!this.linkToggleButtonEl || !this.linkRowEl || !this.linkInputEl || !this.editorEl) {
            return;
        }

        const state = selectionState ?? getRichTextSelectionState(this.editorEl);
        const currentHref = getRichTextLinkHref(this.editorEl);

        this.linkToggleButtonEl.setAttribute("aria-expanded", String(this.linkControlsVisible));
        this.linkToggleButtonEl.setAttribute("aria-pressed", String(state.link || this.linkControlsVisible));
        this.linkRowEl.hidden = !this.linkControlsVisible;
        this.linkRowEl.classList.toggle("is-open", this.linkControlsVisible);

        if (!this.linkControlsVisible) {
            this.linkInputEl.value = currentHref || "https://";
        } else if (!this.linkInputEl.value.trim()) {
            this.linkInputEl.value = currentHref || "https://";
        }

        const removeButton = this.linkRowEl.querySelector('[data-action="remove-link"]') as HTMLButtonElement | null;
        if (removeButton) {
            removeButton.disabled = !state.link && !currentHref;
        }
    }

    private setLinkControlsVisible(visible: boolean) {
        this.linkControlsVisible = visible;
        this.syncLinkControls();
    }

    private openLinkControls() {
        this.setLinkControlsVisible(true);
        this.linkInputEl?.focus();
        this.linkInputEl?.select();
    }

    private captureSelection() {
        if (!this.editorEl) {
            return;
        }

        const selection = document.getSelection();
        if (!selection?.rangeCount || !selection.anchorNode || !this.editorEl.contains(selection.anchorNode)) {
            return;
        }

        this.savedSelection = selection.getRangeAt(0).cloneRange();
    }

    private restoreSelection() {
        if (!this.editorEl || !this.savedSelection) {
            this.focus();
            return;
        }

        const selection = document.getSelection();
        if (!selection) {
            this.focus();
            return;
        }

        this.focus();
        selection.removeAllRanges();
        selection.addRange(this.savedSelection);
    }
}

function renderToolbar(args: {
    showFormatControl: boolean;
    buttonActions: RichTextAction[];
    showLinkControls: boolean;
    linkControlsVisible: boolean;
    canRemoveLink: boolean;
}) {
    return `
        <div class="toolbar">
            <div class="toolbar-main">
                ${
                    args.showFormatControl
                        ? `
                            <label class="toolbar-field">
                                <select class="format-select" data-role="format-select" aria-label="Text format">
                                    ${BLOCK_FORMAT_ACTIONS.map((format) => renderFormatOption(format)).join("")}
                                </select>
                            </label>
                        `
                        : ""
                }
                <div class="toolbar-actions">
                    ${args.buttonActions.map((action) => renderToolbarButton(action)).join("")}
                    ${
                        args.showLinkControls
                            ? `
                                <button
                                    type="button"
                                    class="tool"
                                    data-action="toggle-link-menu"
                                    aria-label="Manage link"
                                    aria-pressed="false"
                                    aria-expanded="${String(args.linkControlsVisible)}"
                                    title="Manage link"
                                >
                                    <span class="tool-label">Link</span>
                                </button>
                            `
                            : ""
                    }
                </div>
            </div>
            ${
                args.showLinkControls
                    ? `
                        <div class="link-row ${args.linkControlsVisible ? "is-open" : ""}" ${args.linkControlsVisible ? "" : "hidden"}>
                            <input
                                class="link-input"
                                data-role="link-input"
                                type="url"
                                inputmode="url"
                                placeholder="https://example.com"
                                autocomplete="off"
                            />
                            <button type="button" class="link-action primary" data-action="apply-link">Apply</button>
                            ${
                                args.canRemoveLink
                                    ? `<button type="button" class="link-action secondary" data-action="remove-link">Remove</button>`
                                    : ""
                            }
                            <button type="button" class="link-action ghost" data-action="close-link-menu">Done</button>
                        </div>
                    `
                    : ""
            }
        </div>
    `;
}

function renderFormatOption(format: RichTextBlockFormat) {
    return `<option value="${format}">${FORMAT_LABELS[format]}</option>`;
}

function renderToolbarButton(action: RichTextAction) {
    const meta = ACTION_META[action];
    return `
        <button
            type="button"
            class="tool"
            data-action="${action}"
            data-command="${action}"
            aria-pressed="false"
            aria-label="${meta.ariaLabel}"
            title="${meta.title}"
        >
            <span class="tool-label">${meta.label}</span>
        </button>
    `;
}

function isToolbarActionActive(action: RichTextAction, selectionState: RichTextSelectionState) {
    switch (action) {
        case "bold":
            return selectionState.bold;
        case "italic":
            return selectionState.italic;
        case "underline":
            return selectionState.underline;
        case "strikethrough":
            return selectionState.strikethrough;
        case "unordered-list":
            return selectionState.unorderedList;
        case "ordered-list":
            return selectionState.orderedList;
        default:
            return false;
    }
}

const ACTION_META: Record<RichTextAction, { label: string; ariaLabel: string; title: string }> = {
    bold: {
        label: "B",
        ariaLabel: "Bold",
        title: "Bold (Ctrl+B)"
    },
    italic: {
        label: "I",
        ariaLabel: "Italic",
        title: "Italic (Ctrl+I)"
    },
    underline: {
        label: "U",
        ariaLabel: "Underline",
        title: "Underline (Ctrl+U)"
    },
    strikethrough: {
        label: "S",
        ariaLabel: "Strikethrough",
        title: "Strikethrough"
    },
    "unordered-list": {
        label: "Bullets",
        ariaLabel: "Bulleted list",
        title: "Bulleted list"
    },
    "ordered-list": {
        label: "Numbers",
        ariaLabel: "Numbered list",
        title: "Numbered list"
    },
    quote: {
        label: "Quote",
        ariaLabel: "Quote",
        title: "Quote"
    },
    paragraph: {
        label: "Text",
        ariaLabel: "Paragraph",
        title: "Paragraph"
    },
    "heading-2": {
        label: "H2",
        ariaLabel: "Heading 2",
        title: "Heading 2"
    },
    "heading-3": {
        label: "H3",
        ariaLabel: "Heading 3",
        title: "Heading 3"
    },
    link: {
        label: "Link",
        ariaLabel: "Manage link",
        title: "Manage link (Ctrl+K)"
    },
    unlink: {
        label: "Remove link",
        ariaLabel: "Remove link",
        title: "Remove link"
    },
    clear: {
        label: "Clear",
        ariaLabel: "Clear formatting",
        title: "Clear formatting"
    }
};

const FORMAT_LABELS: Record<RichTextBlockFormat, string> = {
    paragraph: "Paragraph",
    "heading-2": "Heading 2",
    "heading-3": "Heading 3",
    quote: "Quote"
};

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
    return escapeHtml(value);
}
