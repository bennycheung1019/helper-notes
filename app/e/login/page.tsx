"use client";

import { useEffect, useState } from "react";
import {
    GoogleAuthProvider,
    browserLocalPersistence,
    setPersistence,
    signInWithPopup,
    signInWithRedirect,
    sendSignInLinkToEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/auth/GoogleButton";
import styles from "@/components/auth/auth.module.css";

type Status = "idle" | "sending" | "sent" | "error";

export default function EmployerLoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [busyGoogle, setBusyGoogle] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // ✅ 保留登入狀態（手機/桌面）
    useEffect(() => {
        setPersistence(auth, browserLocalPersistence).catch(() => { });
    }, []);

    async function onSendLink() {
        setErrorMsg("");
        const trimmed = email.trim();
        if (!trimmed) {
            setErrorMsg("請輸入電郵地址");
            return;
        }

        setStatus("sending");

        try {
            const actionCodeSettings = {
                url: `${window.location.origin}/e/auth`,
                handleCodeInApp: true,
            };

            await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);
            window.localStorage.setItem("employerEmailForSignIn", trimmed);

            setStatus("sent");
        } catch (err) {
            console.error(err);
            setStatus("error");
            setErrorMsg("發送失敗，請稍後再試。");
        }
    }

    async function onGoogleLogin() {
        setErrorMsg("");
        setBusyGoogle(true);

        const provider = new GoogleAuthProvider();

        try {
            try {
                await signInWithPopup(auth, provider);
            } catch {
                // mobile fallback
                await signInWithRedirect(auth, provider);
                return;
            }

            router.replace("/e/overview");
        } catch (e) {
            console.error(e);
            setErrorMsg("Google 登入失敗，請再試。");
        } finally {
            setBusyGoogle(false);
        }
    }

    return (
        <AuthLayout title="僱主登入" subtitle="用電郵連結或 Google 快速登入">
            {errorMsg ? <div className={styles.error}>{errorMsg}</div> : null}

            {/* Google */}
            <GoogleButton onClick={onGoogleLogin} disabled={busyGoogle || status === "sending"} />

            <div className={styles.divider}>或</div>

            {/* Email */}
            <div className={styles.field}>
                <div className={styles.label}>電郵地址</div>
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    placeholder="you@example.com"
                    className={styles.input}
                    disabled={status === "sending" || busyGoogle}
                />
            </div>

            <Button
                tone="primary"
                fullWidth
                onClick={onSendLink}
                disabled={status === "sending" || busyGoogle}
            >
                {status === "sending" ? "發送中…" : "發送登入連結"}
            </Button>

            {status === "sent" ? (
                <div className={styles.noteBox}>
                    <div className={styles.noteTitle}>已寄出 ✅</div>
                    <div className={styles.noteText}>請到你嘅電郵收件匣，點擊登入連結完成登入。</div>
                </div>
            ) : null}
        </AuthLayout>
    );
}