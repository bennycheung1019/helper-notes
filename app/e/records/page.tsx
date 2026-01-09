"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
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

import Button from "@/components/ui/Button";
import { RecordList, RecordListItem } from "@/components/records/RecordList";
import { saveReturnToCurrentPage, restoreScrollOnce } from "@/lib/returnTo";

type ReceiptImage = { url: string; path?: string; uploadedAtMs?: number };

type RecordItem = {
    id: string;
    amountCents: number;
    status: "submitted" | "approved" | "flagged";
    category?: string;
    note?: string;
    receiptImages?: ReceiptImage[];
    createdAt?: any;
    createdByUserId?: string | null;
    createdByLabel?: string | null;
};

const PAGE_SIZE = 10;

// ✅ optional: remember panel open state for nicer UX
const UI_STATE_KEY = "__e_records_ui_state";

function pad2(n: number) {
    return String(n).padStart(2, "0");
}
function formatDateYYYYMMDD(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function csvEscape(val: unknown) {
    if (val === null || val === undefined) return "";
    const s = String(val);
    const escaped = s.replace(/"/g, '""');
    if (/[",\n\r]/.test(escaped)) return `"${escaped}"`;
    return escaped;
}
function downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function Icon({ name }: { name: "filter" | "download" }) {
    const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" as const };
    if (name === "filter") {
        return (
            <svg {...common} aria-hidden="true">
                <path
                    d="M3 5h18l-7 8v5l-4 2v-7L3 5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
    return (
        <svg {...common} aria-hidden="true">
            <path
                d="M12 3v10m0 0 4-4m-4 4-4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

function IconButton({
    title,
    icon,
    onClick,
    active,
    dot,
}: {
    title: string;
    icon: "filter" | "download";
    onClick: () => void;
    active?: boolean;
    dot?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border: "1px solid rgba(15,23,42,0.12)",
                background: active ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.9)",
                boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 950,
                color: "var(--text)",
                position: "relative",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <Icon name={icon} />
            {dot ? (
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "#EF4444",
                        boxShadow: "0 8px 16px rgba(239,68,68,0.28)",
                    }}
                />
            ) : null}
        </button>
    );
}

export default function EmployerRecordsPage() {
    const router = useRouter();

    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [plan, setPlan] = useState<"basic" | "pro">("basic");

    const [items, setItems] = useState<RecordItem[]>([]);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    // filters
    const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "approved" | "flagged">("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [helperFilter, setHelperFilter] = useState<string>("all");

    const [helpers, setHelpers] = useState<Array<{ uid: string; label: string }>>([]);

    // collapsed panels
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [csvOpen, setCsvOpen] = useState(false);

    // lightbox (all images)
    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

    // pagination
    const [loadingFirst, setLoadingFirst] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const hasUserScrolledRef = useRef(false);

    // ✅ restore panel open state (optional)
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(UI_STATE_KEY);
            if (!raw) return;
            const s = JSON.parse(raw);
            if (typeof s?.filtersOpen === "boolean") setFiltersOpen(s.filtersOpen);
            if (typeof s?.csvOpen === "boolean") setCsvOpen(s.csvOpen);
        } catch { }
    }, []);

    // ✅ persist panel open state (optional)
    useEffect(() => {
        try {
            sessionStorage.setItem(UI_STATE_KEY, JSON.stringify({ filtersOpen, csvOpen }));
        } catch { }
    }, [filtersOpen, csvOpen]);

    useEffect(() => {
        function onScroll() {
            if (window.scrollY > 0) hasUserScrolledRef.current = true;
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.replace("/e/login");
                return;
            }

            setMsg(null);

            const usnap = await getDoc(doc(db, "users", user.uid));
            if (usnap.exists()) {
                const data = usnap.data() as any;
                const hid = data?.defaultHouseholdId || window.localStorage.getItem("defaultHouseholdId");
                setHouseholdId(hid || null);
                setPlan(data?.plan === "pro" ? "pro" : "basic");
            } else {
                setHouseholdId(window.localStorage.getItem("defaultHouseholdId"));
                setPlan("basic");
            }
        });

        return () => unsub();
    }, [router]);

    // load helpers (for filter dropdown)
    useEffect(() => {
        async function loadHelpers() {
            if (!householdId) return;
            try {
                const qh = query(collection(db, "households", householdId, "members"), where("role", "==", "helper"));
                const snap = await getDocs(qh);
                const list = snap.docs.map((d) => {
                    const data = d.data() as any;
                    return { uid: d.id, label: String(data?.label || "姐姐") };
                });
                list.sort((a, b) => a.label.localeCompare(b.label) || a.uid.localeCompare(b.uid));
                setHelpers(list);
            } catch (e) {
                console.error(e);
            }
        }
        loadHelpers();
    }, [householdId]);

    async function loadFirst(hid: string) {
        setMsg(null);
        setLoadingFirst(true);
        setHasMore(true);
        lastDocRef.current = null;

        try {
            const q1 = query(collection(db, "households", hid, "records"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
            const snap = await getDocs(q1);

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
            if (snap.docs.length > 0) lastDocRef.current = snap.docs[snap.docs.length - 1];
            setHasMore(snap.docs.length === PAGE_SIZE);
        } catch (e) {
            console.error(e);
            setMsg({ type: "err", text: "讀取失敗（可能係 Firestore rules / index）。" });
            setHasMore(false);
        } finally {
            setLoadingFirst(false);
        }
    }

    async function loadMore(hid: string) {
        if (!hasMore || loadingMore) return;

        const last = lastDocRef.current;
        if (!last) {
            setHasMore(false);
            return;
        }

        setLoadingMore(true);
        setMsg(null);

        try {
            const q2 = query(collection(db, "households", hid, "records"), orderBy("createdAt", "desc"), startAfter(last), limit(PAGE_SIZE));
            const snap = await getDocs(q2);

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
            setMsg({ type: "err", text: "載入更多失敗（可能需要 index）。" });
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    }

    // first load
    useEffect(() => {
        if (!householdId) return;
        loadFirst(householdId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [householdId]);

    // ✅ restore scroll AFTER first load is done (important!)
    const didRestoreRef = useRef(false);
    useEffect(() => {
        if (loadingFirst) return;
        if (didRestoreRef.current) return;

        didRestoreRef.current = true;
        restoreScrollOnce({
            isReady: () => !loadingFirst && items.length >= 0,
        });
    }, [loadingFirst, items.length]);

    // intersection observer: must scroll before load more
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        const io = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (!first?.isIntersecting) return;
                if (!hasUserScrolledRef.current) return;
                if (!householdId) return;
                loadMore(householdId);
            },
            { root: null, rootMargin: "160px", threshold: 0 }
        );

        io.observe(el);
        return () => io.disconnect();
    }, [householdId, hasMore, loadingMore]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        items.forEach((i) => set.add((i.category || "其他").trim() || "其他"));
        return Array.from(set).sort();
    }, [items]);

    const helperOptions = useMemo(() => {
        const map = new Map<string, string>();
        helpers.forEach((h) => map.set(h.uid, h.label));
        items.forEach((it) => {
            if (it.createdByUserId && !map.has(it.createdByUserId)) {
                map.set(it.createdByUserId, (it.createdByLabel || "").trim() || "姐姐");
            }
        });
        const list = Array.from(map.entries()).map(([uid, label]) => ({ uid, label }));
        list.sort((a, b) => a.label.localeCompare(b.label) || a.uid.localeCompare(b.uid));
        return list;
    }, [helpers, items]);

    const hasActiveFilter = statusFilter !== "all" || categoryFilter !== "all" || helperFilter !== "all";

    const filtered = useMemo(() => {
        return items.filter((it) => {
            const okStatus = statusFilter === "all" ? true : it.status === statusFilter;
            const c = (it.category || "其他").trim() || "其他";
            const okCategory = categoryFilter === "all" ? true : c === categoryFilter;
            const okHelper = helperFilter === "all" ? true : (it.createdByUserId || "") === helperFilter;
            return okStatus && okCategory && okHelper;
        });
    }, [items, statusFilter, categoryFilter, helperFilter]);

    function buildCsv(rows: RecordItem[]) {
        const header = ["date", "amount_hkd", "category", "note", "status", "helper", "images"].join(",");
        const lines = rows.map((r) => {
            const d: Date | null = r.createdAt?.toDate?.() ?? null;
            const dateStr = d ? formatDateYYYYMMDD(d) : "";
            const amount = ((r.amountCents || 0) / 100).toFixed(2);
            const category = (r.category || "其他").trim() || "其他";
            const note = (r.note || "").trim();
            const status = r.status || "submitted";
            const helper = (r.createdByLabel || "").trim() || (r.createdByUserId ? "姐姐" : "");
            const images = r.receiptImages?.length ?? 0;

            return [
                csvEscape(dateStr),
                csvEscape(amount),
                csvEscape(category),
                csvEscape(note),
                csvEscape(status),
                csvEscape(helper),
                csvEscape(images),
            ].join(",");
        });
        return [header, ...lines].join("\n");
    }

    function exportCsv(scope: "thisMonth" | "all") {
        setMsg(null);

        if (plan !== "pro") {
            setMsg({ type: "err", text: "CSV 匯出係 Pro 功能。" });
            return;
        }

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const rows =
            scope === "all"
                ? filtered
                : filtered.filter((it) => {
                    const d: Date | null = it.createdAt?.toDate?.() ?? null;
                    return d ? d.getMonth() === thisMonth && d.getFullYear() === thisYear : false;
                });

        const csv = buildCsv(rows);
        const nameScope = scope === "all" ? "all" : `${thisYear}-${pad2(thisMonth + 1)}`;
        downloadTextFile(`helper-expense-${nameScope}.csv`, csv);
        setMsg({ type: "ok", text: `已下載 CSV ✅（${rows.length} 筆）` });
    }

    const listItems: RecordListItem[] = useMemo(() => {
        return filtered.map((it) => ({
            id: it.id,
            amountCents: it.amountCents,
            status: it.status,
            category: it.category,
            note: it.note,
            receiptImages: it.receiptImages,
            createdAt: it.createdAt,
        }));
    }, [filtered]);

    return (
        <AppShell role="employer" title="記錄">
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: "var(--text)" }}>記錄</h1>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                            只顯示最近 {PAGE_SIZE} 筆，捲到底自動載入更多
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <IconButton
                            title={hasActiveFilter ? "篩選（已啟用）" : "篩選"}
                            icon="filter"
                            active={filtersOpen}
                            dot={hasActiveFilter}
                            onClick={() => {
                                setFiltersOpen((v) => !v);
                                if (!filtersOpen) setCsvOpen(false);
                            }}
                        />
                        <IconButton
                            title="CSV 匯出"
                            icon="download"
                            active={csvOpen}
                            onClick={() => {
                                setCsvOpen((v) => !v);
                                if (!csvOpen) setFiltersOpen(false);
                            }}
                        />
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
                            color: msg.type === "err" ? "#991B1B" : "var(--text)",
                            fontWeight: 950,
                            boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
                        }}
                    >
                        {msg.text}
                    </div>
                ) : null}

                {/* Filters panel */}
                {filtersOpen ? (
                    <div
                        style={{
                            marginTop: 12,
                            border: "1px solid rgba(15,23,42,0.10)",
                            background: "rgba(255,255,255,0.85)",
                            borderRadius: 18,
                            padding: 14,
                            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.10)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ fontWeight: 950, color: "var(--text)" }}>篩選</div>
                            <button
                                type="button"
                                onClick={() => {
                                    setStatusFilter("all");
                                    setCategoryFilter("all");
                                    setHelperFilter("all");
                                }}
                                style={{
                                    border: "1px solid rgba(15,23,42,0.12)",
                                    background: "rgba(255,255,255,0.9)",
                                    borderRadius: 999,
                                    padding: "8px 10px",
                                    fontWeight: 900,
                                    cursor: "pointer",
                                }}
                            >
                                清除
                            </button>
                        </div>

                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {(["all", "submitted", "approved", "flagged"] as const).map((f) => {
                                const label = f === "all" ? "全部" : f === "submitted" ? "待批" : f === "approved" ? "已批" : "需跟進";
                                const active = statusFilter === f;
                                return (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => setStatusFilter(f)}
                                        style={{
                                            border: "1px solid rgba(15,23,42,0.12)",
                                            background: active ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.9)",
                                            borderRadius: 999,
                                            padding: "8px 10px",
                                            fontWeight: 950,
                                            cursor: "pointer",
                                            color: "var(--text)",
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            className="twoCol"
                            style={{
                                marginTop: 12,
                                display: "grid",
                                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                gap: 10,
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>分類</div>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    style={{ marginTop: 8, width: "100%", padding: 10, borderRadius: 12 }}
                                >
                                    <option value="all">全部</option>
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>提交者</div>
                                <select
                                    value={helperFilter}
                                    onChange={(e) => setHelperFilter(e.target.value)}
                                    style={{ marginTop: 8, width: "100%", padding: 10, borderRadius: 12 }}
                                >
                                    <option value="all">全部</option>
                                    {helperOptions.map((h) => (
                                        <option key={h.uid} value={h.uid}>
                                            {h.label} ({h.uid.slice(0, 6)}…)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* CSV panel */}
                {csvOpen ? (
                    <div
                        style={{
                            marginTop: 12,
                            border: "1px solid rgba(15,23,42,0.10)",
                            background: "rgba(255,255,255,0.85)",
                            borderRadius: 18,
                            padding: 14,
                            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.10)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <div>
                                <div style={{ fontWeight: 950, color: "var(--text)" }}>CSV 匯出（Pro）</div>
                                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                                    方便僱主對數／報銷／記帳
                                </div>
                            </div>
                            {plan !== "pro" ? <div style={{ fontSize: 12, fontWeight: 900, color: "#991B1B" }}>你而家係 Basic（不能匯出）</div> : null}
                        </div>

                        <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <Button
                                tone={plan === "pro" ? "primary" : "outline"}
                                fullWidth={false}
                                onClick={() => exportCsv("thisMonth")}
                                disabled={plan !== "pro"}
                            >
                                匯出本月
                            </Button>
                            <Button tone="outline" fullWidth={false} onClick={() => exportCsv("all")} disabled={plan !== "pro"}>
                                匯出全部
                            </Button>
                        </div>
                    </div>
                ) : null}

                {/* List */}
                <div style={{ marginTop: 14 }}>
                    {loadingFirst ? (
                        <div style={{ marginTop: 14, color: "var(--muted)", fontWeight: 900 }}>載入中…</div>
                    ) : (
                        <>
                            <RecordList
                                items={listItems}
                                photoCountPlacement="thumbnail"
                                onItemClick={(id) => {
                                    saveReturnToCurrentPage();
                                    router.push(`/e/records/${id}`);
                                }}
                                onPreviewClick={(id, clickedUrl) => {
                                    const it = items.find((x) => x.id === id);
                                    const urls = (it?.receiptImages || []).map((x) => x.url).filter(Boolean);
                                    if (!urls.length) return;
                                    const index = Math.max(0, urls.indexOf(clickedUrl));
                                    setLightbox({ images: urls, index });
                                }}
                                dayRightSlot={(_dateKey: string, rows: RecordListItem[]) => {
                                    const totalCents = rows.reduce((sum: number, r: RecordListItem) => sum + (r.amountCents || 0), 0);
                                    const total = totalCents / 100;
                                    return `HK$ ${total.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                }}
                            />

                            {/* sentinel */}
                            <div ref={sentinelRef} style={{ height: 1 }} />

                            {loadingMore ? (
                                <div style={{ padding: "10px 2px", color: "var(--muted)", fontWeight: 900 }}>載入更多…</div>
                            ) : hasMore ? (
                                <div style={{ padding: "10px 2px", color: "rgba(15,23,42,0.45)", fontWeight: 900 }}>（向下捲會載入更多）</div>
                            ) : items.length > 0 ? (
                                <div style={{ padding: "10px 2px", color: "rgba(15,23,42,0.45)", fontWeight: 900 }}>已到最底 ✅</div>
                            ) : (
                                <div style={{ padding: "10px 2px", color: "rgba(15,23,42,0.55)", fontWeight: 900 }}>未有記錄</div>
                            )}
                        </>
                    )}
                </div>

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

                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={lightbox.images[lightbox.index]} alt="receipt large" style={{ width: "100%", height: "auto", display: "block" }} />

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

                <style jsx>{`
          @media (max-width: 640px) {
            .twoCol {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
            </main>
        </AppShell>
    );
}