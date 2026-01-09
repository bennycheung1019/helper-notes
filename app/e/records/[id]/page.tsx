"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import Button from "@/components/ui/Button";
import { CategoryPill } from "@/components/records/RecordPills";
import { consumeReturnTo } from "@/lib/returnTo";

type ReceiptImage = {
    url: string;
    path?: string | null;
    uploadedAtMs?: number;
};

type RecordDoc = {
    amountCents: number;
    category?: string;
    note?: string;
    status: "submitted" | "approved" | "flagged";
    createdByUserId?: string | null;
    createdByLabel?: string | null;
    receiptImages?: ReceiptImage[];
    createdAt?: any; // Firestore Timestamp
};

function centsToHKD(cents: number) {
    const v = (cents || 0) / 100;
    return v.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function safeText(s: unknown) {
    return String(s ?? "").trim();
}

function ymd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function prettyDate(d: Date) {
    const today = ymd(new Date());
    const target = ymd(d);
    if (target === today) return "今日";
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function formatTimeHHMM(d: Date) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function statusLabel(s: RecordDoc["status"]) {
    if (s === "submitted") return "待批";
    if (s === "approved") return "已批";
    return "需跟進";
}

function statusTone(s: RecordDoc["status"]) {
    if (s === "submitted") return { bg: "rgba(245, 158, 11, 0.16)", fg: "#92400E" };
    if (s === "approved") return { bg: "rgba(16, 185, 129, 0.16)", fg: "#065F46" };
    return { bg: "rgba(239, 68, 68, 0.16)", fg: "#991B1B" };
}

async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            ta.remove();
            return ok;
        } catch {
            return false;
        }
    }
}

