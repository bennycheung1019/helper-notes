"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { syncAuthUid } from "@/lib/localAuth";
import {
    doc,
    getDoc,
    serverTimestamp,
    runTransaction,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

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
    updatedAt?: any;
    updatedByUserId?: string | null;
};

function centsFromHKDString(s: string) {
    const v = Number(String(s || "").replace(/[^\d.]/g, ""));
    if (!isFinite(v) || v <= 0) return 0;
    return Math.round(v * 100);
}
function hkdFromCents(cents: number) {
    return (cents / 100).toFixed(2);
}
function clampLabel(s: string) {
    return (s || "").trim().slice(0, 40);
}
function pad2(n: number) {
    return String(n).padStart(2, "0");
}
function formatTimeHHMM(d: Date) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function ymd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function prettyDateRowLabel(d: Date) {
    const today = ymd(new Date());
    const target = ymd(d);
    if (target === today) return "今日";
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
function statusLabel(s: RecordDoc["status"]) {
    if (s === "submitted") return "待批";
    if (s === "approved") return "已批";
    return "需跟進";
}
function statusColor(s: RecordDoc["status"]) {
    if (s === "submitted") return "#F59E0B";
    if (s === "approved") return "#10B981";
    return "#EF4444";
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

function CategoryPill({
    text,
    active,
    onClick,
    disabled,
}: {
    text: string;
    active: boolean;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                border: "1px solid var(--border)",
                background: active ? "#111" : "var(--card)",
                color: active ? "white" : "var(--text)",
                borderRadius: 999,
                padding: "9px 12px",
                fontWeight: 950,
                fontSize: 13,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                lineHeight: 1,
                whiteSpace: "nowrap",
            }}
        >
            {text}
        </button>
    );
}

type ToastState = { open: boolean; text: string; kind?: "success" | "error" };

