"use client";

import { AppShell } from "@/components/AppShell";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function HelperSettingsPage() {
    const router = useRouter();

    async function onLogout() {
        await signOut(auth);
        window.localStorage.removeItem("helperHouseholdId");
        router.replace("/h/login");
    }

    return (
        <AppShell role="helper" title="設定">
            <main style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: "var(--text)" }}>設定</h1>
                <div style={{ marginTop: 8, color: "var(--muted)", fontWeight: 800, fontSize: 13, lineHeight: 1.5 }}>
                    登出唔係常用動作，所以放喺設定頁會自然啲。
                </div>

                <div
                    style={{
                        marginTop: 14,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        borderRadius: 18,
                        padding: 14,
                    }}
                >
                    <div style={{ fontWeight: 950, fontSize: 15, color: "var(--text)" }}>帳戶</div>

                    <button
                        onClick={onLogout}
                        style={{
                            marginTop: 12,
                            width: "100%",
                            padding: 14,
                            borderRadius: 16,
                            border: "1px solid var(--border)",
                            background: "white",
                            fontWeight: 950,
                            cursor: "pointer",
                            color: "#0f172a",
                        }}
                    >
                        登出
                    </button>

                    <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", fontWeight: 800, lineHeight: 1.5 }}>
                        提示：登出後要再次用邀請連結加入，先會重新綁定家庭。
                    </div>
                </div>
            </main>
        </AppShell>
    );
}