"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
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

type Household = { id: string; name: string; currency: "HKD" };

function safeText(s: unknown) {
    return String(s ?? "").trim();
}

function centsToHKD(cents: number) {
    const v = (cents || 0) / 100;
    return v.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(n: number) {
    return (n || 0).toLocaleString("en-HK");
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
        const t = window.setInterval(() => {
            setIdx((p) => (p + 1) % ads.length);
        }, 5000);
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
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>{a.desc}</div>
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

            {/* dots */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "10px 12px", background: "rgba(255,255,255,0.7)" }}>
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

export default function EmployerOverviewPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const [plan, setPlan] = useState<"basic" | "pro">("basic");
    const [household, setHousehold] = useState<Household | null>(null);

    const [items, setItems] = useState<RecordItem[]>([]);
    const [msg, setMsg] = useState<string>("");

    // ✅ lightbox: all images
    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setLoading(false);

            if (!user) {
                router.replace("/e/login");
                return;
            }

            setUid(user.uid);
            setEmail(user.email);
            setMsg("");

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
                    return;
                }

                try {
                    const hsnap = await getDoc(doc(db, "households", hid));
                    if (hsnap.exists()) {
                        const h = hsnap.data() as any;
                        setHousehold({
                            id: hid,
                            name: safeText(h?.name) || "我屋企",
                            currency: "HKD",
                        });
                    } else {
                        setHousehold({ id: hid, name: "我屋企", currency: "HKD" });
                    }
                } catch {
                    setHousehold({ id: hid, name: "我屋企", currency: "HKD" });
                }
            } catch (e) {
                console.error(e);
                setHousehold(null);
                setMsg("載入資料失敗（可能係網絡或 Firestore rules）。");
            }
        });

        return () => unsub();
    }, [router]);

    useEffect(() => {
        if (!household?.id) return;

        const q = query(collection(db, "households", household.id, "records"), orderBy("createdAt", "desc"), limit(120));

        return onSnapshot(
            q,
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
        let pendingCount = 0;

        items.forEach((it) => {
            const amt = (it.amountCents || 0) / 100;
            const d = it.createdAt?.toDate?.();

            if (d) {
                if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) monthTotal += amt;
                if (d.toDateString() === todayStr) todayTotal += amt;
            }
            if (it.status === "submitted") pendingCount += 1;
        });

        return { monthTotal, todayTotal, pendingCount };
    }, [items]);

    if (loading) {
        return (
            <AppShell role="employer" title="總覽">
                <main style={{ padding: 16, maxWidth: 860, margin: "0 auto" }}>
                    <div style={{ color: "var(--text)", fontWeight: 900 }}>載入中…</div>
                </main>
            </AppShell>
        );
    }

    if (!household) {
        return (
            <AppShell role="employer" title="總覽">
                <main style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
                    <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 18 }}>未建立家庭</div>
                    <div style={{ marginTop: 8, color: "var(--muted)", fontWeight: 800, lineHeight: 1.5 }}>
                        你需要先建立一個家庭，之後先可以邀請姐姐加入及查看記錄。
                    </div>

                    <div style={{ marginTop: 14, border: "1px solid var(--border)", borderRadius: 18, background: "var(--card)", padding: 14 }}>
                        <div style={{ fontWeight: 900, color: "var(--text)" }}>下一步</div>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontWeight: 800 }}>
                            去「設定」或「姐姐」頁都會引導你建立家庭。
                        </div>

                        <button
                            onClick={() => router.push("/e/settings")}
                            style={{
                                marginTop: 12,
                                width: "100%",
                                padding: 14,
                                borderRadius: 16,
                                border: "none",
                                background: "#111",
                                color: "white",
                                fontWeight: 900,
                                cursor: "pointer",
                            }}
                        >
                            去設定
                        </button>
                    </div>

                    {msg ? (
                        <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", color: "crimson", fontWeight: 900 }}>
                            {msg}
                        </div>
                    ) : null}
                </main>
            </AppShell>
        );
    }

    const profileInitial = (email || "U").trim().charAt(0).toUpperCase() || "U";

    return (
        <AppShell role="employer" title="總覽">
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 950, color: "var(--text)" }}>總覽</h1>

                        <button
                            type="button"
                            onClick={() => { }}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 8,
                                padding: "6px 10px",
                                borderRadius: 999,
                                border: "1px solid rgba(15,23,42,0.12)",
                                background: "rgba(255,255,255,0.9)",
                                fontSize: 13,
                                fontWeight: 900,
                                color: "var(--text)",
                                cursor: "pointer",
                                boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
                            }}
                            aria-label="切換家庭"
                        >
                            家庭 · {household.name}
                            <span style={{ fontSize: 14, color: "var(--muted)" }}>⇅</span>
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                        <span
                            style={{
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 950,
                                letterSpacing: 0.2,
                                background: plan === "pro" ? "#0F172A" : "rgba(15,23,42,0.06)",
                                color: plan === "pro" ? "white" : "#0F172A",
                                border: "1px solid rgba(15,23,42,0.12)",
                                boxShadow: plan === "pro" ? "0 10px 20px rgba(15, 23, 42, 0.18)" : "none",
                            }}
                        >
                            {plan === "pro" ? "Pro Plan" : "Basic Plan"}
                        </span>

                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 999,
                                background: "rgba(15,23,42,0.08)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 950,
                                color: "var(--text)",
                            }}
                            aria-label="profile"
                            title={email || ""}
                        >
                            {profileInitial}
                        </div>
                    </div>
                </div>

                {/* Stats cards */}
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    {[
                        { label: "本月總支出", value: `HK$ ${stats.monthTotal.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { label: "今日支出", value: `HK$ ${stats.todayTotal.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
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

                {/* ✅ Ads rotation (back) */}
                <AdsCarousel />

                {/* Pending (no action buttons) */}
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
                                    photoCountPlacement="thumbnail" // ✅ 多相 badge 入縮圖
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

                {/* Flagged (no action buttons) */}
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
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", color: "crimson", fontWeight: 950 }}>
                        {msg}
                    </div>
                ) : null}

                {/* ✅ Lightbox: show ALL photos */}
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

                            {/* main image */}
                            <div style={{ background: "#fff" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={lightbox.images[lightbox.index]}
                                    alt="receipt large"
                                    style={{ width: "100%", height: "auto", display: "block" }}
                                />
                            </div>

                            {/* thumbnails list */}
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