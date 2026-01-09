"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * ✅ 外層只負責 Suspense
 * Next.js 16 要求 useSearchParams 必須喺 Suspense 裡面
 */
export default function HelperLoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginInner />
        </Suspense>
    );
}

function LoginFallback() {
    return (
        <main style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>姐姐登入</h1>
            <p style={{ marginTop: 12, color: "#555", fontWeight: 900 }}>載入中…</p>
        </main>
    );
}

/**
 * ✅ 真正 login 邏輯
 * 你原本嘅 code 幾乎原封不動放喺呢度
 */
function LoginInner() {
    const router = useRouter();
    const sp = useSearchParams();

    const nextPath = sp.get("next") || "/h/add";

    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        // 如果已登入，直接跳返 next
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) router.replace(nextPath);
        });
        return () => unsub();
    }, [router, nextPath]);

    async function onLogin() {
        setBusy(true);
        setMsg("");

        try {
            await signInAnonymously(auth);
            router.replace(nextPath);
        } catch (e: any) {
            console.error(e);

            // Firebase Anonymous 未開
            if (String(e?.code || "").includes("operation-not-allowed")) {
                setMsg("未開啟匿名登入（Anonymous）。請到 Firebase Authentication 啟用。");
            } else {
                setMsg("登入失敗，請再試。");
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <main style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>姐姐登入</h1>

            <p style={{ marginTop: 10, color: "#555" }}>
                用邀請連結加入前，需要先登入一次（MVP：免電話 / 免 Email）。
            </p>

            <button
                onClick={onLogin}
                disabled={busy}
                style={{
                    marginTop: 10,
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "none",
                    fontSize: 16,
                    fontWeight: 900,
                    cursor: busy ? "not-allowed" : "pointer",
                    background: "#111",
                    color: "white",
                }}
            >
                {busy ? "登入中…" : "一鍵登入（匿名）"}
            </button>

            {msg ? <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p> : null}

            <p style={{ marginTop: 14, fontSize: 12, color: "#777" }}>
                登入後會自動返回：<b>{nextPath}</b>
            </p>
        </main>
    );
}