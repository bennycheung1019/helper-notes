"use client";

import { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function EmployerLoginPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

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
                // 呢個係 email link 點完之後返嚟你網站嘅頁面
                url: `${window.location.origin}/e/auth`,
                handleCodeInApp: true,
            };

            await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);

            // 記低 email（因為點 link 回來時 Firebase 需要）
            window.localStorage.setItem("employerEmailForSignIn", trimmed);

            setStatus("sent");
        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setErrorMsg("發送失敗，請稍後再試。");
        }
    }

    return (
        <main style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>僱主登入</h1>
            <p style={{ marginTop: 8, color: "#555" }}>
                輸入電郵，我哋會寄一條登入連結俾你。
            </p>

            <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                    電郵地址
                </label>
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    placeholder="例如：you@example.com"
                    style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        fontSize: 16,
                    }}
                />
            </div>

            {errorMsg ? (
                <p style={{ marginTop: 10, color: "crimson" }}>{errorMsg}</p>
            ) : null}

            <button
                onClick={onSendLink}
                disabled={status === "sending"}
                style={{
                    marginTop: 14,
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "none",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: status === "sending" ? "not-allowed" : "pointer",
                }}
            >
                {status === "sending" ? "發送中…" : "發送登入連結"}
            </button>

            {status === "sent" ? (
                <div style={{ marginTop: 14, padding: 12, border: "1px solid #e5e5e5", borderRadius: 12 }}>
                    <p style={{ fontWeight: 700, marginBottom: 6 }}>已寄出 ✅</p>
                    <p style={{ margin: 0, color: "#555" }}>
                        請去你嘅電郵收件匣，點擊登入連結完成登入。
                    </p>
                </div>
            ) : null}

            <p style={{ marginTop: 18, fontSize: 12, color: "#777" }}>
                提示：如果搵唔到電郵，記得睇下垃圾郵件。
            </p>
        </main>
    );
}
