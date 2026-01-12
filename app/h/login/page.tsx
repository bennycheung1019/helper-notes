"use client";

import { useEffect, useState } from "react";
import {
    GoogleAuthProvider,
    browserLocalPersistence,
    setPersistence,
    signInAnonymously,
    signInWithPopup,
    signInWithRedirect,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/auth/GoogleButton";
import styles from "@/components/auth/auth.module.css";

export default function HelperLoginPage() {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // ✅ 保留登入狀態（手機 / 桌面）
    useEffect(() => {
        setPersistence(auth, browserLocalPersistence).catch(() => { });
    }, []);

    async function onAnonymousLogin() {
        setError("");
        setBusy(true);
        try {
            await signInAnonymously(auth);
            router.replace("/h/add");
        } catch {
            setError("登入失敗，請再試一次");
        } finally {
            setBusy(false);
        }
    }

    async function onGoogleLogin() {
        setError("");
        const provider = new GoogleAuthProvider();

        try {
            try {
                await signInWithPopup(auth, provider);
            } catch {
                // mobile fallback
                await signInWithRedirect(auth, provider);
                return;
            }
            router.replace("/h/add");
        } catch {
            setError("Google 登入失敗，請再試");
        }
    }

    return (
        <AuthLayout title="姐姐登入" subtitle="登入後再用邀請連結完成加入">
            {error && <div className={styles.error}>{error}</div>}

            {/* Primary */}
            <Button
                tone="yellow"
                fullWidth
                disabled={busy}
                onClick={onAnonymousLogin}
            >
                一鍵登入
            </Button>

            <div className={styles.divider}>或</div>

            {/* Google */}
            <GoogleButton onClick={onGoogleLogin} disabled={busy} />
        </AuthLayout>
    );
}