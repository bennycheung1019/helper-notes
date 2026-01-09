"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";

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
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // ✅ 未登入就去 helper login，登入後回來 join
                router.replace(`/h/login?next=${encodeURIComponent(`/join/${token}`)}`);
                return;
            }

            // 已登入 → 執行 join
            await doJoin(user.uid);
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, token]);

    async function doJoin(uid: string) {
        if (busy) return;
        setBusy(true);
        setMsg("驗證邀請連結…");

        try {
            // 1) 讀 invite
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

            if (inv.expiresAt && inv.expiresAt.toDate && new Date() > inv.expiresAt.toDate()) {
                setMsg("呢條邀請連結已過期。請叫僱主再生成一條。");
                return;
            }

            const hid = inv.householdId;
            const role = inv.roleToJoin || "helper";

            setMsg("加入家庭中…");

            // 2) 建立 members doc（✅ 符合你 rules：只有 role / createdAt / label）
            const memberRef = doc(db, "households", hid, "members", uid);

            await setDoc(
                memberRef,
                {
                    role,
                    createdAt: serverTimestamp(),
                    label: role === "helper" ? "姐姐" : "僱主",
                },
                { merge: true } // 安全：如果重覆 join 不會爆（但 invite 一次性）
            );

            // 3) ✅ 更新 invite (一定要 updateDoc，只改兩個 field)
            await updateDoc(inviteRef, {
                usedAt: serverTimestamp(),
                usedByUserId: uid,
            });

            // 4) localStorage 綁定家庭（不同 browser/incognito 都要靠 join 再寫一次）
            if (role === "helper") {
                window.localStorage.setItem("helperHouseholdId", hid);
                setMsg("加入成功 ✅ 轉到新增頁…");
                router.replace("/h/add");
            } else {
                // 如果你將來支持 employer join
                window.localStorage.setItem("defaultHouseholdId", hid);
                setMsg("加入成功 ✅ 轉到總覽…");
                router.replace("/e/overview");
            }
        } catch (e) {
            console.error(e);
            setMsg("加入失敗（可能係 rules / invite 已被用）。");
        } finally {
            setBusy(false);
        }
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
                <div style={{ fontWeight: 950, fontSize: 16, color: "var(--text)" }}>加入家庭</div>
                <div style={{ marginTop: 8, color: "var(--muted)", fontWeight: 800 }}>{msg}</div>

                <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
                    Token：{token.slice(0, 8)}…
                </div>
            </div>
        </main>
    );
}