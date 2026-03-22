const ALLOWED_TAGS = new Set([
    "p",
    "div",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "blockquote",
    "h2",
    "h3",
    "a"
]);

const ALLOWED_LINK_SCHEMES = new Set(["http", "https", "mailto", "tel"]);
const ALLOWED_TARGETS = new Set(["_blank", "_self", "_parent", "_top"]);
const SAFE_REL_TOKENS = new Set(["noopener", "noreferrer", "nofollow", "external", "ugc"]);
const DROP_CONTENT_TAGS = new Set(["script", "style", "iframe", "object", "embed", "template", "textarea", "noscript", "svg", "math"]);
const DEFAULT_LINK_TARGET = "_blank";
const DEFAULT_LINK_REL = "noopener noreferrer";

export type RichTextAction =
    | "bold"
    | "italic"
    | "underline"
    | "strikethrough"
    | "unordered-list"
    | "ordered-list"
    | "quote"
    | "paragraph"
    | "heading-2"
    | "heading-3"
    | "clear"
    | "link"
    | "unlink";

export type RichTextBlockFormat = "paragraph" | "heading-2" | "heading-3" | "quote";

export interface RichTextSelectionState {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    unorderedList: boolean;
    orderedList: boolean;
    link: boolean;
    block: RichTextBlockFormat;
}

export interface ApplyRichTextCommandOptions {
    promptForLink?: (defaultUrl: string) => string | null;
}

export const DEFAULT_RICH_TEXT_ACTIONS: RichTextAction[] = [
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "paragraph",
    "heading-2",
    "heading-3",
    "quote",
    "unordered-list",
    "ordered-list",
    "link",
    "unlink",
    "clear"
];

const ACTION_SET = new Set<RichTextAction>(DEFAULT_RICH_TEXT_ACTIONS);

export function parseRichTextActions(value: string | null | undefined): RichTextAction[] {
    if (!value || !value.trim()) {
        return [...DEFAULT_RICH_TEXT_ACTIONS];
    }

    const actions = value
        .split(",")
        .map((item) => item.trim().toLowerCase() as RichTextAction)
        .filter((item): item is RichTextAction => ACTION_SET.has(item));

    return actions.length > 0 ? Array.from(new Set(actions)) : [...DEFAULT_RICH_TEXT_ACTIONS];
}

export function sanitizeRichText(html: string): string {
    if (!html) return "";

    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, "text/html");
    const output = document.createElement("div");
    appendSanitizedChildren(parsed.body, output);
    return output.innerHTML;
}

export function isRichTextBlank(html: string): boolean {
    if (!html || !html.trim()) return true;

    const sanitized = sanitizeRichText(html);
    if (!sanitized.trim()) return true;

    const probe = document.createElement("div");
    probe.innerHTML = sanitized;
    const text = (probe.textContent ?? "").replace(/[\s\u00A0\u200B-\u200D\uFEFF]/g, "");
    return text.length === 0;
}

export function applyRichTextCommand(
    editor: HTMLElement,
    action: string,
    options?: ApplyRichTextCommandOptions
): boolean {
    if (!editor) return false;

    const normalizedAction = action.trim().toLowerCase();
    focusEditor(editor);

    switch (normalizedAction) {
        case "bold":
            return execCommand("bold");
        case "italic":
            return execCommand("italic");
        case "underline":
            return execCommand("underline");
        case "strikethrough":
            return execCommand("strikeThrough");
        case "unordered-list":
            return execCommand("insertUnorderedList");
        case "ordered-list":
            return execCommand("insertOrderedList");
        case "quote":
            return execCommand("formatBlock", "<blockquote>") || execCommand("formatBlock", "blockquote");
        case "paragraph":
            return execCommand("formatBlock", "<p>") || execCommand("formatBlock", "p") || execCommand("insertParagraph");
        case "heading-2":
            return execCommand("formatBlock", "<h2>") || execCommand("formatBlock", "h2");
        case "heading-3":
            return execCommand("formatBlock", "<h3>") || execCommand("formatBlock", "h3");
        case "clear": {
            const clearedFormatting = execCommand("removeFormat");
            const clearedLink = removeRichTextLink(editor);
            return clearedFormatting || clearedLink;
        }
        case "link":
            return applyLinkCommand(editor, options?.promptForLink);
        case "unlink":
            return removeRichTextLink(editor);
        default:
            return false;
    }
}

