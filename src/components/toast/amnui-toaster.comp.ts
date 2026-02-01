import { AMNUI_TOAST_CHANGE_EVENT, amnuiToastEvents, dismiss, getAll, type AmnuiToast } from "../../services/toast.service";

export default class AmnuiToaster extends HTMLElement {
    shadow: ShadowRoot;
    styleSheet?: HTMLStyleElement;
    static styleText = "";

    private unsubscribe?: () => void;
    private toasts: AmnuiToast[] = [];
    private rootEl?: HTMLDivElement;
    private elById = new Map<string, HTMLElement>();

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    static async initStyles() {
        if (this.styleText) return;
        const mod = (await import("../../styles/components/amnui-toaster.scss?inline")) as any;
        this.styleText = String(mod?.default ?? "");
    }

    connectedCallback() {
        if (!AmnuiToaster.styleText) {
            void AmnuiToaster.initStyles().then(() => this.render());
        }

        const handler = (e: Event) => {
            const ce = e as CustomEvent<AmnuiToast[]>;
            this.toasts = Array.isArray(ce.detail) ? ce.detail : getAll();
            this.render();
        };

        amnuiToastEvents.addEventListener(AMNUI_TOAST_CHANGE_EVENT, handler as EventListener);
        this.unsubscribe = () => {
            amnuiToastEvents.removeEventListener(AMNUI_TOAST_CHANGE_EVENT, handler as EventListener);
        };

        this.toasts = getAll();
        this.render();
    }

    disconnectedCallback() {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }

    render() {
        if (!this.rootEl) {
            this.shadow.innerHTML = `
                <div class="root" role="status" aria-live="polite" aria-relevant="additions text"></div>
                <style>${AmnuiToaster.styleText}</style>
            `;
            this.rootEl = this.shadow.querySelector(".root") as HTMLDivElement;
            this.styleSheet = this.shadow.querySelector("style")!;
        } else {
            // keep stylesheet up to date (first render may have been before initStyles completed)
            const style = this.shadow.querySelector("style");
            if (style) style.textContent = AmnuiToaster.styleText;
        }

        const nextIds = new Set(this.toasts.map((t) => t.id));

        // remove stale
        for (const [id, el] of this.elById.entries()) {
            if (!nextIds.has(id)) {
                el.remove();
                this.elById.delete(id);
            }
        }

        // upsert in order (newest first)
        for (const t of this.toasts) {
            const existing = this.elById.get(t.id);
            if (existing) {
                this.updateToastEl(existing, t);
                if (this.rootEl.firstChild !== existing) {
                    this.rootEl.insertBefore(existing, this.rootEl.firstChild);
                }
                continue;
            }

            const el = this.createToastEl(t);
            this.elById.set(t.id, el);
            this.rootEl.insertBefore(el, this.rootEl.firstChild);
        }
    }

    private createToastEl(t: AmnuiToast) {
        const el = document.createElement("div");
        el.className = `toastWrap ${t.type}`;
        el.dataset.id = t.id;

        const btn = document.createElement("amnui-button") as HTMLElement;
        btn.className = "toastBtn";
        btn.setAttribute("variant", "toast");
        btn.setAttribute("theme", mapToastTypeToTheme(t.type));
        if (!t.dismissible) btn.setAttribute("aria-disabled", "true");

        btn.onclick = t.dismissible ? () => dismiss(t.id) : null;

        const content = document.createElement("div");
        content.className = "toastContent";

        const message = document.createElement("span");
        message.className = "toastMessage";
        message.textContent = t.message;

        content.appendChild(message);

        btn.appendChild(content);
        el.appendChild(btn);

        return el;
    }

    private updateToastEl(el: HTMLElement, t: AmnuiToast) {
        el.className = `toastWrap ${t.type}`;

        const btn = el.querySelector("amnui-button") as HTMLElement | null;
        if (btn) {
            btn.setAttribute("variant", "toast");
            btn.setAttribute("theme", mapToastTypeToTheme(t.type));
            btn.onclick = t.dismissible ? () => dismiss(t.id) : null;
        }

        const msg = el.querySelector(".toastMessage") as HTMLSpanElement | null;
        if (msg && msg.textContent !== t.message) msg.textContent = t.message;
    }
}

function mapToastTypeToTheme(t: AmnuiToast["type"]) {
    // align with existing AMNUI theme tokens
    if (t === "danger") return "danger";
    if (t === "warning") return "warning";
    if (t === "success") return "success";
    if (t === "info") return "info";
    if (t === "loading") return "secondary";
    return "secondary";
}
