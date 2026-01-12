"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function HelperAuthCallbackPage() {
    const router = useRouter();
    const sp = useSearchParams();

    const nextPath = useMemo(() => sp.get("next") || "/h/add", [sp]);

    const [msg, setMsg] = useState("正在完成登入…");

    useEffect(() => {
        let unsub: (() => void) | null = null;

        async function run() {
            try {
                // 1) Try to resolve Google redirect result
                // If it's a redirect flow, this will finalize the sign-in.
                await getRedirectResult(auth).catch(() => null);

                // 2) Wait for auth state
                unsub = onAuthStateChanged(auth, (user) => {
                    if (user) {
                        setMsg("登入成功 ✅ 正在進入…");
                        router.replace(nextPath);
                    } else {
                        setMsg("未完成登入。請返回登入頁再試一次。");
                    }
                });
            } catch (e) {
                console.error(e);
                setMsg("登入失敗。請返回登入頁再試一次。");
            }
        }

        run();

        return () => {
            if (unsub) unsub();
        };
    }, [router, nextPath]);

    return (
        <div style={{ minHeight: "100vh", background: "#fbf6ee", color: "#121212" }}>
            {/* Top mini nav */}
            <header
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 40,
                    background: "rgba(251, 246, 238, 0.86)",
                    backdropFilter: "blur(10px)",
                    borderBottom: "1px solid rgba(18,18,18,0.10)",
                }}
            >
                <div
                    style={{
                        maxWidth: 1040,
                        margin: "0 auto",
                        padding: "14px 18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                    }}
                >
                    <a
                        href="/"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            textDecoration: "none",
                            color: "inherit",
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                overflow: "hidden",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-hidden="true"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icon_512.png" alt="" width={34} height={34} style={{ display: "block" }} />
                        </div>

                        <div
                            style={{
                                fontWeight: 1100,
                                fontSize: 14,
                                letterSpacing: -0.2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            姐姐記帳
                        </div>
                    </a>

                    <a
                        href="/h/login"
                        style={{
                            textDecoration: "none",
                            fontWeight: 950,
                            fontSize: 13,
                            color: "rgba(18,18,18,0.65)",
                        }}
                    >
                        返回登入
                    </a>
                </div>
            </header>

            <main style={{ maxWidth: 520, margin: "0 auto", padding: "26px 18px 64px" }}>
                <div
                    style={{
                        border: "1px solid rgba(18,18,18,0.10)",
                        borderRadius: 26,
                        background: "rgba(255,255,255,0.92)",
                        boxShadow: "0 22px 60px rgba(18,18,18,0.08)",
                        padding: 18,
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 1100,
                            fontSize: 12,
                            color: "rgba(18,18,18,0.58)",
                            border: "1px solid rgba(18,18,18,0.10)",
                            background: "rgba(255,255,255,0.55)",
                            padding: "8px 10px",
                            borderRadius: 999,
                            width: "fit-content",
                        }}
                    >
                        處理登入
                    </div>

                    <h1
                        style={{
                            margin: "12px 0 0",
                            fontSize: 28,
                            lineHeight: 1.15,
                            letterSpacing: -0.6,
                            fontWeight: 1200,
                        }}
                    >
                        請稍等
                    </h1>

                    <p
                        style={{
                            marginTop: 10,
                            color: "rgba(18,18,18,0.58)",
                            fontWeight: 900,
                            lineHeight: 1.7,
                        }}
                    >
                        {msg}
                    </p>

                    <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <a
                            href="/h/login"
                            style={{
                                flex: "1 1 160px",
                                textAlign: "center",
                                padding: 12,
                                borderRadius: 16,
                                border: "1px solid rgba(18,18,18,0.10)",
                                background: "#fff",
                                textDecoration: "none",
                                fontWeight: 1100,
                                color: "#121212",
                            }}
                        >
                            返回登入
                        </a>

                        <a
                            href={nextPath}
                            style={{
                                flex: "1 1 160px",
                                textAlign: "center",
                                padding: 12,
                                borderRadius: 16,
                                border: "none",
                                background: "#2ec4b6",
                                color: "white",
                                textDecoration: "none",
                                fontWeight: 1200,
                                boxShadow: "0 14px 30px rgba(18,18,18,0.12)",
                            }}
                        >
                            直接進入
                        </a>
                    </div>

                    <div
                        style={{
                            marginTop: 14,
                            padding: 12,
                            borderRadius: 16,
                            border: "1px solid rgba(18,18,18,0.10)",
                            background: "rgba(255,255,255,0.75)",
                            color: "rgba(18,18,18,0.62)",
                            fontWeight: 900,
                            lineHeight: 1.65,
                            fontSize: 13,
                        }}
                    >
                        <div style={{ fontWeight: 1100, color: "rgba(18,18,18,0.78)" }}>提醒</div>
                        <div style={{ marginTop: 6 }}>
                            登入完成後，你仍然需要僱主提供嘅「邀請連結」先會正式加入家庭。
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}