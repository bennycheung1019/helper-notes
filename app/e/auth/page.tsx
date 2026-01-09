"use client";

import { useEffect, useState } from "react";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function EmployerAuthCallbackPage() {
    const router = useRouter();
    const [msg, setMsg] = useState("正在完成登入…");

    useEffect(() => {
        async function run() {
            try {
                const href = window.location.href;

                if (!isSignInWithEmailLink(auth, href)) {
                    setMsg("呢條連結唔正確，請返回登入頁重新發送。");
                    return;
                }

                // 從 localStorage 取返之前輸入嘅 email
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
                setMsg("登入失敗，請返回登入頁重新發送連結。");
            }
        }

        run();
    }, [router]);

    return (
        <main style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>處理登入</h1>
            <p style={{ marginTop: 10, color: "#555" }}>{msg}</p>

            <div style={{ marginTop: 16 }}>
                <a href="/e/login" style={{ color: "#0066cc" }}>
                    返回登入頁
                </a>
            </div>
        </main>
    );
}
