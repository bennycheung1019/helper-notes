"use client";

import { useEffect, useMemo, useState } from "react";
import {
    GoogleAuthProvider,
    browserLocalPersistence,
    setPersistence,
    signInAnonymously,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/auth/GoogleButton";
import styles from "@/components/auth/auth.module.css";
import { useI18n } from "@/components/i18n/LangProvider";

function safeNextPath(n: string | null) {
    const s = String(n || "").trim();
    if (!s) return null;
    if (!s.startsWith("/")) return null;
    if (s.startsWith("//")) return null;
    return s;
}

export default function HelperLoginClient() {
    const router = useRouter();
    const sp = useSearchParams();
    const { t } = useI18n();

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const nextUrl = useMemo(() => {
        const n = safeNextPath(sp.get("next"));
        if (n) return n;

        // ✅ fallback：如果 next 無，試用 localStorage 記低嘅 joinNext
        try {
            const j = safeNextPath(window.localStorage.getItem("helperJoinNext"));
            if (j) return j;
        } catch { }

        return "/h/add";
    }, [sp]);

    // ✅ 保留登入狀態（手機 / 桌面）
    useEffect(() => {
        setPersistence(auth, browserLocalPersistence).catch(() => { });
    }, []);

    // ✅ 處理 signInWithRedirect 回來
    useEffect(() => {
        (async () => {
            try {
                const res = await getRedirectResult(auth);
                if (res?.user) {
                    router.replace(nextUrl);
                }
            } catch {
                // ignore
            }
        })();
    }, [router, nextUrl]);

    async function onAnonymousLogin() {
        setError("");
        setBusy(true);
        try {
            await signInAnonymously(auth);
            router.replace(nextUrl);
        } catch {
            setError(t("hLogin.error.generic"));
        } finally {
            setBusy(false);
        }
    }

    async function onGoogleLogin() {
        setError("");
        setBusy(true);
        const provider = new GoogleAuthProvider();

        try {
            try {
                await signInWithPopup(auth, provider);
                router.replace(nextUrl);
            } catch {
                // mobile fallback
                await signInWithRedirect(auth, provider);
                return;
            }
        } catch {
            setError(t("hLogin.error.google"));
            setBusy(false);
        }
    }

    return (
        <AuthLayout
            title={t("hLogin.title")}
            subtitle={t("hLogin.subtitle")}
        >
            {error && <div className={styles.error}>{error}</div>}

            <Button tone="yellow" fullWidth disabled={busy} onClick={onAnonymousLogin}>
                {t("hLogin.quickLogin")}
            </Button>

            <div className={styles.divider}>{t("common.or")}</div>

            <GoogleButton onClick={onGoogleLogin} disabled={busy} />
        </AuthLayout>
    );
}