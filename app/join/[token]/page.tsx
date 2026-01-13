"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";

type InviteDoc = {
    householdId: string;
    roleToJoin: "helper" | "employer";
    createdByUserId: string;
    createdAt: any;
    expiresAt: any | null;
    revokedAt: any | null;
    usedAt: any | null;
    usedByUserId: string | null;
};

export default function JoinByTokenPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const router = useRouter();
    const { token } = React.use(params);

    const [msg, setMsg] = useState("準備加入中…");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        // ✅ 記低 token，避免用戶要貼第二次
        try {
            window.localStorage.setItem("helperJoinToken", token);
            window.localStorage.setItem("helperJoinNext", `/join/${token}`);
        } catch { }

        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.replace(`/h/login?next=${encodeURIComponent(`/join/${token}`)}`);
                return;
            }
            await doJoin(user.uid);
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, token]);

    async function doJoin(uid: string) {
        if (busy) return;
        setBusy(true);

        try {
            setMsg("驗證邀請連結…");

            const inviteRef = doc(db, "invites", token);
            const inviteSnap = await getDoc(inviteRef);

            if (!inviteSnap.exists()) {
                setMsg("呢條邀請連結無效或已失效。");
                return;
            }

            const inv = inviteSnap.data() as InviteDoc;

            if (inv.revokedAt) {
                setMsg("呢條邀請連結已被取消。");
                return;
            }
            if (inv.usedAt) {
                setMsg("呢條邀請連結已用過（一次性）。請叫僱主再生成一條。");
                return;
            }
            if (inv.expiresAt?.toDate && new Date() > inv.expiresAt.toDate()) {
                setMsg("呢條邀請連結已過期。請叫僱主再生成一條。");
                return;
            }

            const hid = inv.householdId;
            const role = (inv.roleToJoin || "helper") as "helper" | "employer";

            setMsg("加入家庭中…");

            // ✅ 一次 batch commit（members + invite usedAt）
            // ✅ members 必須帶 inviteToken，先符合 rules.validInviteForJoin()
            const batch = writeBatch(db);

            const memberRef = doc(db, "households", hid, "members", uid);
            batch.set(
                memberRef,
                {
                    role,
                    label: role === "helper" ? "姐姐" : "僱主",
                    inviteToken: token, // ✅ 關鍵：一定要有
                    createdAt: serverTimestamp(),
                },
                { merge: false } // ✅ create-only，避免變 update
            );

            batch.update(inviteRef, {
                usedAt: serverTimestamp(),
                usedByUserId: uid,
            });

            await batch.commit();

            // ✅ 綁定 household（helper 之後 /h/add 用到）
            if (role === "helper") {
                window.localStorage.setItem("helperHouseholdId", hid);
                cleanupJoinCache();
                setMsg("加入成功 ✅ 轉到新增頁…");
                router.replace("/h/add");
            } else {
                window.localStorage.setItem("defaultHouseholdId", hid);
                cleanupJoinCache();
                setMsg("加入成功 ✅ 轉到總覽…");
                router.replace("/e/overview");
            }
        } catch (e: any) {
            console.error(e);
            setMsg(`加入失敗（${e?.code || "unknown"}）：多數係 rules / invite 已被用 / 欄位唔符合`);
        } finally {
            setBusy(false);
        }
    }

    function cleanupJoinCache() {
        try {
            window.localStorage.removeItem("helperJoinToken");
            window.localStorage.removeItem("helperJoinNext");
        } catch { }
    }

    return (
        <main style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
            <div
                style={{
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    borderRadius: 18,
                    padding: 14,
                    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
                }}
            >
                <div style={{ fontWeight: 950, fontSize: 16, color: "var(--text)" }}>
                    加入家庭
                </div>
                <div style={{ marginTop: 8, color: "var(--muted)", fontWeight: 800 }}>
                    {msg}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
                    Token：{token.slice(0, 8)}…
                </div>
            </div>
        </main>
    );
}