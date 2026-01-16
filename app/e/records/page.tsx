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

import Button from "@/components/ui/Button";
import { RecordList, RecordListItem } from "@/components/records/RecordList";
import { saveReturnToCurrentPage, restoreScrollOnce } from "@/lib/returnTo";

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
    const { t } = useI18n();

    const tr = (key: string, vars?: Record<string, string | number>) => {
        let s = t(key);
        if (vars) {
            for (const [k, v] of Object.entries(vars)) {
                s = s.replaceAll(`{${k}}`, String(v));
            }
        }
        return s;
    };

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

            syncAuthUid(user.uid);
            setMsg(null);

            try {
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
            } catch (e) {
                console.error(e);
                setMsg({ type: "err", text: t("records.err.loadProfile") });
                setHouseholdId(null);
            }
        });

        return () => unsub();
    }, [router, t]);

    // load helpers (for filter dropdown)
    useEffect(() => {
        async function loadHelpers() {
            if (!householdId) return;
            try {
                const qh = query(collection(db, "households", householdId, "members"), where("role", "==", "helper"));
                const snap = await getDocs(qh);
                const list = snap.docs.map((d) => {
                    const data = d.data() as any;
                    return { uid: d.id, label: String(data?.label || t("records.helper.default")) };
                });
                list.sort((a, b) => a.label.localeCompare(b.label) || a.uid.localeCompare(b.uid));
                setHelpers(list);
            } catch (e) {
                console.error(e);
            }
        }
        loadHelpers();
    }, [householdId, t]);

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
                    category: data.category ?? t("records.category.other"),
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
            setMsg({ type: "err", text: t("records.err.readFirst") });
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
            const q2 = query(
                collection(db, "households", hid, "records"),
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
            setMsg({ type: "err", text: t("records.err.loadMore") });
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
        items.forEach((i) => set.add((i.category || t("records.category.other")).trim() || t("records.category.other")));
        return Array.from(set).sort();
    }, [items, t]);

    const helperOptions = useMemo(() => {
        const map = new Map<string, string>();
        helpers.forEach((h) => map.set(h.uid, h.label));
        items.forEach((it) => {
            if (it.createdByUserId && !map.has(it.createdByUserId)) {
                map.set(it.createdByUserId, (it.createdByLabel || "").trim() || t("records.helper.default"));
            }
        });
        const list = Array.from(map.entries()).map(([uid, label]) => ({ uid, label }));
        list.sort((a, b) => a.label.localeCompare(b.label) || a.uid.localeCompare(b.uid));
        return list;
    }, [helpers, items, t]);

    const hasActiveFilter = statusFilter !== "all" || categoryFilter !== "all" || helperFilter !== "all";

    const filtered = useMemo(() => {
        return items.filter((it) => {
            const okStatus = statusFilter === "all" ? true : it.status === statusFilter;
            const c = (it.category || t("records.category.other")).trim() || t("records.category.other");
            const okCategory = categoryFilter === "all" ? true : c === categoryFilter;
            const okHelper = helperFilter === "all" ? true : (it.createdByUserId || "") === helperFilter;
            return okStatus && okCategory && okHelper;
        });
    }, [items, statusFilter, categoryFilter, helperFilter, t]);

    function buildCsv(rows: RecordItem[]) {
        // keep csv header stable (english keys ok)
        const header = ["date", "amount_hkd", "category", "note", "status", "helper", "images"].join(",");
        const lines = rows.map((r) => {
            const d: Date | null = r.createdAt?.toDate?.() ?? null;
            const dateStr = d ? formatDateYYYYMMDD(d) : "";
            const amount = ((r.amountCents || 0) / 100).toFixed(2);
            const category = (r.category || t("records.category.other")).trim() || t("records.category.other");
            const note = (r.note || "").trim();
            const status = r.status || "submitted";
            const helper = (r.createdByLabel || "").trim() || (r.createdByUserId ? t("records.helper.default") : "");
            const images = r.receiptImages?.length ?? 0;

            return [csvEscape(dateStr), csvEscape(amount), csvEscape(category), csvEscape(note), csvEscape(status), csvEscape(helper), csvEscape(images)].join(",");
        });
        return [header, ...lines].join("\n");
    }

    function exportCsv(scope: "thisMonth" | "all") {
        setMsg(null);

        if (plan !== "pro") {
            setMsg({ type: "err", text: t("records.csv.proOnly") });
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

        setMsg({ type: "ok", text: tr("records.csv.downloaded", { n: rows.length }) });
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
        <AppShell role="employer" title={t("records.title")}>
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: "var(--text)" }}>{t("records.title")}</h1>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                            {tr("records.sub.recentAutoLoad", { n: PAGE_SIZE })}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <IconButton
                            title={hasActiveFilter ? t("records.filters.titleActive") : t("records.filters.title")}
                            icon="filter"
                            active={filtersOpen}
                            dot={hasActiveFilter}
                            onClick={() => {
                                setFiltersOpen((v) => !v);
                                if (!filtersOpen) setCsvOpen(false);
                            }}
                        />
                        <IconButton
                            title={t("records.csv.iconTitle")}
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
                            <div style={{ fontWeight: 950, color: "var(--text)" }}>{t("records.filters.panelTitle")}</div>
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
                                {t("records.filters.clear")}
                            </button>
                        </div>

                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {(["all", "submitted", "approved", "flagged"] as const).map((f) => {
                                const label =
                                    f === "all"
                                        ? t("records.filters.status.all")
                                        : f === "submitted"
                                            ? t("records.filters.status.submitted")
                                            : f === "approved"
                                                ? t("records.filters.status.approved")
                                                : t("records.filters.status.flagged");
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
                                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>{t("records.filters.category")}</div>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    style={{ marginTop: 8, width: "100%", padding: 10, borderRadius: 12 }}
                                >
                                    <option value="all">{t("records.filters.all")}</option>
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>{t("records.filters.submitter")}</div>
                                <select
                                    value={helperFilter}
                                    onChange={(e) => setHelperFilter(e.target.value)}
                                    style={{ marginTop: 8, width: "100%", padding: 10, borderRadius: 12 }}
                                >
                                    <option value="all">{t("records.filters.all")}</option>
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
                                <div style={{ fontWeight: 950, color: "var(--text)" }}>{t("records.csv.title")}</div>
                                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>{t("records.csv.sub")}</div>
                            </div>
                            {plan !== "pro" ? (
                                <div style={{ fontSize: 12, fontWeight: 900, color: "#991B1B" }}>{t("records.csv.basicNoExport")}</div>
                            ) : null}
                        </div>

                        <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <Button
                                tone={plan === "pro" ? "primary" : "outline"}
                                fullWidth={false}
                                onClick={() => exportCsv("thisMonth")}
                                disabled={plan !== "pro"}
                            >
                                {t("records.csv.thisMonth")}
                            </Button>
                            <Button tone="outline" fullWidth={false} onClick={() => exportCsv("all")} disabled={plan !== "pro"}>
                                {t("records.csv.all")}
                            </Button>
                        </div>
                    </div>
                ) : null}

                {/* List */}
                <div style={{ marginTop: 14 }}>
                    {loadingFirst ? (
                        <div style={{ marginTop: 14, color: "var(--muted)", fontWeight: 900 }}>{t("common.loading")}</div>
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
                                    return `${t("records.currencyPrefix")} ${total.toLocaleString("en-HK", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}`;
                                }}
                            />

                            {/* sentinel */}
                            <div ref={sentinelRef} style={{ height: 1 }} />

                            {loadingMore ? (
                                <div style={{ padding: "10px 2px", color: "var(--muted)", fontWeight: 900 }}>{t("records.more.loading")}</div>
                            ) : hasMore ? (
                                <div style={{ padding: "10px 2px", color: "rgba(15,23,42,0.45)", fontWeight: 900 }}>{t("records.more.hint")}</div>
                            ) : items.length > 0 ? (
                                <div style={{ padding: "10px 2px", color: "rgba(15,23,42,0.45)", fontWeight: 900 }}>{t("records.more.end")}</div>
                            ) : (
                                <div style={{ padding: "10px 2px", color: "rgba(15,23,42,0.55)", fontWeight: 900 }}>{t("records.empty")}</div>
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
                                <div style={{ fontWeight: 950 }}>{tr("records.lightbox.title", { i: lightbox.index + 1, n: lightbox.images.length })}</div>
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
                                            aria-label={tr("records.lightbox.thumbAria", { n: i + 1 })}
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