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
import { useI18n } from "@/components/i18n/LangProvider";

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

function formatNumber(n: number, locale: string) {
    return (n || 0).toLocaleString(locale);
}

function centsToMoney(cents: number, locale: string) {
    const v = (cents || 0) / 100;
    return v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function localeFromLang(lang: string) {
    // 你要更精準都得：id-ID / zh-HK / en-HK
    if (lang === "id") return "id-ID";
    if (lang === "en") return "en-HK";
    return "zh-HK";
}

/** ✅ Ads carousel (3 slides, auto every 5s) */
function AdsCarousel({ t }: { t: (k: string) => string }) {
    const ads = [
        {
            title: t("overview.ads.1.title"),
            desc: t("overview.ads.1.desc"),
            cta: t("overview.ads.cta"),
            bg: "linear-gradient(115deg, rgba(14,165,233,0.14), rgba(148,163,184,0.20))",
        },
        {
            title: t("overview.ads.2.title"),
            desc: t("overview.ads.2.desc"),
            cta: t("overview.ads.cta"),
            bg: "linear-gradient(115deg, rgba(99,102,241,0.14), rgba(148,163,184,0.20))",
        },
        {
            title: t("overview.ads.3.title"),
            desc: t("overview.ads.3.desc"),
            cta: t("overview.ads.cta"),
            bg: "linear-gradient(115deg, rgba(16,185,129,0.14), rgba(148,163,184,0.20))",
        },
    ];

    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => setIdx((p) => (p + 1) % ads.length), 5000);
        return () => window.clearInterval(timer);
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
                            {a.cta}
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
                        aria-label={t("overview.ads.dotAria").replace("{n}", String(i + 1))}
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

function LoadingCard({ label }: { label: string }) {
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
    const router = useRouter();
    const { t, lang } = useI18n();
    const locale = localeFromLang(lang);

    // ✅ booting：避免 login 後閃一下「未建立家庭」
    const [booting, setBooting] = useState(true);

    const [uid, setUid] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const [plan, setPlan] = useState<"basic" | "pro">("basic");
    const [household, setHousehold] = useState<Household | null>(null);

    const [items, setItems] = useState<RecordItem[]>([]);
    const [msg, setMsg] = useState<string>("");

    // ✅ new household UX
    const [newName, setNewName] = useState(t("settings.household.defaultName") || "我屋企");
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

        const name = safeText(newName) || (t("settings.household.defaultName") || "我屋企");
        setBusyCreate(true);
        setMsg("");

        const step = (s: string) => setMsg(s);

        try {
            step(t("overview.create.step.household"));

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
                setMsg(t("overview.create.fail.household").replace("{code}", e?.code || "unknown"));
                return;
            }

            // 2) create member (bootstrap)
            step(t("overview.create.step.member"));
            try {
                await setDoc(doc(db, "households", hRef.id, "members", uid), {
                    role: "employer",
                    createdAt: serverTimestamp(),
                    label: email ? safeText(email) : t("overview.create.employerLabel"),
                });
            } catch (e: any) {
                console.error("FAILED: create member", e);
                setMsg(t("overview.create.fail.member").replace("{code}", e?.code || "unknown"));
                return;
            }

            // 3) write users/{uid}
            step(t("overview.create.step.user"));
            try {
                await setDoc(
                    doc(db, "users", uid),
                    { defaultHouseholdId: hRef.id, updatedAt: serverTimestamp() },
                    { merge: true }
                );
            } catch (e: any) {
                console.error("FAILED: write user doc", e);
                setMsg(t("overview.create.fail.user").replace("{code}", e?.code || "unknown"));
                return;
            }

            window.localStorage.setItem("defaultHouseholdId", hRef.id);

            setHousehold({ id: hRef.id, name, currency: "HKD", cashCents: 0 });
            setCashCents(0);
            setCashDraft("0");

            step(t("overview.create.successGoInvite"));
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
            setMsg(t("overview.cash.invalid"));
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
            setMsg(t("overview.cash.updateFail"));
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
                        name: safeText(h?.name) || (t("settings.household.defaultName") || "我屋企"),
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
                setMsg(t("overview.loadFail"));
            }
        });

        return () => unsub();
    }, [router, t]);

    // ✅ subscribe household live (cashCents will update immediately)
    useEffect(() => {
        if (!household?.id) return;

        const href = doc(db, "households", household.id);

        return onSnapshot(
            href,
            (snap) => {
                if (!snap.exists()) return;
                const h = snap.data() as any;
                const c = typeof h?.cashCents === "number" ? h.cashCents : 0;

                setHousehold((prev) => (prev ? { ...prev, cashCents: c, name: safeText(h?.name) || prev.name } : prev));
                setCashCents(c);

                // 如果用戶正喺 edit cash，就唔好蓋過佢輸入
                if (!cashEditing) setCashDraft((c / 100).toFixed(2));
            },
            (err) => {
                console.error(err);
                setMsg(t("overview.householdSubFail"));
            }
        );
    }, [household?.id, cashEditing, t]);

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
                setMsg(t("overview.recordsFail"));
            }
        );
    }, [household?.id, t]);

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
            <AppShell role="employer" title={t("title.employer.overview")}>
                <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
                    <LoadingCard label={t("overview.loading")} />
                </main>
            </AppShell>
        );
    }

    // ✅ 新用戶：直接建立家庭（更好 UX）
    if (!household) {
        return (
            <AppShell role="employer" title={t("title.employer.overview")}>
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
                            {t("overview.firstTime")}
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
                            {t("overview.create.title")}
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
                            {t("overview.create.desc")}
                        </p>

                        <div style={{ marginTop: 14 }}>
                            <div style={{ fontWeight: 950, color: "var(--text)", marginBottom: 8 }}>
                                {t("settings.household.name")}
                            </div>
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t("overview.create.placeholder")}
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
                            {busyCreate ? t("overview.create.busy") : t("overview.create.cta")}
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
        <AppShell role="employer" title={t("title.employer.overview")}>
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
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                            {t("nav.overview")}
                        </div>
                    </div>

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
                            {plan === "pro" ? t("settings.plan.pro") : t("settings.plan.basic")}
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
                            <div style={{ fontWeight: 1000, color: "var(--text)" }}>{t("overview.cash.title")}</div>
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                                {t("overview.cash.desc")}
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
                                {t("overview.cash.edit")}
                            </button>
                        ) : null}
                    </div>

                    <div style={{ padding: 14 }}>
                        {!cashEditing ? (
                            <div style={{ fontSize: 22, fontWeight: 1100, color: "var(--text)" }}>
                                {t("overview.currencyPrefix")} {centsToMoney(cashCents, locale)}
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 950, color: "var(--muted)" }}>
                                    {t("overview.cash.inputLabel")}
                                </div>

                                <input
                                    value={cashDraft}
                                    onChange={(e) => setCashDraft(e.target.value)}
                                    inputMode="decimal"
                                    placeholder={t("overview.cash.placeholder")}
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
                                        {busyCash ? t("common.saving") : t("common.save")}
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
                                        {t("common.cancel")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats cards */}
                <div
                    style={{
                        marginTop: 12,
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 10,
                    }}
                >
                    {[
                        {
                            label: t("overview.stats.month"),
                            value: `${t("overview.currencyPrefix")} ${stats.monthTotal.toLocaleString(locale, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}`,
                        },
                        {
                            label: t("overview.stats.today"),
                            value: `${t("overview.currencyPrefix")} ${stats.todayTotal.toLocaleString(locale, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}`,
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

                <AdsCarousel t={t} />

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
                            <div style={{ fontWeight: 950, color: "var(--text)" }}>{t("overview.pending.title")}</div>
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                                {t("overview.pending.sub")}
                            </div>
                        </div>
                        <div
                            aria-label={t("overview.pending.aria").replace("{n}", String(pending.length))}
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
                            {formatNumber(pending.length, locale)}
                        </div>
                    </div>

                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        {pending.length === 0 ? (
                            <div style={{ color: "var(--muted)", fontWeight: 900 }}>{t("overview.pending.empty")}</div>
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
                            <div style={{ fontWeight: 950, color: "var(--text)" }}>{t("overview.flagged.title")}</div>
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                                {t("overview.flagged.sub")}
                            </div>
                        </div>
                        <div
                            aria-label={t("overview.flagged.aria").replace("{n}", String(flagged.length))}
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
                            {formatNumber(flagged.length, locale)}
                        </div>
                    </div>

                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        {flagged.length === 0 ? (
                            <div style={{ color: "var(--muted)", fontWeight: 900 }}>{t("overview.flagged.empty")}</div>
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
                                    {t("overview.lightbox.title")
                                        .replace("{i}", String(lightbox.index + 1))
                                        .replace("{n}", String(lightbox.images.length))}
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
                                    {t("common.close")}
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
                                            aria-label={t("overview.lightbox.thumbAria").replace("{n}", String(i + 1))}
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