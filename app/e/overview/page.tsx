"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { syncAuthUid } from "@/lib/localAuth";
import { useRouter } from "next/navigation";
import {
    collection,
    doc,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { RecordCard } from "@/components/records/RecordCard";

type ReceiptImage = { url: string; path?: string; uploadedAtMs?: number };

type RecordItem = {
    id: string;
    amountCents: number;
    status: "submitted" | "approved" | "flagged";
    category?: string;
    note?: string;
    receiptImages?: ReceiptImage[];
    createdAt?: any;
    createdByLabel?: string | null;
    createdByUserId?: string | null;
};

type Household = {
    id: string;
    name: string;
    currency: "HKD";
    cashCents?: number; // ✅ 手上現金（剩餘）
};

function safeText(s: unknown) {
    return String(s ?? "").trim();
}

function formatNumber(n: number) {
    return (n || 0).toLocaleString("en-HK");
}

function centsToHKD(cents: number) {
    const v = (cents || 0) / 100;
    return v.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** ✅ Ads carousel (3 slides, auto every 5s) */
function AdsCarousel() {
    const ads = [
        {
            title: "優惠位 1",
            desc: "之後可以放合作優惠／贊助",
            bg: "linear-gradient(115deg, rgba(14,165,233,0.14), rgba(148,163,184,0.20))",
        },
        {
            title: "優惠位 2",
            desc: "例如：記帳服務／家務用品折扣",
            bg: "linear-gradient(115deg, rgba(99,102,241,0.14), rgba(148,163,184,0.20))",
        },
        {
            title: "優惠位 3",
            desc: "例如：保險／外傭服務推廣",
            bg: "linear-gradient(115deg, rgba(16,185,129,0.14), rgba(148,163,184,0.20))",
        },
    ];

    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const t = window.setInterval(() => setIdx((p) => (p + 1) % ads.length), 5000);
        return () => window.clearInterval(t);
    }, [ads.length]);

    return (
        <div
            style={{
                marginTop: 12,
                borderRadius: 20,
                border: "1px dashed rgba(15,23,42,0.18)",
                background: "rgba(255,255,255,0.65)",
                boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    width: `${ads.length * 100}%`,
                    transform: `translateX(-${idx * (100 / ads.length)}%)`,
                    transition: "transform 420ms ease",
                }}
            >
                {ads.map((a, i) => (
                    <div
                        key={i}
                        style={{
                            width: `${100 / ads.length}%`,
                            padding: "18px 20px",
                            minHeight: 110,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            flexWrap: "wrap",
                            background: a.bg,
                        }}
                    >
                        <div style={{ fontWeight: 950, color: "var(--text)" }}>
                            <div style={{ fontSize: 14 }}>{a.title}</div>
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                                {a.desc}
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "8px 10px",
                                borderRadius: 999,
                                border: "1px solid rgba(15,23,42,0.12)",
                                background: "rgba(255,255,255,0.85)",
                                fontSize: 12,
                                fontWeight: 900,
                                color: "var(--text)",
                            }}
                        >
                            查看 →
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.7)",
                }}
            >
                {ads.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setIdx(i)}
                        aria-label={`Go to ad ${i + 1}`}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            border: "none",
                            cursor: "pointer",
                            background: i === idx ? "rgba(15,23,42,0.65)" : "rgba(15,23,42,0.18)",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function LoadingCard({ label = "載入中…" }: { label?: string }) {
    return (
        <div
            style={{
                border: "1px solid var(--border)",
                borderRadius: 26,
                background: "var(--card)",
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
                    color: "var(--muted)",
                    border: "1px solid rgba(18,18,18,0.10)",
                    background: "rgba(255,255,255,0.55)",
                    padding: "8px 10px",
                    borderRadius: 999,
                    width: "fit-content",
                }}
            >
                {label}
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            height: 18,
                            borderRadius: 10,
                            background: "rgba(18,18,18,0.06)",
                            overflow: "hidden",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function EmployerOverviewPage() {
    // ✅ NOTE FOR FUTURE ME:
    // Styling should be moved/managed in `app/landing.module.css` (avoid huge inline style blocks here).

    const router = useRouter();

    // ✅ booting：避免 login 後閃一下「未建立家庭」
    const [booting, setBooting] = useState(true);

    const [uid, setUid] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const [plan, setPlan] = useState<"basic" | "pro">("basic");
    const [household, setHousehold] = useState<Household | null>(null);

    const [items, setItems] = useState<RecordItem[]>([]);
    const [msg, setMsg] = useState<string>("");

    // ✅ new household UX
    const [newName, setNewName] = useState("我屋企");
    const [busyCreate, setBusyCreate] = useState(false);

    // ✅ 手上現金（cash）
    const [cashCents, setCashCents] = useState<number>(0);
    const [cashEditing, setCashEditing] = useState(false);
    const [cashDraft, setCashDraft] = useState<string>("0.00");
    const [busyCash, setBusyCash] = useState(false);

    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

    // ✅ 建立家庭（符合 rules：create 只可寫 4 keys）
    async function createHousehold() {
        if (!uid) return;

        const name = safeText(newName) || "我屋企";
        setBusyCreate(true);
        setMsg("");

        const step = (s: string) => setMsg(s);

        try {
            step("建立家庭中…");

            const hRef = doc(collection(db, "households"));

            // 1) create household
            try {
                await setDoc(hRef, {
                    name,
                    currency: "HKD",
                    createdAt: serverTimestamp(),
                    createdByUserId: uid,
                    cashCents: 0,
                    cashUpdatedAt: serverTimestamp(),
                });
            } catch (e: any) {
                console.error("FAILED: create household", e);
                setMsg(`建立家庭失敗（step=household, ${e?.code || "unknown"}）`);
                return;
            }

            // 2) create member (bootstrap)
            step("建立成員中…");
            try {
                await setDoc(doc(db, "households", hRef.id, "members", uid), {
                    role: "employer",
                    createdAt: serverTimestamp(),
                    label: email ? safeText(email) : "僱主",
                });
            } catch (e: any) {
                console.error("FAILED: create member", e);
                setMsg(`建立家庭失敗（step=member, ${e?.code || "unknown"}）`);
                return;
            }

            // 3) write users/{uid}
            step("寫入用戶設定中…");
            try {
                await setDoc(
                    doc(db, "users", uid),
                    { defaultHouseholdId: hRef.id, updatedAt: serverTimestamp() },
                    { merge: true }
                );
            } catch (e: any) {
                console.error("FAILED: write user doc", e);
                setMsg(`建立家庭失敗（step=user, ${e?.code || "unknown"}）`);
                return;
            }

            window.localStorage.setItem("defaultHouseholdId", hRef.id);

            setHousehold({ id: hRef.id, name, currency: "HKD", cashCents: 0 });
            setCashCents(0);
            setCashDraft("0");

            step("建立成功 ✅ 前往邀請…");
            router.push("/e/helpers");
        } finally {
            setBusyCreate(false);
        }
    }

    async function saveCash() {
        const u = auth.currentUser;
        if (!u || !household?.id) return;

        const raw = safeText(cashDraft).replace(/,/g, "");
        const num = Number(raw);

        if (!Number.isFinite(num) || num < 0) {
            setMsg("請輸入有效金額（>= 0）");
            return;
        }

        const nextCents = Math.round(num * 100);

        setBusyCash(true);
        setMsg("");

        try {
            // ✅ 只寫 rules 允許的 keys（cashCents, cashUpdatedAt）
            await updateDoc(doc(db, "households", household.id), {
                cashCents: nextCents,
                cashUpdatedAt: serverTimestamp(),
            });

            setCashCents(nextCents);
            setCashDraft((nextCents / 100).toFixed(2));
            setCashEditing(false);
        } catch (e) {
            console.error(e);
            setMsg("更新『手上現金』失敗（可能係 Firestore rules）。");
        } finally {
            setBusyCash(false);
        }
    }

    // ✅ auth + load user profile + decide household
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setMsg("");

            if (!user) {
                setBooting(false);
                router.replace("/e/login");
                return;
            }

            syncAuthUid(user.uid);
            setUid(user.uid);
            setEmail(user.email || null);

            try {
                const usnap = await getDoc(doc(db, "users", user.uid));
                const u = usnap.exists() ? (usnap.data() as any) : null;

                setPlan(u?.plan === "pro" ? "pro" : "basic");

                const hid =
                    (u?.defaultHouseholdId as string | undefined) ||
                    window.localStorage.getItem("defaultHouseholdId") ||
                    null;

                if (!hid) {
                    setHousehold(null);
                    setBooting(false);
                    return;
                }

                const hsnap = await getDoc(doc(db, "households", hid));
                if (hsnap.exists()) {
                    const h = hsnap.data() as any;
                    const c = typeof h?.cashCents === "number" ? h.cashCents : 0;

                    const hh: Household = {
                        id: hid,
                        name: safeText(h?.name) || "我屋企",
                        currency: "HKD",
                        cashCents: c,
                    };

                    setHousehold(hh);
                    setCashCents(c);
                    setCashDraft((c / 100).toFixed(2));
                } else {
                    setHousehold(null);
                }

                setBooting(false);
            } catch (e) {
                console.error(e);
                setHousehold(null);
                setBooting(false);
                setMsg("載入資料失敗（可能係網絡或 Firestore rules）。");
            }
        });

        return () => unsub();
    }, [router]);

    // ✅ NEW: subscribe household live (cashCents will update immediately)
    useEffect(() => {
        if (!household?.id) return;

        const href = doc(db, "households", household.id);

        return onSnapshot(
            href,
            (snap) => {
                if (!snap.exists()) return;
                const h = snap.data() as any;
                const c = typeof h?.cashCents === "number" ? h.cashCents : 0;

                setHousehold((prev) =>
                    prev ? { ...prev, cashCents: c, name: safeText(h?.name) || prev.name } : prev
                );
                setCashCents(c);

                // 如果用戶正喺 edit cash，就唔好蓋過佢輸入
                if (!cashEditing) setCashDraft((c / 100).toFixed(2));
            },
            (err) => {
                console.error(err);
                setMsg("讀取家庭資料失敗（可能係 Firestore rules）。");
            }
        );
    }, [household?.id, cashEditing]);

    // ✅ subscribe records
    useEffect(() => {
        if (!household?.id) return;

        const qy = query(
            collection(db, "households", household.id, "records"),
            orderBy("createdAt", "desc"),
            limit(120)
        );

        return onSnapshot(
            qy,
            (snap) => {
                const rows: RecordItem[] = snap.docs.map((d) => {
                    const data = d.data() as any;
                    return {
                        id: d.id,
                        amountCents: data.amountCents ?? 0,
                        status: data.status ?? "submitted",
                        category: data.category ?? "其他",
                        note: data.note ?? "",
                        receiptImages: data.receiptImages ?? [],
                        createdAt: data.createdAt,
                        createdByUserId: data.createdByUserId ?? null,
                        createdByLabel: data.createdByLabel ?? null,
                    };
                });
                setItems(rows);
            },
            (err) => {
                console.error(err);
                setMsg("讀取記錄失敗（可能係 Firestore rules）。");
            }
        );
    }, [household?.id]);

    const pending = useMemo(() => items.filter((x) => x.status === "submitted").slice(0, 5), [items]);
    const flagged = useMemo(() => items.filter((x) => x.status === "flagged").slice(0, 5), [items]);

    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const todayStr = now.toDateString();

        let monthTotal = 0;
        let todayTotal = 0;

        items.forEach((it) => {
            const amt = (it.amountCents || 0) / 100;
            const d = it.createdAt?.toDate?.();
            if (d) {
                if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) monthTotal += amt;
                if (d.toDateString() === todayStr) todayTotal += amt;
            }
        });

        return { monthTotal, todayTotal };
    }, [items]);

    // ✅ boot loading (避免 flicker)
    if (booting) {
        return (
            <AppShell role="employer" title="總覽">
                <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
                    <LoadingCard label="正在載入…" />
                </main>
            </AppShell>
        );
    }

    // ✅ 新用戶：直接建立家庭（更好 UX）
    if (!household) {
        return (
            <AppShell role="employer" title="總覽">
                <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
                    <div
                        style={{
                            border: "1px solid var(--border)",
                            borderRadius: 26,
                            background: "var(--card)",
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
                                color: "var(--muted)",
                                border: "1px solid rgba(18,18,18,0.10)",
                                background: "rgba(255,255,255,0.55)",
                                padding: "8px 10px",
                                borderRadius: 999,
                                width: "fit-content",
                            }}
                        >
                            第一次使用
                        </div>

                        <h1
                            style={{
                                margin: "12px 0 0",
                                fontSize: 28,
                                lineHeight: 1.15,
                                letterSpacing: -0.6,
                                fontWeight: 1200,
                                color: "var(--text)",
                            }}
                        >
                            建立家庭
                        </h1>

                        <p
                            style={{
                                marginTop: 10,
                                color: "var(--muted)",
                                fontWeight: 900,
                                lineHeight: 1.7,
                                maxWidth: "52ch",
                            }}
                        >
                            輸入家庭名稱，建立後就可以邀請姐姐加入。
                        </p>

                        <div style={{ marginTop: 14 }}>
                            <div style={{ fontWeight: 950, color: "var(--text)", marginBottom: 8 }}>家庭名稱</div>
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="例如：張生家庭"
                                style={{
                                    width: "100%",
                                    padding: 14,
                                    borderRadius: 16,
                                    border: "1px solid rgba(18,18,18,0.12)",
                                    background: "rgba(255,255,255,0.9)",
                                    fontSize: 16,
                                    fontWeight: 900,
                                    outline: "none",
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            disabled={busyCreate}
                            onClick={createHousehold}
                            style={{
                                marginTop: 12,
                                width: "100%",
                                padding: 14,
                                borderRadius: 16,
                                border: "1px solid rgba(18,18,18,0.10)",
                                background: "var(--brand-green)",
                                color: "white",
                                fontWeight: 1100,
                                cursor: busyCreate ? "not-allowed" : "pointer",
                                boxShadow: "0 14px 30px rgba(18,18,18,0.12)",
                            }}
                        >
                            {busyCreate ? "建立中…" : "建立並前往邀請"}
                        </button>

                        {msg ? (
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: 12,
                                    borderRadius: 16,
                                    border: "1px solid rgba(239,68,68,0.22)",
                                    background: "rgba(239,68,68,0.08)",
                                    color: "#991B1B",
                                    fontWeight: 1000,
                                    lineHeight: 1.6,
                                }}
                            >
                                {msg}
                            </div>
                        ) : null}
                    </div>
                </main>
            </AppShell>
        );
    }

    // ✅ Plan badge colors
    const planBadgeStyle =
        plan === "pro"
            ? {
                background: "rgba(16,185,129,0.16)",
                color: "#065F46",
                border: "1px solid rgba(16,185,129,0.24)",
                boxShadow: "0 10px 18px rgba(16,185,129,0.10)",
            }
            : {
                background: "rgba(37,99,235,0.10)",
                color: "#1E3A8A",
                border: "1px solid rgba(37,99,235,0.18)",
                boxShadow: "none",
            };

    return (
        <AppShell role="employer" title="總覽">
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        {/* ✅ 只顯示家庭名 */}
                        <h1
                            style={{
                                margin: 0,
                                fontSize: 26,
                                fontWeight: 1100,
                                color: "var(--text)",
                                letterSpacing: -0.4,
                                lineHeight: 1.1,
                            }}
                        >
                            {household.name}
                        </h1>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>總覽</div>
                    </div>

                    {/* ✅ 只保留 plan badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                            style={{
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 1000,
                                letterSpacing: 0.2,
                                ...planBadgeStyle,
                            }}
                        >
                            {plan === "pro" ? "Pro" : "Basic"}
                        </span>
                    </div>
                </div>

                {/* ✅ 手上現金 */}
                <div
                    style={{
                        marginTop: 12,
                        border: "1px solid var(--border)",
                        borderRadius: 18,
                        background: "var(--card)",
                        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: 14,
                            borderBottom: "1px solid var(--border)",
                            background: "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.02))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 1000, color: "var(--text)" }}>手上現金</div>
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                                記低姐姐手上仲有幾多錢，方便提醒你幾時要再入錢
                            </div>
                        </div>

                        {!cashEditing ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setMsg("");
                                    setCashDraft((cashCents / 100).toFixed(2));
                                    setCashEditing(true);
                                }}
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: 999,
                                    border: "1px solid rgba(15,23,42,0.12)",
                                    background: "rgba(255,255,255,0.9)",
                                    fontWeight: 1000,
                                    cursor: "pointer",
                                }}
                            >
                                ✏️ 編輯
                            </button>
                        ) : null}
                    </div>

                    <div style={{ padding: 14 }}>
                        {!cashEditing ? (
                            <div style={{ fontSize: 22, fontWeight: 1100, color: "var(--text)" }}>
                                HK$ {centsToHKD(cashCents)}
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 950, color: "var(--muted)" }}>更新金額（HK$）</div>

                                <input
                                    value={cashDraft}
                                    onChange={(e) => setCashDraft(e.target.value)}
                                    inputMode="decimal"
                                    placeholder="例如：2000"
                                    style={{
                                        width: "100%",
                                        padding: 14,
                                        borderRadius: 16,
                                        border: "1px solid rgba(18,18,18,0.12)",
                                        background: "rgba(255,255,255,0.9)",
                                        fontSize: 16,
                                        fontWeight: 950,
                                        outline: "none",
                                    }}
                                />

                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        disabled={busyCash}
                                        onClick={saveCash}
                                        style={{
                                            flex: "1 1 160px",
                                            padding: 14,
                                            borderRadius: 16,
                                            border: "1px solid rgba(18,18,18,0.10)",
                                            background: "var(--brand-green)",
                                            color: "white",
                                            fontWeight: 1100,
                                            cursor: busyCash ? "not-allowed" : "pointer",
                                            boxShadow: "0 14px 30px rgba(18,18,18,0.12)",
                                        }}
                                    >
                                        {busyCash ? "儲存中…" : "儲存"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCashDraft((cashCents / 100).toFixed(2));
                                            setCashEditing(false);
                                        }}
                                        style={{
                                            flex: "1 1 160px",
                                            padding: 14,
                                            borderRadius: 16,
                                            border: "1px solid rgba(18,18,18,0.12)",
                                            background: "rgba(255,255,255,0.85)",
                                            color: "var(--text)",
                                            fontWeight: 1100,
                                            cursor: "pointer",
                                        }}
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats cards */}
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    {[
                        {
                            label: "本月總支出",
                            value: `HK$ ${stats.monthTotal.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        },
                        {
                            label: "今日支出",
                            value: `HK$ ${stats.todayTotal.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        },
                    ].map((x) => (
                        <div
                            key={x.label}
                            style={{
                                border: "1px solid var(--border)",
                                borderRadius: 18,
                                background: "var(--card)",
                                padding: 14,
                                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
                            }}
                        >
                            <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>{x.label}</div>
                            <div style={{ marginTop: 8, fontSize: 18, fontWeight: 950, color: "var(--text)" }}>{x.value}</div>
                        </div>
                    ))}
                </div>

                <AdsCarousel />

                {/* Pending */}
                <div
                    style={{
                        marginTop: 12,
                        border: "1px solid var(--border)",
                        borderRadius: 18,
                        background: "var(--card)",
                        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: 14,
                            background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.02))",
                            borderBottom: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 950, color: "var(--text)" }}>待批</div>
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>點入記錄詳情處理</div>
                        </div>
                        <div
                            aria-label={`待批數量 ${pending.length}`}
                            style={{
                                minWidth: 34,
                                height: 28,
                                borderRadius: 999,
                                background: "rgba(245,158,11,0.2)",
                                color: "#92400E",
                                fontWeight: 950,
                                fontSize: 12,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 10px",
                            }}
                        >
                            {formatNumber(pending.length)}
                        </div>
                    </div>

                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        {pending.length === 0 ? (
                            <div style={{ color: "var(--muted)", fontWeight: 900 }}>暫時冇待批 ✅</div>
                        ) : (
                            pending.map((it) => (
                                <RecordCard
                                    key={it.id}
                                    item={it}
                                    photoCountPlacement="thumbnail"
                                    onClick={() => router.push(`/e/records/${it.id}`)}
                                    onPreviewClick={(clickedUrl) => {
                                        const images = (it.receiptImages || []).map((x) => x.url).filter(Boolean);
                                        if (!images.length) return;
                                        const index = Math.max(0, images.indexOf(clickedUrl));
                                        setLightbox({ images, index });
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Flagged */}
                <div
                    style={{
                        marginTop: 12,
                        border: "1px solid var(--border)",
                        borderRadius: 18,
                        background: "var(--card)",
                        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: 14,
                            borderBottom: "1px solid var(--border)",
                            background: "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(239,68,68,0.02))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 950, color: "var(--text)" }}>需跟進</div>
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>點入記錄詳情處理</div>
                        </div>
                        <div
                            aria-label={`需跟進數量 ${flagged.length}`}
                            style={{
                                minWidth: 34,
                                height: 28,
                                borderRadius: 999,
                                background: "rgba(239,68,68,0.2)",
                                color: "#991B1B",
                                fontWeight: 950,
                                fontSize: 12,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 10px",
                            }}
                        >
                            {formatNumber(flagged.length)}
                        </div>
                    </div>

                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        {flagged.length === 0 ? (
                            <div style={{ color: "var(--muted)", fontWeight: 900 }}>暫時冇需跟進 ✅</div>
                        ) : (
                            flagged.map((it) => (
                                <RecordCard
                                    key={it.id}
                                    item={it}
                                    photoCountPlacement="thumbnail"
                                    onClick={() => router.push(`/e/records/${it.id}`)}
                                    onPreviewClick={(clickedUrl) => {
                                        const images = (it.receiptImages || []).map((x) => x.url).filter(Boolean);
                                        if (!images.length) return;
                                        const index = Math.max(0, images.indexOf(clickedUrl));
                                        setLightbox({ images, index });
                                    }}
                                />
                            ))
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
                            color: "crimson",
                            fontWeight: 950,
                        }}
                    >
                        {msg}
                    </div>
                ) : null}

                {/* Lightbox */}
                {lightbox ? (
                    <div
                        onClick={() => setLightbox(null)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.72)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 16,
                            zIndex: 60,
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: "min(980px, 96vw)",
                                background: "white",
                                borderRadius: 16,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: 10,
                                    borderBottom: "1px solid #eee",
                                    gap: 10,
                                }}
                            >
                                <div style={{ fontWeight: 950 }}>
                                    收據（{lightbox.index + 1}/{lightbox.images.length}）
                                </div>
                                <button
                                    onClick={() => setLightbox(null)}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: 10,
                                        padding: "6px 10px",
                                        background: "white",
                                        fontWeight: 950,
                                        cursor: "pointer",
                                    }}
                                >
                                    關閉
                                </button>
                            </div>

                            <div style={{ background: "#fff" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={lightbox.images[lightbox.index]}
                                    alt="receipt large"
                                    style={{ width: "100%", height: "auto", display: "block" }}
                                />
                            </div>

                            {lightbox.images.length > 1 ? (
                                <div style={{ padding: 10, borderTop: "1px solid #eee", display: "flex", gap: 10, overflowX: "auto" }}>
                                    {lightbox.images.map((u, i) => (
                                        <button
                                            key={u + i}
                                            type="button"
                                            onClick={() => setLightbox((p) => (p ? { ...p, index: i } : p))}
                                            style={{
                                                border: i === lightbox.index ? "2px solid rgba(15,23,42,0.55)" : "1px solid rgba(15,23,42,0.16)",
                                                borderRadius: 12,
                                                padding: 0,
                                                overflow: "hidden",
                                                width: 88,
                                                height: 66,
                                                background: "white",
                                                cursor: "pointer",
                                                flex: "0 0 auto",
                                            }}
                                            aria-label={`Open image ${i + 1}`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={u} alt={`thumb ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </main>
        </AppShell>
    );
}