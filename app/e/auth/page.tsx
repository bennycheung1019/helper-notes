"use client";

import { useEffect, useState } from "react";
import {
    getRedirectResult,
    isSignInWithEmailLink,
    signInWithEmailLink,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/LangProvider";

export default function EmployerAuthCallbackPage() {
    const router = useRouter();
    const { t } = useI18n();

    const [msg, setMsg] = useState(t("auth.processingLogin"));

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                // 1) Google redirect
                setMsg(t("auth.processingLogin"));

                const redirectRes = await getRedirectResult(auth);
                if (cancelled) return;

                if (redirectRes?.user) {
                    setMsg(t("auth.loginSuccessRedirecting"));
                    router.replace("/e/overview");
                    return;
                }

                // 2) Email link
                const href = window.location.href;

                if (!isSignInWithEmailLink(auth, href)) {
                    setMsg(t("auth.invalidLink"));
                    return;
                }

                let email = window.localStorage.getItem("employerEmailForSignIn") || "";

                // fallback：另一部機
                if (!email) {
                    email = window.prompt(t("auth.promptEmail")) || "";
                }

                email = email.trim();
                if (!email) {
                    setMsg(t("auth.missingEmail"));
                    return;
                }

                await signInWithEmailLink(auth, email, href);

                window.localStorage.removeItem("employerEmailForSignIn");

                setMsg(t("auth.loginSuccessRedirecting"));
                router.replace("/e/overview");
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setMsg(t("auth.loginFailed"));
                }
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [router, t]);

    return (
        <main style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
            <h1 style={{ fontSize: 20, fontWeight: 950, margin: 0 }}>
                {t("auth.processingTitle")}
            </h1>

            <p
                style={{
                    marginTop: 10,
                    color: "rgba(18,18,18,0.65)",
                    fontWeight: 850,
                    lineHeight: 1.6,
                }}
            >
                {msg}
            </p>

            <div style={{ marginTop: 16 }}>
                <a href="/e/login" style={{ color: "#0b5bd3", fontWeight: 900 }}>
                    {t("auth.backToLogin")}
                </a>
            </div>
        </main>
    );
}