export default function EmployerRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: recordId } = React.use(params);

    const [loading, setLoading] = useState(true);
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [record, setRecord] = useState<RecordDoc | null>(null);
    const [msg, setMsg] = useState<string>("");

    // lightbox multi images
    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

    // copy feedback
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.replace(`/e/login?next=${encodeURIComponent(`/e/records/${recordId}`)}`);
                return;
            }

            try {
                const usnap = await getDoc(doc(db, "users", user.uid));
                const u = usnap.exists() ? (usnap.data() as any) : null;
                const hid =
                    (u?.defaultHouseholdId as string | undefined) ||
                    window.localStorage.getItem("defaultHouseholdId") ||
                    null;

                if (!hid) {
                    setMsg("未建立家庭或未設定家庭。");
                    setHouseholdId(null);
                    setLoading(false);
                    return;
                }

                setHouseholdId(hid);
                await loadRecord(hid, recordId);
            } catch (e) {
                console.error(e);
                setMsg("載入失敗（可能係網絡或 Firestore rules）。");
                setLoading(false);
            }
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, recordId]);

    async function loadRecord(hid: string, rid: string) {
        setLoading(true);
        setMsg("");

        try {
            const rsnap = await getDoc(doc(db, "households", hid, "records", rid));
            if (!rsnap.exists()) {
                setRecord(null);
                setMsg("搵唔到呢條記錄。");
                setLoading(false);
                return;
            }
            const data = rsnap.data() as RecordDoc;
            setRecord(data);
        } catch (e) {
            console.error(e);
            setMsg("載入失敗（可能係 Firestore rules）。");
        } finally {
            setLoading(false);
        }
    }

    async function setStatus(status: "approved" | "flagged" | "submitted") {
        if (!householdId) return;
        if (!recordId) return;

        setMsg("");

        try {
            await updateDoc(doc(db, "households", householdId, "records", recordId), {
                status,
                statusUpdatedAt: serverTimestamp(),
                statusUpdatedByUserId: auth.currentUser?.uid || null,
            });
            setRecord((prev) => (prev ? { ...prev, status } : prev));
        } catch (e) {
            console.error(e);
            setMsg("更新狀態失敗（可能係 Firestore rules）。");
        }
    }

    const createdInfo = useMemo(() => {
        const d: Date | null = record?.createdAt?.toDate?.() ?? null;
        if (!d) return { dayLabel: "", timeLabel: "" };
        return { dayLabel: prettyDate(d), timeLabel: formatTimeHHMM(d) };
    }, [record?.createdAt]);

    const images = useMemo(() => {
        return (record?.receiptImages || []).map((x) => x.url).filter(Boolean);
    }, [record?.receiptImages]);

    // ✅ FIX: return to previous location reliably
    function handleBack() {
        const rt = consumeReturnTo();

        // 1) 如果有 returnTo（由 /e/records 儲存落嚟），用 push 返去，保留 history
        if (rt) {
            router.push(rt);
            return;
        }

        // 2) 無 returnTo：用 Next router.back()
        router.back();

        // 3) 極端情況：如果你想再保險，可以加個 timeout fallback
        // window.setTimeout(() => router.replace("/e/records"), 250);
    }

    async function handleCopyId() {
        setCopied(false);
        const ok = await copyToClipboard(recordId);
        if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        }
    }

    if (loading) {
        return (
            <AppShell role="employer" title="記錄詳情">
                <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                    <div style={{ color: "var(--text)", fontWeight: 900 }}>載入中…</div>
                </main>
            </AppShell>
        );
    }

    if (!record) {
        return (
            <AppShell role="employer" title="記錄詳情">
                <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                    <div style={{ color: "var(--text)", fontWeight: 900 }}>{msg || "暫時未有資料"}</div>

                    <div style={{ marginTop: 12 }}>
                        <Button tone="outline" fullWidth={false} onClick={handleBack}>
                            ← 返回
                        </Button>
                    </div>
                </main>
            </AppShell>
        );
    }

    const tone = statusTone(record.status);

    return (
        <AppShell role="employer" title="記錄詳情">
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: "var(--text)" }}>記錄詳情</h1>

                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                            提交者：<b style={{ color: "var(--text)" }}>{safeText(record.createdByLabel) || "姐姐"}</b>
                            {createdInfo.dayLabel ? <span style={{ marginLeft: 8 }}>｜ {createdInfo.dayLabel}</span> : null}
                            {createdInfo.timeLabel ? <span style={{ marginLeft: 6 }}>{createdInfo.timeLabel}</span> : null}
                        </div>
                    </div>

                    {/* back button top-right */}
                    <Button tone="outline" fullWidth={false} onClick={handleBack}>
                        ← 返回
                    </Button>
                </div>

                {/* detail card */}
                <div
                    style={{
                        marginTop: 12,
                        border: "1px solid rgba(15, 23, 42, 0.10)",
                        background: "rgba(255,255,255,0.92)",
                        borderRadius: 18,
                        padding: 14,
                        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.10)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* status tag inside card top-right */}
                    <span
                        style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 950,
                            background: tone.bg,
                            color: tone.fg,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {statusLabel(record.status)}
                    </span>

                    <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>金額</div>
                    <div style={{ marginTop: 8, fontSize: 24, fontWeight: 950, color: "var(--text)" }}>
                        HK$ {centsToHKD(record.amountCents)}
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <CategoryPill text={safeText(record.category) || "其他"} />
                    </div>

                    {safeText(record.note) ? (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>備註</div>
                            <div
                                style={{
                                    marginTop: 6,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: "rgba(15,23,42,0.68)",
                                    lineHeight: 1.5,
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                }}
                            >
                                {safeText(record.note)}
                            </div>
                        </div>
                    ) : null}

                    {/* actions bottom-right */}
                    <div
                        style={{
                            marginTop: 14,
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 10,
                            flexWrap: "wrap",
                        }}
                    >
                        {record.status !== "approved" ? (
                            <Button tone="success" fullWidth={false} onClick={() => setStatus("approved")}>
                                批核
                            </Button>
                        ) : null}

                        {record.status !== "flagged" ? (
                            <Button tone="danger" fullWidth={false} onClick={() => setStatus("flagged")}>
                                需跟進
                            </Button>
                        ) : (
                            <Button tone="outline" fullWidth={false} onClick={() => setStatus("submitted")}>
                                取消標記
                            </Button>
                        )}
                    </div>
                </div>

                {/* Record ID: align right + click to copy */}
                <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        onClick={handleCopyId}
                        title="Click to copy（for CS）"
                        style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            cursor: "pointer",
                            textAlign: "right",
                            color: "rgba(15,23,42,0.42)",
                            fontSize: 11,
                            fontWeight: 900,
                        }}
                    >
                        Record ID：{recordId}
                        <span style={{ marginLeft: 8, color: copied ? "rgba(16,185,129,0.95)" : "rgba(15,23,42,0.35)", fontWeight: 950 }}>
                            {copied ? "已複製 ✅" : ""}
                        </span>
                    </button>
                </div>

                {/* receipts grid */}
                {images.length ? (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)", marginBottom: 8 }}>收據相片</div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            {images.map((url, idx) => (
                                <button
                                    key={url + idx}
                                    type="button"
                                    onClick={() => setLightbox({ images, index: idx })}
                                    style={{
                                        padding: 0,
                                        border: "1px solid rgba(15,23,42,0.10)",
                                        borderRadius: 16,
                                        overflow: "hidden",
                                        background: "white",
                                        cursor: "pointer",
                                        boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
                                    }}
                                    aria-label={`Open receipt image ${idx + 1}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt="receipt" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}

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

                {/* lightbox multi-images */}
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

                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <button
                                        type="button"
                                        onClick={() => setLightbox((p) => (p ? { ...p, index: Math.max(0, p.index - 1) } : p))}
                                        style={{
                                            border: "1px solid #ddd",
                                            borderRadius: 10,
                                            padding: "6px 10px",
                                            background: "white",
                                            fontWeight: 950,
                                            cursor: "pointer",
                                            opacity: lightbox.index === 0 ? 0.5 : 1,
                                        }}
                                        disabled={lightbox.index === 0}
                                        aria-label="Prev image"
                                        title="上一張"
                                    >
                                        ←
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLightbox((p) => (p ? { ...p, index: Math.min(p.images.length - 1, p.index + 1) } : p))
                                        }
                                        style={{
                                            border: "1px solid #ddd",
                                            borderRadius: 10,
                                            padding: "6px 10px",
                                            background: "white",
                                            fontWeight: 950,
                                            cursor: "pointer",
                                            opacity: lightbox.index === lightbox.images.length - 1 ? 0.5 : 1,
                                        }}
                                        disabled={lightbox.index === lightbox.images.length - 1}
                                        aria-label="Next image"
                                        title="下一張"
                                    >
                                        →
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setLightbox(null)}
                                        style={{
                                            border: "1px solid #ddd",
                                            borderRadius: 10,
                                            padding: "6px 10px",
                                            background: "white",
                                            fontWeight: 950,
                                            cursor: "pointer",
                                        }}
                                        aria-label="Close"
                                        title="關閉"
                                    >
                                        關閉
                                    </button>
                                </div>
                            </div>

                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={lightbox.images[lightbox.index]} alt="receipt large" style={{ width: "100%", height: "auto", display: "block" }} />

                            {lightbox.images.length > 1 ? (
                                <div
                                    style={{
                                        padding: 10,
                                        borderTop: "1px solid #eee",
                                        display: "flex",
                                        gap: 10,
                                        overflowX: "auto",
                                    }}
                                >
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