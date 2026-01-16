"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { syncAuthUid } from "@/lib/localAuth";
import { useRouter } from "next/navigation";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
    QueryDocumentSnapshot,
    DocumentData,
} from "firebase/firestore";

import { RecordList, type RecordListItem } from "@/components/records/RecordList";
import type { ReceiptImage } from "@/components/records/RecordCard";
import { saveReturnToCurrentPage, restoreScrollOnce } from "@/lib/returnTo";
import { useI18n } from "@/components/i18n/LangProvider";

type RecordItem = {
    id: string;
    amountCents: number;
    status: "submitted" | "approved" | "flagged";
    category?: string;
    note?: string;
    receiptImages?: ReceiptImage[];
    createdAt?: any;
    createdByUserId?: string | null;
};

const PAGE_SIZE = 10;

function centsToMoney(cents: number, locale: string) {
    const v = (cents || 0) / 100;
    return v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function localeFromLang(lang: string) {
    if (lang === "id") return "id-ID";
    if (lang === "en") return "en-HK";
    return "zh-HK";
}

export default function HelperRecordsPage() {
    const router = useRouter();
    const { t, lang } = useI18n();
    const locale = localeFromLang(lang);

    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [uid, setUid] = useState<string | null>(null);

    const [items, setItems] = useState<RecordItem[]>([]);
    const [msg, setMsg] = useState("");

    const [loadingFirst, setLoadingFirst] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // 必須用戶真係捲過，先 allow load more
    const hasUserScrolledRef = useRef(false);

    // coming back from detail => restore scroll
    useEffect(() => {
        restoreScrollOnce();
    }, []);

    useEffect(() => {
        function onScroll() {
            if (window.scrollY > 0) hasUserScrolledRef.current = true;
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // 1) auth + householdId
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.replace("/h/login");
                return;
            }

            syncAuthUid(user.uid);
            setUid(user.uid);

            const hid = window.localStorage.getItem("helperHouseholdId");
            if (!hid) {
                setHouseholdId(null);
                setMsg(t("hRecords.noHousehold"));
                setLoadingFirst(false);
                return;
            }

            setHouseholdId(hid);

            // optional validate
            try {
                await getDoc(doc(db, "households", hid, "members", user.uid));
            } catch {
                // ignore
            }
        });

        return () => unsub();
    }, [router, t]);

    async function loadFirst(hid: string, userId: string) {
        setMsg("");
        setLoadingFirst(true);
        setHasMore(true);
        lastDocRef.current = null;

        try {
            const q1 = query(
                collection(db, "households", hid, "records"),
                where("createdByUserId", "==", userId),
                orderBy("createdAt", "desc"),
                limit(PAGE_SIZE)
            );

            const snap = await getDocs(q1);

            const rows: RecordItem[] = snap.docs.map((d) => {
                const data = d.data() as any;
                return {
                    id: d.id,
                    amountCents: data.amountCents ?? 0,
                    status: data.status ?? "submitted",
                    category: data.category ?? t("records.category.other"),
                    note: data.note ?? "",
                    receiptImages: data.receiptImages ?? [],
                    createdAt: data.createdAt,
                    createdByUserId: data.createdByUserId ?? null,
                };
            });

            setItems(rows);

            if (snap.docs.length > 0) lastDocRef.current = snap.docs[snap.docs.length - 1];
            setHasMore(snap.docs.length === PAGE_SIZE);
        } catch (e) {
            console.error(e);
            setMsg(t("hRecords.loadFail"));
            setHasMore(false);
        } finally {
            setLoadingFirst(false);
        }
    }

    // 2) first load
    useEffect(() => {
        if (!householdId || !uid) return;
        loadFirst(householdId, uid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [householdId, uid]);

    async function loadMore(hid: string, userId: string) {
        if (!hasMore || loadingMore) return;

        const last = lastDocRef.current;
        if (!last) {
            setHasMore(false);
            return;
        }

        setLoadingMore(true);
        setMsg("");

        try {
            const q2 = query(
                collection(db, "households", hid, "records"),
                where("createdByUserId", "==", userId),
                orderBy("createdAt", "desc"),
                startAfter(last),
                limit(PAGE_SIZE)
            );

            const snap = await getDocs(q2);

            const rows: RecordItem[] = snap.docs.map((d) => {
                const data = d.data() as any;
                return {
                    id: d.id,
                    amountCents: data.amountCents ?? 0,
                    status: data.status ?? "submitted",
                    category: data.category ?? t("records.category.other"),
                    note: data.note ?? "",
                    receiptImages: data.receiptImages ?? [],
                    createdAt: data.createdAt,
                    createdByUserId: data.createdByUserId ?? null,
                };
            });

            setItems((prev) => {
                const existing = new Set(prev.map((x) => x.id));
                const merged = [...prev];
                for (const r of rows) if (!existing.has(r.id)) merged.push(r);
                return merged;
            });

            if (snap.docs.length > 0) lastDocRef.current = snap.docs[snap.docs.length - 1];
            setHasMore(snap.docs.length === PAGE_SIZE);
        } catch (e) {
            console.error(e);
            setMsg(t("hRecords.loadMoreFail"));
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    }

    // 3) intersection observer
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        const io = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (!first?.isIntersecting) return;
                if (!hasUserScrolledRef.current) return;
                if (!householdId || !uid) return;
                loadMore(householdId, uid);
            },
            { root: null, rootMargin: "120px", threshold: 0 }
        );

        io.observe(el);
        return () => io.disconnect();
    }, [householdId, uid, hasMore, loadingMore]);

    const listItems: RecordListItem[] = useMemo(
        () =>
            items.map((it) => ({
                id: it.id,
                amountCents: it.amountCents,
                status: it.status,
                category: it.category,
                note: it.note,
                receiptImages: it.receiptImages,
                createdAt: it.createdAt,
            })),
        [items]
    );

    return (
        <AppShell role="helper" title={t("title.helper.records")}>
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: "var(--text)" }}>
                            {t("title.helper.records")}
                        </h1>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                            {t("hRecords.hint").replace("{n}", String(PAGE_SIZE))}
                        </div>
                    </div>
                </div>

                {msg ? (
                    <div
                        style={{
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 14,
                            border: "1px solid rgba(239,68,68,0.25)",
                            background: "rgba(239,68,68,0.06)",
                            color: "#991B1B",
                            fontWeight: 900,
                        }}
                    >
                        {msg}
                    </div>
                ) : null}

                {loadingFirst ? (
                    <div style={{ marginTop: 14, color: "var(--muted)", fontWeight: 900 }}>
                        {t("common.loading")}
                    </div>
                ) : (
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                        <RecordList
                            items={listItems}
                            dayRightSlot={(_dateKey, rows) => {
                                const totalCents = rows.reduce((s, r) => s + (r.amountCents || 0), 0);
                                return `${t("records.totalPrefix")} ${centsToMoney(totalCents, locale)}`;
                            }}
                            onItemClick={(id) => {
                                saveReturnToCurrentPage();
                                router.push(`/h/records/${id}`);
                            }}
                        />

                        <div ref={sentinelRef} style={{ height: 1 }} />

                        {loadingMore ? (
                            <div style={{ padding: "10px 2px", color: "var(--muted)", fontWeight: 900 }}>
                                {t("common.loadingMore")}
                            </div>
                        ) : hasMore ? (
                            <div style={{ padding: "10px 2px", color: "rgba(15,23,42,0.45)", fontWeight: 900 }}>
                                {t("common.scrollToLoad")}
                            </div>
                        ) : items.length > 0 ? (
                            <div style={{ padding: "10px 2px", color: "rgba(15,23,42,0.45)", fontWeight: 900 }}>
                                {t("common.reachedEnd")}
                            </div>
                        ) : (
                            <div style={{ padding: "10px 2px", color: "rgba(15,23,42,0.55)", fontWeight: 900 }}>
                                {t("hRecords.empty")}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </AppShell>
    );
}