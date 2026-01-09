"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    serverTimestamp,
    updateDoc,
    where,
    deleteDoc,
} from "firebase/firestore";

import Button from "@/components/ui/Button";

type HelperRow = {
    uid: string;
    label: string;
};

function shortUid(uid: string) {
    return `${uid.slice(0, 6)}…${uid.slice(-4)}`;
}

export default function EmployerHelpersPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [plan, setPlan] = useState<"basic" | "pro">("basic");

    const [rows, setRows] = useState<HelperRow[]>([]);
    const [inviteUrl, setInviteUrl] = useState<string>("");

    const [msg, setMsg] = useState("");
    const [busyInvite, setBusyInvite] = useState(false);

    // list actions
    const [editingUid, setEditingUid] = useState<string | null>(null);
    const [draftLabel, setDraftLabel] = useState<string>("");
    const [busyUid, setBusyUid] = useState<string | null>(null); // for save/delete

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setLoading(false);

            if (!user) {
                router.replace("/e/login");
                return;
            }

            try {
                const usnap = await getDoc(doc(db, "users", user.uid));
                const u = usnap.exists() ? (usnap.data() as any) : null;

                const hid =
                    (u?.defaultHouseholdId as string | undefined) ||
                    window.localStorage.getItem("defaultHouseholdId") ||
                    null;

                setPlan(u?.plan === "pro" ? "pro" : "basic");
                setHouseholdId(hid);

                if (hid) await loadHelpers(hid);
            } catch (e) {
                console.error(e);
                setMsg("載入失敗（可能係 Firestore rules）。");
            }
        });

        return () => unsub();
    }, [router]);

    async function loadHelpers(hid: string) {
        setMsg("");
        try {
            const qh = query(collection(db, "households", hid, "members"), where("role", "==", "helper"));
            const snap = await getDocs(qh);

            const list = snap.docs.map((d) => {
                const data = d.data() as any;
                return { uid: d.id, label: String(data?.label || "姐姐") };
            });

            list.sort((a, b) => a.label.localeCompare(b.label) || a.uid.localeCompare(b.uid));
            setRows(list);
        } catch (e) {
            console.error(e);
            setMsg("讀取失敗（可能係 rules）。");
        }
    }

    const helperCount = rows.length;

    const canCreateInvite = useMemo(() => {
        if (!householdId) return false;
        if (plan === "pro") return true;
        // basic: only 1 helper allowed
        return helperCount < 1;
    }, [householdId, plan, helperCount]);

    const limitHint = useMemo(() => {
        if (plan === "pro") return "";
        if (helperCount < 1) return "Basic 可加 1 位姐姐；如要加多位，需升級 Pro。";
        return "你而家係 Basic，只可有 1 位姐姐；如要邀請第 2 位，需升級 Pro。";
    }, [plan, helperCount]);

    async function onCreateInvite() {
        if (!householdId || !auth.currentUser) return;

        setMsg("");

        if (!canCreateInvite) {
            setMsg("只有 Pro 用戶先可以邀請多過 1 位姐姐。");
            return;
        }

        setBusyInvite(true);
        try {
            const token = crypto.randomUUID();

            await setDoc(doc(db, "invites", token), {
                householdId,
                roleToJoin: "helper",
                createdByUserId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
                expiresAt: null,
                revokedAt: null,
                usedAt: null,
                usedByUserId: null,
            });

            const url = `${window.location.origin}/join/${token}`;
            setInviteUrl(url);
            setMsg("已生成邀請連結 ✅（一次性使用）");
        } catch (e) {
            console.error(e);
            setMsg("生成邀請連結失敗（可能係 rules）。");
        } finally {
            setBusyInvite(false);
        }
    }

    async function onCopy() {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setMsg("已複製連結 ✅");
        } catch {
            setMsg("複製失敗，請手動複製。");
        }
    }

    function onShareWhatsapp() {
        if (!inviteUrl) return;
        const text = `姐姐你好～請用呢條連結加入記錄買餸/收據（一次性使用）：\n${inviteUrl}`;
        const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(wa, "_blank");
    }

    function startEdit(r: HelperRow) {
        setEditingUid(r.uid);
        setDraftLabel((r.label || "姐姐").trim() || "姐姐");
        setMsg("");
    }

    function cancelEdit() {
        setEditingUid(null);
        setDraftLabel("");
    }

    async function saveLabel(uid: string) {
        if (!householdId) return;

        const label = (draftLabel || "").trim() || "姐姐";
        setBusyUid(uid);
        setMsg("");

        try {
            await updateDoc(doc(db, "households", householdId, "members", uid), { label });
            setRows((prev) => prev.map((x) => (x.uid === uid ? { ...x, label } : x)));
            setMsg("已儲存 ✅");
            cancelEdit();
        } catch (e) {
            console.error(e);
            setMsg("儲存失敗（可能係 rules）。");
        } finally {
            setBusyUid(null);
        }
    }

    async function deleteHelper(uid: string) {
        if (!householdId) return;

        const r = rows.find((x) => x.uid === uid);
        const name = r?.label?.trim() || "姐姐";

        const ok = window.confirm(`確定要移除「${name}」？\n（移除後，姐姐將不能再提交記錄。）`);
        if (!ok) return;

        setBusyUid(uid);
        setMsg("");

        try {
            await deleteDoc(doc(db, "households", householdId, "members", uid));

            // refresh list
            setRows((prev) => prev.filter((x) => x.uid !== uid));
            if (editingUid === uid) cancelEdit();

            // if basic, after deleting, allow creating invite again
            setMsg("已移除 ✅");
        } catch (e) {
            console.error(e);
            setMsg("移除失敗（可能係 rules）。");
        } finally {
            setBusyUid(null);
        }
    }

    if (loading) {
        return (
            <AppShell role="employer" title="姐姐">
                <main style={{ padding: 16, maxWidth: 860, margin: "0 auto" }}>
                    <div style={{ color: "var(--text)", fontWeight: 900 }}>載入中…</div>
                </main>
            </AppShell>
        );
    }

    return (
        <AppShell role="employer" title="姐姐">
            <main style={{ padding: 16, maxWidth: 860, margin: "0 auto" }}>
                {/* Top (simple) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 950, color: "var(--text)" }}>姐姐管理</div>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                            已加入：<b style={{ color: "var(--text)" }}>{helperCount}</b>
                            {plan !== "pro" ? <span style={{ marginLeft: 8 }}>（Basic 只可 1 位）</span> : null}
                        </div>
                    </div>
                </div>

                {/* Invite card */}
                <div
                    style={{
                        marginTop: 12,
                        border: "1px solid var(--border)",
                        borderRadius: 18,
                        background: "var(--card)",
                        overflow: "hidden",
                    }}
                >
                    <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontWeight: 950, color: "var(--text)" }}>邀請姐姐加入</div>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)", lineHeight: 1.55 }}>
                            每條邀請連結只可以用一次；用完就失效。{plan !== "pro" ? "（Basic 只可 1 位，Pro 可多位）" : ""}
                        </div>
                    </div>

                    <div style={{ padding: 14 }}>
                        {!inviteUrl ? (
                            <>
                                <Button
                                    tone={canCreateInvite ? "primary" : "outline"}
                                    fullWidth
                                    onClick={onCreateInvite}
                                    disabled={busyInvite || !householdId || !canCreateInvite}
                                >
                                    {busyInvite ? "生成中…" : !canCreateInvite ? "需要 Pro 才可再邀請" : "生成邀請連結"}
                                </Button>

                                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: "var(--muted)", lineHeight: 1.55 }}>
                                    {limitHint}
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 12, fontWeight: 950, color: "var(--muted)" }}>邀請連結（一次性）</div>
                                <input
                                    value={inviteUrl}
                                    readOnly
                                    style={{
                                        marginTop: 8,
                                        width: "100%",
                                        padding: 12,
                                        borderRadius: 14,
                                        border: "1px solid var(--border)",
                                        background: "white",
                                        fontSize: 13,
                                        fontWeight: 900,
                                        color: "#111",
                                    }}
                                />

                                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                                    <Button tone="outline" fullWidth={false} onClick={onCopy}>
                                        複製
                                    </Button>
                                    <Button tone="primary" fullWidth={false} onClick={onShareWhatsapp}>
                                        WhatsApp 分享
                                    </Button>
                                    <Button
                                        tone="outline"
                                        fullWidth={false}
                                        onClick={() => {
                                            setInviteUrl("");
                                            setMsg("");
                                        }}
                                    >
                                        再生成一條
                                    </Button>
                                </div>

                                <div style={{ marginTop: 10, color: "var(--muted)", fontWeight: 900, fontSize: 12, lineHeight: 1.55 }}>
                                    提示：如果姐姐開錯 browser／唔記得咗，就再生成一條新 link。
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Helpers list */}
                <div
                    style={{
                        marginTop: 12,
                        border: "1px solid var(--border)",
                        borderRadius: 18,
                        background: "var(--card)",
                        overflow: "hidden",
                    }}
                >
                    <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontWeight: 950, color: "var(--text)" }}>現有姐姐</div>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                            用「編輯」可以改名；用「刪除」可以移除姐姐。
                        </div>
                    </div>

                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        {rows.length === 0 ? (
                            <div style={{ color: "var(--muted)", fontWeight: 900 }}>
                                暫時未有姐姐加入。你可以先生成邀請連結，俾姐姐加入。
                            </div>
                        ) : (
                            rows.map((r) => {
                                const isEditing = editingUid === r.uid;
                                const busy = busyUid === r.uid;

                                return (
                                    <div
                                        key={r.uid}
                                        style={{
                                            border: "1px solid rgba(15,23,42,0.10)",
                                            borderRadius: 16,
                                            padding: 12,
                                            background: "rgba(255,255,255,0.85)",
                                            boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                                            <div style={{ minWidth: 240 }}>
                                                <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(15,23,42,0.55)" }}>
                                                    UID：{shortUid(r.uid)}
                                                </div>

                                                {!isEditing ? (
                                                    <div style={{ marginTop: 8, fontSize: 16, fontWeight: 950, color: "var(--text)" }}>
                                                        {r.label?.trim() || "姐姐"}
                                                    </div>
                                                ) : (
                                                    <div style={{ marginTop: 10 }}>
                                                        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>顯示名</div>
                                                        <input
                                                            value={draftLabel}
                                                            onChange={(e) => setDraftLabel(e.target.value)}
                                                            placeholder="例如：姐姐A"
                                                            style={{
                                                                marginTop: 8,
                                                                width: "min(360px, 100%)",
                                                                padding: 12,
                                                                borderRadius: 14,
                                                                border: "1px solid var(--border)",
                                                                background: "white",
                                                                fontSize: 14,
                                                                fontWeight: 900,
                                                                color: "#111",
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                                {!isEditing ? (
                                                    <>
                                                        <Button
                                                            tone="outline"
                                                            fullWidth={false}
                                                            onClick={() => startEdit(r)}
                                                            disabled={busy || busyInvite}
                                                        >
                                                            編輯
                                                        </Button>
                                                        <Button
                                                            tone="danger"
                                                            fullWidth={false}
                                                            onClick={() => deleteHelper(r.uid)}
                                                            disabled={busy || busyInvite}
                                                        >
                                                            刪除
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            tone="primary"
                                                            fullWidth={false}
                                                            onClick={() => saveLabel(r.uid)}
                                                            disabled={busy}
                                                        >
                                                            {busy ? "儲存中…" : "儲存"}
                                                        </Button>
                                                        <Button
                                                            tone="outline"
                                                            fullWidth={false}
                                                            onClick={cancelEdit}
                                                            disabled={busy}
                                                        >
                                                            取消
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
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
                            color: msg.includes("失敗") ? "#991B1B" : "var(--text)",
                            fontWeight: 950,
                            boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
                        }}
                    >
                        {msg}
                    </div>
                ) : null}

                {!householdId ? (
                    <div style={{ marginTop: 12, color: "#991B1B", fontWeight: 950 }}>
                        未找到家庭資料。請先完成建立家庭。
                    </div>
                ) : null}
            </main>
        </AppShell>
    );
}