export function getRichTextSelectionState(editor: HTMLElement): RichTextSelectionState {
    const fallbackState: RichTextSelectionState = {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        unorderedList: false,
        orderedList: false,
        link: false,
        block: "paragraph"
    };

    if (!isSelectionInside(editor)) {
        return fallbackState;
    }

    return {
        bold: queryCommandState("bold"),
        italic: queryCommandState("italic"),
        underline: queryCommandState("underline"),
        strikethrough: queryCommandState("strikeThrough"),
        unorderedList: queryCommandState("insertUnorderedList"),
        orderedList: queryCommandState("insertOrderedList"),
        link: Boolean(findClosestSelectionElement(editor, "a")),
        block: getCurrentBlockFormat(editor)
    };
}

export function getRichTextLinkHref(editor: HTMLElement): string {
    return findClosestSelectionElement(editor, "a")?.getAttribute("href") || "";
}

export function applyRichTextLink(editor: HTMLElement, href: string): boolean {
    const cleanedHref = sanitizeHref(href);
    if (!cleanedHref) {
        return false;
    }

    const selection = document.getSelection();
    const currentText = selection?.toString().trim() ?? "";

    focusEditor(editor);

    const hasSelection = Boolean(selection && !selection.isCollapsed && currentText);
    const applied = hasSelection
        ? execCommand("createLink", cleanedHref)
        : insertRichTextHtml(
              editor,
              `<a href="${escapeAttribute(cleanedHref)}" target="${DEFAULT_LINK_TARGET}" rel="${DEFAULT_LINK_REL}">${escapeHtml(cleanedHref)}</a>&nbsp;`
          );

    if (!applied) {
        return false;
    }

    const anchor = findClosestSelectionElement(editor, "a");
    if (anchor) {
        anchor.setAttribute("href", cleanedHref);
        anchor.setAttribute("target", DEFAULT_LINK_TARGET);
        anchor.setAttribute("rel", DEFAULT_LINK_REL);
    }

    return true;
}

export function removeRichTextLink(editor: HTMLElement): boolean {
    if (!editor) {
        return false;
    }

    focusEditor(editor);
    return execCommand("unlink");
}

export function insertRichTextHtml(editor: HTMLElement, html: string): boolean {
    if (!editor) return false;

    focusEditor(editor);

    if (execCommand("insertHTML", html)) {
        return true;
    }

    const selection = document.getSelection();
    if (!selection?.rangeCount) {
        return false;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
        return false;
    }

    const template = document.createElement("template");
    template.innerHTML = html;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    range.deleteContents();
    range.insertNode(fragment);
    selection.collapseToEnd();
    return true;
}

export function plainTextToRichText(text: string): string {
    if (!text.trim()) return "";

    return text
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
        .join("");
}

function appendSanitizedChildren(source: ParentNode, target: Node): void {
    for (const child of Array.from(source.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
            target.appendChild(document.createTextNode(child.textContent ?? ""));
            continue;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) {
            continue;
        }

        const element = child as Element;
        const tagName = element.tagName.toLowerCase();

        if (!ALLOWED_TAGS.has(tagName)) {
            if (DROP_CONTENT_TAGS.has(tagName)) {
                continue;
            }

            appendSanitizedChildren(element, target);
            continue;
        }

        if (tagName === "br") {
            target.appendChild(document.createElement("br"));
            continue;
        }

        const safeElement = document.createElement(tagName);

        if (tagName === "a") {
            const href = sanitizeHref(element.getAttribute("href"));
            if (href) {
                safeElement.setAttribute("href", href);
            }

            const targetValue = sanitizeTarget(element.getAttribute("target")) || DEFAULT_LINK_TARGET;
            safeElement.setAttribute("target", targetValue);

            const relValue = sanitizeRel(element.getAttribute("rel"), targetValue);
            if (relValue) {
                safeElement.setAttribute("rel", relValue);
            }
        }

        appendSanitizedChildren(element, safeElement);
        target.appendChild(safeElement);
    }
}

