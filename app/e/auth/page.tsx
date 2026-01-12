"use client";

import { useEffect, useState } from "react";
import {
    getRedirectResult,
    isSignInWithEmailLink,
    signInWithEmailLink,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function EmployerAuthCallbackPage() {
    const router = useRouter();
    const [msg, setMsg] = useState("正在完成登入…");

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                // 1) ✅ Google redirect 回來：先處理 redirect result
                // 如果用咗 signInWithRedirect，回來後要 getRedirectResult
                setMsg("正在完成登入…");

                const redirectRes = await getRedirectResult(auth);

                if (cancelled) return;

                if (redirectRes?.user) {
                    setMsg("登入成功 ✅ 正在進入總覽…");
                    router.replace("/e/overview");
                    return;
                }

                // 2) ✅ 再處理 Email link（你原本邏輯）
                const href = window.location.href;

                if (!isSignInWithEmailLink(auth, href)) {
                    setMsg("呢條連結唔正確，請返回登入頁重新發送。");
                    return;
                }

                let email = window.localStorage.getItem("employerEmailForSignIn") || "";

                // 如果 localStorage 冇（例如用另一部機開 email），就問一次
                if (!email) {
                    email = window.prompt("請輸入你嘅電郵以完成登入：") || "";
                }

                email = email.trim();
                if (!email) {
                    setMsg("未輸入電郵，無法完成登入。");
                    return;
                }

                await signInWithEmailLink(auth, email, href);

                // 清走暫存
                window.localStorage.removeItem("employerEmailForSignIn");

                setMsg("登入成功 ✅ 正在進入總覽…");
                router.replace("/e/overview");
            } catch (err) {
                console.error(err);
                if (!cancelled) setMsg("登入失敗，請返回登入頁重新登入。");
            }
        }

        run();

        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <main style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
            <h1 style={{ fontSize: 20, fontWeight: 950, margin: 0 }}>處理登入</h1>
            <p style={{ marginTop: 10, color: "rgba(18,18,18,0.65)", fontWeight: 850, lineHeight: 1.6 }}>
                {msg}
            </p>

            <div style={{ marginTop: 16 }}>
                <a href="/e/login" style={{ color: "#0b5bd3", fontWeight: 900 }}>
                    返回登入頁
                </a>
            </div>
        </main>
    );
}