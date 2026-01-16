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

import { useI18n } from "@/components/i18n/LangProvider";

type Status = "idle" | "sending" | "sent" | "error";

export default function EmployerLoginPage() {
    const router = useRouter();
    const { t } = useI18n();

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
            setErrorMsg(t("login.emailRequired"));
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
            setErrorMsg(t("login.sendFail"));
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
            setErrorMsg(t("login.googleFail"));
        } finally {
            setBusyGoogle(false);
        }
    }

    return (
        <AuthLayout
            title={t("login.employer.title")}
            subtitle={t("login.employer.subtitle")}
        >
            {errorMsg ? <div className={styles.error}>{errorMsg}</div> : null}

            {/* Google */}
            <GoogleButton
                onClick={onGoogleLogin}
                disabled={busyGoogle || status === "sending"}
            />

            <div className={styles.divider}>{t("common.or")}</div>

            {/* Email */}
            <div className={styles.field}>
                <div className={styles.label}>{t("login.emailLabel")}</div>
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    placeholder={t("login.emailPlaceholder")}
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
                {status === "sending"
                    ? t("login.sending")
                    : t("login.sendLink")}
            </Button>

            {status === "sent" ? (
                <div className={styles.noteBox}>
                    <div className={styles.noteTitle}>{t("login.sentTitle")}</div>
                    <div className={styles.noteText}>{t("login.sentText")}</div>
                </div>
            ) : null}
        </AuthLayout>
    );
}