export default function HelperRecordEditPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: recordId } = React.use(params);

    const [loading, setLoading] = useState(true);
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [uid, setUid] = useState<string | null>(null);

    const [original, setOriginal] = useState<RecordDoc | null>(null);

    // form
    const [amountStr, setAmountStr] = useState("");
    const [category, setCategory] = useState("買餸");
    const [note, setNote] = useState("");

    // images
    const [images, setImages] = useState<ReceiptImage[]>([]);
    const [uploading, setUploading] = useState(false);

    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);

    const [toast, setToast] = useState<ToastState>({ open: false, text: "", kind: "success" });

    // copy feedback
    const [copied, setCopied] = useState(false);

    const amountCents = useMemo(() => centsFromHKDString(amountStr), [amountStr]);
    const amountPreview = useMemo(() => (amountCents > 0 ? hkdFromCents(amountCents) : "0.00"), [amountCents]);

    const createdInfo = useMemo(() => {
        const d: Date | null = original?.createdAt?.toDate?.() ?? null;
        if (!d) return { day: "", time: "" };
        return { day: prettyDateRowLabel(d), time: formatTimeHHMM(d) };
    }, [original?.createdAt]);

    useEffect(() => {
        if (!toast.open) return;
        const t = window.setTimeout(() => setToast({ open: false, text: "", kind: toast.kind }), 1400);
        return () => window.clearTimeout(t);
    }, [toast.open, toast.kind]);

    function handleBack() {
        const rt = consumeReturnTo();
        if (rt) {
            router.replace(rt);
            return;
        }
        try {
            window.history.back();
            return;
        } catch { }
        router.replace("/h/records");
    }

    async function handleCopyId() {
        setCopied(false);
        const ok = await copyToClipboard(recordId);
        if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        }
    }

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.replace(`/h/login?next=${encodeURIComponent(`/h/records/${recordId}/edit`)}`);
                return;
            }
            syncAuthUid(user.uid);
            setUid(user.uid);

            const hid = window.localStorage.getItem("helperHouseholdId");
            if (!hid) {
                setMsg("未綁定家庭，請用僱主邀請連結加入一次。");
                setLoading(false);
                return;
            }
            setHouseholdId(hid);

            await loadRecord(hid, user.uid, recordId);
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, recordId]);

    async function loadRecord(hid: string, userId: string, rid: string) {
        setLoading(true);
        setMsg("");

        try {
            const rsnap = await getDoc(doc(db, "households", hid, "records", rid));
            if (!rsnap.exists()) {
                setMsg("搵唔到呢條記錄。");
                setOriginal(null);
                setLoading(false);
                return;
            }

            const data = rsnap.data() as RecordDoc;
            setOriginal(data);

            // fill form
            setAmountStr(hkdFromCents(Number(data.amountCents || 0)));
            setCategory((data.category || "買餸").trim() || "買餸");
            setNote((data.note || "").trim());
            setImages(Array.isArray(data.receiptImages) ? (data.receiptImages as any) : []);

            // permission / lock msg
            if (data.createdByUserId && data.createdByUserId !== userId) {
                setMsg("你唔可以編輯其他人嘅記錄。");
            } else if (data.status !== "submitted") {
                setMsg("呢條記錄已鎖定（唔係「待批」狀態）。");
            } else {
                setMsg("");
            }
        } catch (e) {
            console.error(e);
            setMsg("載入失敗（可能係 Firestore rules）。");
        } finally {
            setLoading(false);
        }
    }

    function canEdit() {
        if (!original) return false;
        if (!uid) return false;
        if (original.status !== "submitted") return false;
        if (original.createdByUserId && original.createdByUserId !== uid) return false;
        return true;
    }

    async function onPickFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        if (!householdId || !auth.currentUser) return;

        setMsg("");
        setUploading(true);

        try {
            const currentUid = auth.currentUser.uid;
            const now = Date.now();

            const picked = Array.from(files).slice(0, 8);
            const uploaded: ReceiptImage[] = [];

            for (const f of picked) {
                if (!f.type.startsWith("image/")) continue;
                if (f.size > 8 * 1024 * 1024) {
                    setMsg("有相片太大（>8MB），已略過。");
                    continue;
                }

                const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
                const path = `households/${householdId}/receipts/${currentUid}/${now}-${crypto.randomUUID()}.${ext}`;

                const r = storageRef(storage, path);
                await uploadBytes(r, f, { contentType: f.type });
                const url = await getDownloadURL(r);

                uploaded.push({ url, path, uploadedAtMs: Date.now() });
            }

            setImages((prev) => [...uploaded, ...prev].slice(0, 12));
            if (uploaded.length > 0) setMsg("相片已上載 ✅");
            else setMsg("冇可用相片（或已略過）。");
        } catch (e) {
            console.error(e);
            setMsg("上載失敗，請再試。");
        } finally {
            setUploading(false);
        }
    }

    async function removeImage(idx: number) {
        const img = images[idx];
        setImages((prev) => prev.filter((_, i) => i !== idx));

        try {
            if (img?.path) await deleteObject(storageRef(storage, img.path));
        } catch (e) {
            console.warn("deleteObject failed", e);
        }
    }

    /**
     * ✅ 核心修正：
     * Save edit 時用 transaction 同步更新：
     * - records/{rid}.amountCents...
     * - households/{hid}.cashCents 依照「新-舊」差額調整
     *
     * delta = newAmount - oldAmount
     * nextCash = currentCash - delta
     *
     * 例：
     * old=100, new=120 => delta=+20 => cash 再扣 20
     * old=120, new=80  => delta=-40 => cash 加返 40
     *
     * ⚠️ Firestore rules 必須容許 helper 更新 household.cashCents（可升可跌）
     */
    async function onSave() {
        if (!householdId || !uid) return;

        if (!original) {
            setMsg("未載入記錄。");
            return;
        }
        if (!canEdit()) {
            setMsg("呢條記錄已鎖定，唔可以再修改。");
            return;
        }
        if (amountCents <= 0) {
            setMsg("請輸入正確金額。");
            return;
        }

        setBusy(true);
        setMsg("");

        try {
            const householdRef = doc(db, "households", householdId);
            const recordRef = doc(db, "households", householdId, "records", recordId);

            const nextPayload = {
                amountCents,
                category: (category || "其他").trim() || "其他",
                note: (note || "").trim(),
                receiptImages: images.map((x) => ({
                    url: x.url,
                    path: x.path || null,
                    uploadedAtMs: x.uploadedAtMs || Date.now(),
                })),
                status: "submitted" as const,
                updatedAt: serverTimestamp(),
                updatedByUserId: uid,
            };

            await runTransaction(db, async (tx) => {
                const [rsnap, hsnap] = await Promise.all([tx.get(recordRef), tx.get(householdRef)]);
                if (!rsnap.exists()) throw new Error("record_not_found");
                if (!hsnap.exists()) throw new Error("household_not_found");

                const r = rsnap.data() as any;
                const h = hsnap.data() as any;

                // 跟你現有 canEdit + rules 同步
                if (r.createdByUserId && r.createdByUserId !== uid) throw new Error("not_owner");
                if ((r.status || "submitted") !== "submitted") throw new Error("locked");

                const oldAmountCents = Number(r.amountCents || 0) || 0;
                const currentCashCents = Number(h.cashCents ?? 0) || 0;

                const delta = amountCents - oldAmountCents;
                const nextCashCents = currentCashCents - delta;

                // 1) update record
                tx.update(recordRef, nextPayload);

                // 2) update cash
                tx.update(householdRef, {
                    cashCents: nextCashCents,
                    cashUpdatedAt: serverTimestamp(),
                });
            });

            // 更新本地 original，避免下一次 save 用舊 oldAmount
            setOriginal((prev) =>
                prev
                    ? {
                        ...prev,
                        amountCents,
                        category: (category || "其他").trim() || "其他",
                        note: (note || "").trim(),
                        receiptImages: images,
                        status: "submitted",
                        updatedByUserId: uid,
                    }
                    : prev
            );

            setToast({ open: true, text: "已儲存 ✅", kind: "success" });
        } catch (e: any) {
            console.error(e);
            setToast({ open: true, text: "儲存失敗", kind: "error" });

            // 更清楚提示
            const code = String(e?.code || e?.message || "");
            if (code.includes("permission") || code.includes("PERMISSION") || code.includes("insufficient")) {
                setMsg("儲存失敗：權限不足（多數係 rules 未放行 household.cashCents 更新）。");
            } else if (code.includes("locked")) {
                setMsg("儲存失敗：記錄已鎖定（唔係待批）。");
            } else {
                setMsg("儲存失敗（可能係 rules / 網絡）。");
            }
        } finally {
            setBusy(false);
        }
    }

    const locked = original && !canEdit();

    return (
        <AppShell role="helper">
            {/* Top toast (auto hide) */}
            {toast.open ? (
                <div
                    style={{
                        position: "fixed",
                        top: "calc(env(safe-area-inset-top) + 10px)",
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        zIndex: 80,
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            pointerEvents: "none",
                            border: "1px solid rgba(15,23,42,0.10)",
                            background: toast.kind === "error" ? "rgba(239,68,68,0.10)" : "rgba(34,197,94,0.10)",
                            color: toast.kind === "error" ? "#991B1B" : "#166534",
                            borderRadius: 999,
                            padding: "10px 14px",
                            fontWeight: 950,
                            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
                        }}
                    >
                        {toast.text}
                    </div>
                </div>
            ) : null}

            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* Top row */}
                <div
                    style={{
                        border: "1px solid rgba(15,23,42,0.10)",
                        background: "rgba(15,23,42,0.03)",
                        borderRadius: 18,
                        padding: 14,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(15,23,42,0.62)" }}>
                            {createdInfo.day ? `${createdInfo.day}${createdInfo.time ? ` ${createdInfo.time}` : ""} 的記錄` : "記錄"}
                        </div>

                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <div style={{ fontSize: 22, fontWeight: 950, color: "var(--text)" }}>HK$ {amountPreview}</div>

                            {original ? (
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontWeight: 950,
                                        color: "rgba(15,23,42,0.70)",
                                        fontSize: 13,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 999,
                                            background: statusColor(original.status),
                                            boxShadow: "0 8px 16px rgba(15,23,42,0.10)",
                                        }}
                                    />
                                    {statusLabel(original.status)}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {/* back button */}
                    <button
                        type="button"
                        onClick={handleBack}
                        style={{
                            flex: "0 0 auto",
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(15,23,42,0.12)",
                            background: "rgba(255,255,255,0.85)",
                            color: "var(--text)",
                            fontWeight: 950,
                            cursor: "pointer",
                            boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
                            WebkitTapHighlightColor: "transparent",
                            whiteSpace: "nowrap",
                        }}
                        aria-label="Back"
                        title="返回"
                    >
                        ← 返回
                    </button>
                </div>

                {/* Record ID (click to copy) */}
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
                        <span
                            style={{
                                marginLeft: 8,
                                color: copied ? "rgba(16,185,129,0.95)" : "rgba(15,23,42,0.35)",
                                fontWeight: 950,
                            }}
                        >
                            {copied ? "已複製 ✅" : ""}
                        </span>
                    </button>
                </div>

                {/* Main card */}
                <div
                    style={{
                        marginTop: 14,
                        border: "1px solid rgba(15,23,42,0.10)",
                        background: "var(--card)",
                        borderRadius: 18,
                        padding: 14,
                        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.10)",
                    }}
                >
                    {loading ? (
                        <div style={{ color: "var(--muted)", fontWeight: 900 }}>載入中…</div>
                    ) : (
                        <>
                            {locked ? (
                                <div
                                    style={{
                                        border: "1px solid rgba(239,68,68,0.18)",
                                        background: "rgba(239,68,68,0.06)",
                                        padding: 12,
                                        borderRadius: 14,
                                        color: "#991B1B",
                                        fontWeight: 950,
                                        lineHeight: 1.35,
                                    }}
                                >
                                    {msg || "呢條記錄已鎖定，唔可以再修改。"}
                                </div>
                            ) : msg ? (
                                <div
                                    style={{
                                        border: "1px solid rgba(34,197,94,0.18)",
                                        background: "rgba(34,197,94,0.06)",
                                        padding: 12,
                                        borderRadius: 14,
                                        color: "#166534",
                                        fontWeight: 950,
                                        lineHeight: 1.35,
                                    }}
                                >
                                    {msg}
                                </div>
                            ) : null}

                            {/* Amount */}
                            <div style={{ marginTop: 14 }}>
                                <div style={{ fontSize: 13, fontWeight: 950, color: "var(--text)" }}>金額（HK$）</div>
                                <input
                                    inputMode="decimal"
                                    value={amountStr}
                                    onChange={(e) => setAmountStr(e.target.value)}
                                    placeholder="例如 125.5"
                                    disabled={!canEdit()}
                                    style={{
                                        marginTop: 8,
                                        width: "100%",
                                        padding: 14,
                                        borderRadius: 14,
                                        border: "1px solid var(--border)",
                                        background: canEdit() ? "white" : "#f3f4f6",
                                        fontSize: 18,
                                        fontWeight: 950,
                                        color: "#0f172a",
                                    }}
                                />
                            </div>

                            {/* Category */}
                            <div style={{ marginTop: 14 }}>
                                <div style={{ fontSize: 13, fontWeight: 950, color: "var(--text)" }}>分類</div>
                                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    {["買餸", "日用品", "交通", "其他"].map((c) => (
                                        <CategoryPill
                                            key={c}
                                            text={c}
                                            active={category === c}
                                            disabled={!canEdit()}
                                            onClick={() => setCategory(clampLabel(c))}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Note */}
                            <div style={{ marginTop: 14 }}>
                                <div style={{ fontSize: 13, fontWeight: 950, color: "var(--text)" }}>備註（可選）</div>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={!canEdit()}
                                    placeholder="例如：買米、牛奶、紙巾…"
                                    style={{
                                        width: "100%",
                                        marginTop: 8,
                                        padding: 12,
                                        borderRadius: 14,
                                        border: "1px solid var(--border)",
                                        background: canEdit() ? "white" : "#f3f4f6",
                                        fontSize: 15,
                                        minHeight: 110,
                                        resize: "vertical",
                                        color: "#0f172a",
                                        fontWeight: 700,
                                    }}
                                />
                            </div>

                            {/* Upload */}
                            <div style={{ marginTop: 14 }}>
                                <div style={{ fontSize: 13, fontWeight: 950, color: "var(--text)" }}>收據相片（可選）</div>

                                <label
                                    style={{
                                        display: "block",
                                        marginTop: 8,
                                        padding: 12,
                                        borderRadius: 14,
                                        border: "1px dashed rgba(15,23,42,0.18)",
                                        background: uploading ? "rgba(15,23,42,0.03)" : "var(--card)",
                                        cursor: canEdit() && !uploading ? "pointer" : "not-allowed",
                                        fontWeight: 950,
                                        textAlign: "center",
                                        color: "var(--text)",
                                    }}
                                >
                                    {uploading ? "上載中…" : "＋ 新增相片"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        disabled={!canEdit() || uploading}
                                        onChange={(e) => onPickFiles(e.target.files)}
                                        style={{ display: "none" }}
                                    />
                                </label>

                                {images.length ? (
                                    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                                        {images.map((img, idx) => (
                                            <div
                                                key={img.url + idx}
                                                style={{
                                                    border: "1px solid rgba(15,23,42,0.10)",
                                                    borderRadius: 16,
                                                    overflow: "hidden",
                                                    position: "relative",
                                                    background: "white",
                                                    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
                                                }}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={img.url} alt="receipt" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />

                                                {canEdit() ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        aria-label="Remove image"
                                                        style={{
                                                            position: "absolute",
                                                            top: 8,
                                                            right: 8,
                                                            padding: "6px 8px",
                                                            borderRadius: 999,
                                                            border: "1px solid rgba(0,0,0,0.12)",
                                                            background: "rgba(255,255,255,0.92)",
                                                            fontWeight: 950,
                                                            cursor: "pointer",
                                                            fontSize: 12,
                                                            color: "#0f172a",
                                                        }}
                                                    >
                                                        刪除
                                                    </button>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            {/* Actions */}
                            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    style={{
                                        flex: 1,
                                        padding: 14,
                                        borderRadius: 16,
                                        border: "1px solid var(--border)",
                                        background: "var(--card)",
                                        color: "var(--text)",
                                        fontWeight: 950,
                                        cursor: "pointer",
                                        boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
                                    }}
                                >
                                    返回
                                </button>

                                <button
                                    type="button"
                                    onClick={onSave}
                                    disabled={!canEdit() || busy || uploading}
                                    style={{
                                        flex: 1,
                                        padding: 14,
                                        borderRadius: 16,
                                        border: "none",
                                        background: !canEdit() || busy || uploading ? "#94a3b8" : "#111",
                                        color: "white",
                                        fontWeight: 950,
                                        cursor: !canEdit() || busy || uploading ? "not-allowed" : "pointer",
                                        boxShadow: !canEdit() || busy || uploading ? "none" : "0 14px 30px rgba(15, 23, 42, 0.18)",
                                    }}
                                >
                                    {busy ? "儲存中…" : uploading ? "相片上載中…" : "儲存"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </AppShell>
    );
}