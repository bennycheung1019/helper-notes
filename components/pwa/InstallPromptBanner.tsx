"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./installPromptBanner.module.css";

export type Role = "helper" | "employer";

type Props = {
    role: Role;
};

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIOS() {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    const iOS = /iPad|iPhone|iPod/.test(ua);
    // iPadOS 13+ reports as Mac; this is a common heuristic
    const iPadOS = /Macintosh/.test(ua) && "ontouchend" in document;
    return iOS || iPadOS;
}

function isStandalone() {
    if (typeof window === "undefined") return false;
    // iOS Safari
    // @ts-ignore
    const iosStandalone = typeof navigator !== "undefined" && (navigator as any).standalone === true;
    // Modern browsers
    const displayModeStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
    return Boolean(iosStandalone || displayModeStandalone);
}

function nowMs() {
    return Date.now();
}

function key(role: Role, suffix: string) {
    return `pwa:${role}:${suffix}`;
}

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export default function InstallPromptBanner({ role }: Props) {
    const [show, setShow] = useState(false);
    const [canInstall, setCanInstall] = useState(false);
    const [isIos, setIsIos] = useState(false);

    const [toast, setToast] = useState<{ open: boolean; text: string }>({ open: false, text: "" });

    const bipRef = useRef<BeforeInstallPromptEvent | null>(null);

    const roleLabel = role === "employer" ? "僱主" : "姐姐";

    const desc = useMemo(() => {
        if (isIos) return "Safari 下方「分享」→「加入主畫面」。";
        return "安裝後一撳就開，唔怕搵唔返。";
    }, [isIos]);

    function openToast(text: string) {
        setToast({ open: true, text });
        window.setTimeout(() => setToast({ open: false, text: "" }), 1600);
    }

    function shouldSnoozeHide() {
        try {
            const v = window.localStorage.getItem(key(role, "dismissedAt"));
            const t = v ? Number(v) : 0;
            if (!t) return false;
            return nowMs() - t < SNOOZE_MS;
        } catch {
            return false;
        }
    }

    function markDismissed() {
        try {
            window.localStorage.setItem(key(role, "dismissedAt"), String(nowMs()));
        } catch { }
    }

    useEffect(() => {
        setIsIos(isIOS());

        // 已安裝 / 已 standalone：永遠唔顯示
        if (isStandalone()) {
            setShow(false);
            return;
        }

        // 7 日 snooze：唔顯示
        if (shouldSnoozeHide()) {
            setShow(false);
            return;
        }

        // 預設先唔 show，等 browser event（Android/Chrome）or iOS fallback
        setShow(false);

        function onBIP(e: Event) {
            // Chrome / Edge 會觸發
            e.preventDefault();
            bipRef.current = e as BeforeInstallPromptEvent;
            setCanInstall(true);
            setShow(true);
        }

        function onAppInstalled() {
            // 安裝完成
            setShow(false);
            openToast("已加入主畫面 ✅");
            // 清走 snooze（下次唔會再彈）
            try {
                window.localStorage.removeItem(key(role, "dismissedAt"));
            } catch { }
        }

        window.addEventListener("beforeinstallprompt", onBIP as any);
        window.addEventListener("appinstalled", onAppInstalled);

        // iOS：冇 beforeinstallprompt，直接用教學 banner（如果未 snooze）
        if (isIOS()) {
            setCanInstall(false);
            setShow(true);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", onBIP as any);
            window.removeEventListener("appinstalled", onAppInstalled);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    async function onInstall() {
        // iOS：無法 programmatically prompt，只係提示
        if (isIOS()) {
            openToast("跟住指示加入主畫面 ✅");
            return;
        }

        const ev = bipRef.current;
        if (!ev) {
            // 某啲 browser/情況唔會俾 prompt
            openToast("暫時未支援安裝");
            return;
        }

        try {
            await ev.prompt();
            const choice = await ev.userChoice;

            if (choice?.outcome === "accepted") {
                // appinstalled event 之後會出 toast
                setShow(false);
            } else {
                // 用戶取消：照樣 snooze 7 日，避免煩
                markDismissed();
                setShow(false);
            }
        } catch {
            // prompt 失敗：保守 snooze
            markDismissed();
            setShow(false);
        }
    }

    function onLater() {
        // 7 日後再提示
        markDismissed();
        setShow(false);
    }

    function onClose() {
        // 關閉都當作 snooze
        markDismissed();
        setShow(false);
    }

    if (!show) {
        // ✅ Toast 仍然可以顯示（就算 banner 隱藏）
        return toast.open ? (
            <div className={styles.toastWrap} aria-live="polite">
                <div className={styles.toast}>{toast.text}</div>
            </div>
        ) : null;
    }

    return (
        <>
            {/* Toast */}
            {toast.open ? (
                <div className={styles.toastWrap} aria-live="polite">
                    <div className={styles.toast}>{toast.text}</div>
                </div>
            ) : null}

            <div className={styles.wrap} data-role={role}>
                <div className={styles.card} role="region" aria-label="Install app prompt">
                    <div className={styles.left}>
                        <div className={styles.icon} aria-hidden="true">
                            <span className={styles.iconMark}>＋</span>
                        </div>
                    </div>

                    <div className={styles.mid}>
                        <div className={styles.title}>
                            加到主畫面（{roleLabel}）
                        </div>
                        <div className={styles.desc}>{desc}</div>
                    </div>

                    <div className={styles.right}>
                        <button className={styles.btnClose} onClick={onClose} aria-label="Close">
                            ✕
                        </button>

                        <div className={styles.actions}>
                            <button className={styles.btnPrimary} onClick={onInstall}>
                                {isIos ? "睇指示" : canInstall ? "安裝" : "加入主畫面"}
                            </button>
                            <button className={styles.btnSecondary} onClick={onLater}>
                                7 日後提醒
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}