function sanitizeHref(href: string | null): string | null {
    if (!href) return null;

    const cleaned = href.replace(/[\u0000-\u001F\u007F]/g, "").trim();
    if (!cleaned) return null;

    const schemeMatch = cleaned.match(/^([a-z][a-z0-9+.-]*):/i);
    if (!schemeMatch) return null;

    const scheme = schemeMatch[1].toLowerCase();
    if (!ALLOWED_LINK_SCHEMES.has(scheme)) return null;

    return cleaned;
}

function sanitizeTarget(target: string | null): string | null {
    if (!target) return null;

    const cleaned = target.trim().toLowerCase();
    return ALLOWED_TARGETS.has(cleaned) ? cleaned : null;
}

function sanitizeRel(rel: string | null, target: string | null): string | null {
    const tokens = new Set<string>();

    if (rel) {
        for (const token of rel.split(/\s+/)) {
            const cleaned = token.trim().toLowerCase();
            if (cleaned && SAFE_REL_TOKENS.has(cleaned)) {
                tokens.add(cleaned);
            }
        }
    }

    if (target === "_blank") {
        tokens.add("noopener");
        tokens.add("noreferrer");
    }

    return tokens.size > 0 ? Array.from(tokens).join(" ") : DEFAULT_LINK_REL;
}

function focusEditor(editor: HTMLElement): void {
    if (document.activeElement !== editor) {
        editor.focus({ preventScroll: true });
    }
}

function execCommand(command: string, value?: string): boolean {
    if (typeof document.execCommand !== "function") {
        return false;
    }

    try {
        return document.execCommand(command, false, value);
    } catch {
        return false;
    }
}

function queryCommandState(command: string): boolean {
    if (typeof document.queryCommandState !== "function") {
        return false;
    }

    try {
        return document.queryCommandState(command);
    } catch {
        return false;
    }
}

function applyLinkCommand(
    editor: HTMLElement,
    promptForLink?: (defaultUrl: string) => string | null
): boolean {
    const selection = document.getSelection();
    const currentText = selection?.toString().trim() ?? "";
    const defaultUrl = currentText.startsWith("http") ? currentText : "https://";
    const enteredUrl = promptForLink ? promptForLink(defaultUrl) : window.prompt("Enter a link URL", defaultUrl);
    if (!enteredUrl) return false;
    return applyRichTextLink(editor, enteredUrl);
}

function isSelectionInside(editor: HTMLElement): boolean {
    const selection = document.getSelection();
    if (!selection?.anchorNode) {
        return false;
    }

    return editor.contains(selection.anchorNode);
}

function findClosestSelectionElement(editor: HTMLElement, selector: string): HTMLElement | null {
    const selection = document.getSelection();
    const anchorNode = selection?.anchorNode;
    if (!anchorNode || !editor.contains(anchorNode)) {
        return null;
    }

    const startElement = anchorNode.nodeType === Node.ELEMENT_NODE
        ? (anchorNode as HTMLElement)
        : anchorNode.parentElement;

    if (!startElement) {
        return null;
    }

    const match = startElement.closest(selector);
    return match instanceof HTMLElement && editor.contains(match) ? match : null;
}

function getCurrentBlockFormat(editor: HTMLElement): RichTextBlockFormat {
    if (findClosestSelectionElement(editor, "blockquote")) {
        return "quote";
    }

    if (findClosestSelectionElement(editor, "h2")) {
        return "heading-2";
    }

    if (findClosestSelectionElement(editor, "h3")) {
        return "heading-3";
    }

    return "paragraph";
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
    return escapeHtml(value);
}
