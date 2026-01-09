"use client";

import { AppShell } from "@/components/AppShell";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

export default function EmployerSettingsPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState<string>("");
    const [plan, setPlan] = useState<"basic" | "pro">("basic");
    const [msg, setMsg] = useState<string>("");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setLoading(false);

            if (!user) {
                router.replace("/e/login");
                return;
            }

            setEmail(user.email || "");

            try {
                const usnap = await getDoc(doc(db, "users", user.uid));
                const u = usnap.exists() ? (usnap.data() as any) : null;
                setPlan(u?.plan === "pro" ? "pro" : "basic");
            } catch (e) {
                console.error(e);
            }
        });

        return () => unsub();
    }, [router]);

    async function onLogout() {
        setMsg("");
        try {
            await signOut(auth);
            router.replace("/e/login");
        } catch (e) {
            console.error(e);
            setMsg("登出失敗，請再試。");
        }
    }

    if (loading) {
        return (
            <AppShell role="employer" title="設定">
                <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                    <div style={{ color: "var(--text)", fontWeight: 900 }}>載入中…</div>
                </main>
            </AppShell>
        );
    }

    return (
        <AppShell role="employer" title="設定">
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                <div style={{ fontSize: 18, fontWeight: 950, color: "var(--text)" }}>設定</div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                    低頻操作（登出、帳戶、方案）放呢度先符合 App UX
                </div>

                {/* Account */}
                <div style={{ marginTop: 12, border: "1px solid var(--border)", borderRadius: 18, background: "var(--card)" }}>
                    <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontWeight: 950, color: "var(--text)" }}>帳戶</div>
                    </div>

                    <div style={{ padding: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 950, color: "var(--muted)" }}>登入電郵</div>
                        <div style={{ marginTop: 6, fontWeight: 950, color: "var(--text)" }}>{email || "（未有）"}</div>

                        <div style={{ marginTop: 12, fontSize: 12, fontWeight: 950, color: "var(--muted)" }}>方案</div>
                        <div style={{ marginTop: 6, fontWeight: 950, color: "var(--text)" }}>
                            {plan === "pro" ? "Pro" : "Basic"}
                            {plan !== "pro" ? (
                                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                                    （Pro：多姐姐 + CSV 匯出）
                                </span>
                            ) : null}
                        </div>

                        <div style={{ marginTop: 12, padding: 12, borderRadius: 16, border: "1px solid var(--border)", background: "var(--bg)" }}>
                            <div style={{ fontWeight: 950, color: "var(--text)" }}>下一步（之後加）</div>
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)", lineHeight: 1.5 }}>
                                ・Google 登入（僱主）<br />
                                ・多僱主（夫妻/家人同一家庭）<br />
                                ・語言切換<br />
                                ・PWA 安裝提示 / 一鍵教學
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <div style={{ marginTop: 12, border: "1px solid var(--border)", borderRadius: 18, background: "var(--card)" }}>
                    <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontWeight: 950, color: "var(--text)" }}>安全</div>
                    </div>

                    <div style={{ padding: 14 }}>
                        <button
                            onClick={onLogout}
                            style={{
                                width: "100%",
                                padding: 14,
                                borderRadius: 16,
                                border: "1px solid var(--border)",
                                background: "white",
                                color: "#111",
                                fontWeight: 950,
                                cursor: "pointer",
                            }}
                        >
                            登出
                        </button>

                        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                            （登出係低頻操作，放設定頁先正常）
                        </div>
                    </div>
                </div>

                {msg ? (
                    <div
                        style={{
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 14,
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            color: "crimson",
                            fontWeight: 950,
                        }}
                    >
                        {msg}
                    </div>
                ) : null}
            </main>
        </AppShell>
    );
}