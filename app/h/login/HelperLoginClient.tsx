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

    // ✅ 重要：處理 signInWithRedirect 回來嗰一下
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
            setError("登入失敗，請再試一次");
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
                // redirect 會離開頁面，return
                return;
            }
        } catch {
            setError("Google 登入失敗，請再試");
            setBusy(false);
        }
    }

    return (
        <AuthLayout title="姐姐登入" subtitle="登入後會自動完成加入">
            {error && <div className={styles.error}>{error}</div>}

            <Button tone="yellow" fullWidth disabled={busy} onClick={onAnonymousLogin}>
                一鍵登入
            </Button>

            <div className={styles.divider}>或</div>

            <GoogleButton onClick={onGoogleLogin} disabled={busy} />
        </AuthLayout>
    );
}