// lib/returnTo.ts
export const RETURN_TO_KEY = "__returnTo";
export const RETURN_SCROLL_Y_KEY = "__returnToScrollY";

export function saveReturnToCurrentPage() {
    try {
        const url =
            window.location.pathname + window.location.search + (window.location.hash || "");
        sessionStorage.setItem(RETURN_TO_KEY, url);
        sessionStorage.setItem(RETURN_SCROLL_Y_KEY, String(window.scrollY || 0));
    } catch { }
}

/**
 * ✅ restore scroll once (with retry)
 * - 因為 list 會先 load 10 筆再 render，單次 rAF 好易太早 scrollTo
 * - 會 retry 幾次，直到 document height 夠或到達 maxTries
 *
 * 用法建議：
 * - 喺 list page：loadingFirst 變 false + items render 後 call
 */
export function restoreScrollOnce(opts?: {
    maxTries?: number;        // default 16
    waitMs?: number;          // default 60
    isReady?: () => boolean;  // 例如 () => !loadingFirst
}) {
    try {
        const yStr = sessionStorage.getItem(RETURN_SCROLL_Y_KEY);
        if (!yStr) return;

        const y = Number(yStr);
        if (!Number.isFinite(y) || y <= 0) {
            sessionStorage.removeItem(RETURN_SCROLL_Y_KEY);
            return;
        }

        const maxTries = opts?.maxTries ?? 16;
        const waitMs = opts?.waitMs ?? 60;
        const isReady = opts?.isReady;

        let tries = 0;

        const attempt = () => {
            tries += 1;

            // 等你自己話 ready（例如已經 loadingFirst=false）
            if (isReady && !isReady()) {
                if (tries < maxTries) {
                    setTimeout(attempt, waitMs);
                }
                return;
            }

            const doc = document.documentElement;
            const maxScrollable = Math.max(0, doc.scrollHeight - window.innerHeight);

            // 若內容仲未夠高，等一等再試
            if (maxScrollable + 4 < y && tries < maxTries) {
                setTimeout(attempt, waitMs);
                return;
            }

            // ✅ 成功／最後一次：scroll + 清除 key
            window.scrollTo({ top: Math.min(y, maxScrollable), behavior: "auto" });
            sessionStorage.removeItem(RETURN_SCROLL_Y_KEY);
        };

        // 兩次 rAF 先開始（避免 layout 未 ready）
        requestAnimationFrame(() => requestAnimationFrame(attempt));
    } catch { }
}

export function consumeReturnTo(): string | null {
    try {
        const rt = sessionStorage.getItem(RETURN_TO_KEY);
        if (!rt) return null;
        sessionStorage.removeItem(RETURN_TO_KEY);
        return rt;
    } catch {
        return null;
    }
}