export type AmnuiToastType = "info" | "success" | "warning" | "danger" | "loading";

export interface AmnuiToast {
    id: string;
    type: AmnuiToastType;
    message: string;
    createdAt: number;
    updatedAt: number;
    durationMs?: number;
    dismissible: boolean;
}

const MAX_TOASTS = 5;
const DEFAULT_DURATION_MS = 10000;

const toastMap = new Map<string, AmnuiToast>();
let toastOrder: string[] = [];
const toastTimers = new Map<string, number>();

export const amnuiToastEvents = new EventTarget();
export const AMNUI_TOAST_CHANGE_EVENT = "amnui-toast-change";

function now() {
    return Date.now();
}

function makeId() {
    return `t_${now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function clearTimer(id: string) {
    const t = toastTimers.get(id);
    if (t) window.clearTimeout(t);
    toastTimers.delete(id);
}

function scheduleAutoDismiss(id: string, durationMs?: number) {
    clearTimer(id);
    if (!durationMs || durationMs <= 0) return;

    const t = window.setTimeout(() => {
        dismiss(id);
    }, durationMs);

    toastTimers.set(id, t);
}

function normalizeDuration(type: AmnuiToastType, durationMs?: number) {
    if (type === "loading") return undefined;
    return durationMs ?? DEFAULT_DURATION_MS;
}

function emit() {
    amnuiToastEvents.dispatchEvent(
        new CustomEvent(AMNUI_TOAST_CHANGE_EVENT, {
            detail: getAll()
        })
    );
}

function enforceMaxToasts() {
    while (toastOrder.length > MAX_TOASTS) {
        const oldest = toastOrder[0];
        if (!oldest) break;
        dismiss(oldest);
    }
}

export function getAll(): AmnuiToast[] {
    return toastOrder.map((id) => toastMap.get(id)!).filter(Boolean);
}

export function dismiss(id: string) {
    if (!toastMap.has(id)) return;
    toastMap.delete(id);
    toastOrder = toastOrder.filter((x) => x !== id);
    clearTimer(id);
    emit();
}

export function clearAll() {
    for (const id of toastOrder) clearTimer(id);
    toastMap.clear();
    toastOrder = [];
    emit();
}

export interface AmnuiToastCreateOptions {
    id?: string;
    durationMs?: number;
    dismissible?: boolean;
}

export interface AmnuiToastUpdate {
    type?: AmnuiToastType;
    message?: string;
    durationMs?: number;
    dismissible?: boolean;
}

export function show(type: AmnuiToastType, message: string, options?: AmnuiToastCreateOptions): string {
    const id = options?.id ?? makeId();
    const createdAt = toastMap.get(id)?.createdAt ?? now();

    const toast: AmnuiToast = {
        id,
        type,
        message,
        createdAt,
        updatedAt: now(),
        durationMs: normalizeDuration(type, options?.durationMs),
        dismissible: options?.dismissible ?? true
    };

    toastMap.set(id, toast);
    toastOrder = [id, ...toastOrder.filter((x) => x !== id)];

    enforceMaxToasts();

    if (type !== "loading") scheduleAutoDismiss(id, toast.durationMs);

    emit();
    return id;
}

export function update(id: string, patch: AmnuiToastUpdate) {
    const existing = toastMap.get(id);
    if (!existing) return;

    const nextType = patch.type ?? existing.type;
    const nextDurationMs =
        patch.durationMs !== undefined
            ? normalizeDuration(nextType, patch.durationMs)
            : existing.durationMs !== undefined
              ? existing.durationMs
              : normalizeDuration(nextType, undefined);

    const next: AmnuiToast = {
        ...existing,
        ...patch,
        type: nextType,
        durationMs: nextDurationMs,
        updatedAt: now()
    };

    toastMap.set(id, next);

    if (next.type !== "loading") scheduleAutoDismiss(id, next.durationMs);
    else clearTimer(id);

    emit();
}

export const toast = {
    show,
    update,
    dismiss,
    clearAll,
    info: (message: string, options?: AmnuiToastCreateOptions) => show("info", message, options),
    success: (message: string, options?: AmnuiToastCreateOptions) => show("success", message, options),
    warning: (message: string, options?: AmnuiToastCreateOptions) => show("warning", message, options),
    danger: (message: string, options?: AmnuiToastCreateOptions) => show("danger", message, options),
    loading: (message: string, options?: AmnuiToastCreateOptions) => show("loading", message, options)
};
