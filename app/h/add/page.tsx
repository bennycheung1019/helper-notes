"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

type ReceiptImage = {
    url: string;
    path?: string;
    uploadedAtMs?: number;
};

function centsFromHKDString(s: string) {
    const v = Number(String(s || "").replace(/[^\d.]/g, ""));
    if (!isFinite(v) || v <= 0) return 0;
    return Math.round(v * 100);
}
function hkdFromCents(cents: number) {
    return (cents / 100).toFixed(2);
}

function Pill({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                border: "1px solid var(--border)",
                background: active ? "#111" : "var(--card)",
                color: active ? "white" : "var(--text)",
                borderRadius: 999,
                padding: "10px 12px",
                fontWeight: 950,
                cursor: "pointer",
                fontSize: 13,
                lineHeight: 1,
                boxShadow: active ? "0 10px 24px rgba(15, 23, 42, 0.18)" : "0 2px 8px rgba(15, 23, 42, 0.06)",
            }}
            type="button"
        >
            {children}
        </button>
    );
}

function Toast({
    text,
    tone = "success",
    onClose,
}: {
    text: string;
    tone?: "success" | "error";
    onClose: () => void;
}) {
    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: "fixed",
                top: "calc(12px + env(safe-area-inset-top))",
                left: 16,
                right: 16,
                zIndex: 60,
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none", // 純提示，不可點
            }}
        >
            <div
                style={{
                    width: "min(520px, 100%)",
                    border: "1px solid rgba(15, 23, 42, 0.12)",
                    background: "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 14,
                    padding: "12px 14px",
                    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.18)",
                    fontWeight: 950,
                    textAlign: "center",
                    color: tone === "success" ? "#065F46" : "#991B1B",
                }}
            >
                {text}
            </div>
        </div>
    );
}

export default function HelperAddPage() {
    const router = useRouter();

    const [householdId, setHouseholdId] = useState<string | null>(null);

    // form
    const [amountStr, setAmountStr] = useState<string>("");
    const [category, setCategory] = useState<string>("買餸");
    const [note, setNote] = useState<string>("");

    // images
    const [images, setImages] = useState<ReceiptImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [busy, setBusy] = useState(false);

    // helper label (from members doc)
    const [helperLabel, setHelperLabel] = useState<string>("姐姐");

    // toast
    const [toast, setToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);
    const toastTimerRef = useRef<number | null>(null);

    const amountCents = useMemo(() => centsFromHKDString(amountStr), [amountStr]);
    const amountHKDPreview = useMemo(() => (amountCents > 0 ? hkdFromCents(amountCents) : "0.00"), [amountCents]);

    const categories = useMemo(() => ["買餸", "日用品", "交通", "其他"], []);

    function showToast(text: string, tone: "success" | "error" = "success") {
        setToast({ text, tone });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
    }

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        };
    }, []);

    // auth + household
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.replace("/h/login");
                return;
            }

            const hid = window.localStorage.getItem("helperHouseholdId");
            if (!hid) {
                setHouseholdId(null);
                showToast("未綁定家庭：請用僱主邀請連結加入一次", "error");
                return;
            }
            setHouseholdId(hid);

            try {
                const msnap = await getDoc(doc(db, "households", hid, "members", user.uid));
                const label = msnap.exists() ? ((msnap.data() as any)?.label || "姐姐") : "姐姐";
                setHelperLabel(String(label || "姐姐"));
            } catch {
                setHelperLabel("姐姐");
            }
        });

        return () => unsub();
    }, [router]);

    async function onPickFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        if (!householdId || !auth.currentUser) return;

        setUploading(true);

        try {
            const uid = auth.currentUser.uid;
            const now = Date.now();

            const picked = Array.from(files).slice(0, 8); // 一次最多 8 張
            const uploaded: ReceiptImage[] = [];

            for (const f of picked) {
                if (!f.type.startsWith("image/")) continue;
                if (f.size > 8 * 1024 * 1024) {
                    showToast("有相片太大（>8MB），已略過", "error");
                    continue;
                }

                const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
                const path = `households/${householdId}/receipts/${uid}/${now}-${crypto.randomUUID()}.${ext}`;

                const r = storageRef(storage, path);
                await uploadBytes(r, f, { contentType: f.type });
                const url = await getDownloadURL(r);

                uploaded.push({ url, path, uploadedAtMs: Date.now() });
            }

            setImages((prev) => [...uploaded, ...prev].slice(0, 12));
            if (uploaded.length > 0) showToast("相片已上載 ✅", "success");
        } catch (e) {
            console.error(e);
            showToast("上載失敗，請再試", "error");
        } finally {
            setUploading(false);
        }
    }

    async function removeImage(idx: number) {
        const img = images[idx];
        setImages((prev) => prev.filter((_, i) => i !== idx));

        try {
            if (img?.path) {
                await deleteObject(storageRef(storage, img.path));
            }
        } catch (e) {
            // ignore
            console.warn("deleteObject failed", e);
        }
    }

    async function submit() {
        if (!householdId || !auth.currentUser) return;

        if (amountCents <= 0) {
            showToast("請輸入正確金額", "error");
            return;
        }

        setBusy(true);
        try {
            const uid = auth.currentUser.uid;

            // label from member doc (fresh read)
            let label = helperLabel || "姐姐";
            try {
                const msnap = await getDoc(doc(db, "households", householdId, "members", uid));
                label = msnap.exists() ? ((msnap.data() as any)?.label || "姐姐") : "姐姐";
            } catch { }

            await addDoc(collection(db, "households", householdId, "records"), {
                amountCents,
                category: (category || "其他").trim() || "其他",
                note: (note || "").trim(),
                status: "submitted",
                createdAt: serverTimestamp(),

                createdByUserId: uid,
                createdByLabel: String(label || "姐姐"),

                receiptImages: images.map((x) => ({
                    url: x.url,
                    path: x.path || null,
                    uploadedAtMs: x.uploadedAtMs || Date.now(),
                })),
            });

            // reset
            setAmountStr("");
            setCategory("買餸");
            setNote("");
            setImages([]);

            showToast("已提交 ✅", "success");
        } catch (e) {
            console.error(e);
            showToast("提交失敗（可能係 Firestore rules）", "error");
        } finally {
            setBusy(false);
        }
    }

    return (
        <AppShell role="helper">
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: "var(--text)" }}>新增</h1>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                            提交者：<b style={{ color: "var(--text)" }}>{helperLabel}</b>
                        </div>
                    </div>
                </div>

                {/* Main card */}
                <div
                    style={{
                        marginTop: 12,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        borderRadius: 18,
                        padding: 14,
                        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
                    }}
                >
                    {/* Amount */}
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 950, color: "var(--text)" }}>金額（HK$）</div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", marginTop: 8 }}>
                            <input
                                inputMode="decimal"
                                placeholder="例如 125.50"
                                value={amountStr}
                                onChange={(e) => setAmountStr(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    borderRadius: 14,
                                    border: "1px solid var(--border)",
                                    background: "white",
                                    fontSize: 20,
                                    fontWeight: 950,
                                    color: "#0f172a",
                                }}
                            />

                            <div style={{ minWidth: 110, textAlign: "right" }}>
                                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 900 }}>預覽</div>
                                <div style={{ fontSize: 20, fontWeight: 950, color: "var(--text)" }}>HK$ {amountHKDPreview}</div>
                            </div>
                        </div>
                    </div>

                    {/* Category pills */}
                    <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 950, color: "var(--text)" }}>分類</div>
                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {categories.map((c) => (
                                <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
                                    {c}
                                </Pill>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 950, color: "var(--text)" }}>備註（可選）</div>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="例如：買米、牛奶、紙巾…"
                            style={{
                                width: "100%",
                                marginTop: 8,
                                padding: 12,
                                borderRadius: 14,
                                border: "1px solid var(--border)",
                                background: "white",
                                fontSize: 14,
                                fontWeight: 800,
                                color: "#0f172a",
                                minHeight: 100,
                                resize: "vertical",
                            }}
                        />
                    </div>

                    {/* Upload */}
                    <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 950, color: "var(--text)" }}>收據相片（可選）</div>

                        <label
                            style={{
                                display: "block",
                                marginTop: 10,
                                padding: 12,
                                borderRadius: 14,
                                border: "1px dashed rgba(15, 23, 42, 0.25)",
                                background: "rgba(255,255,255,0.7)",
                                cursor: uploading ? "not-allowed" : "pointer",
                                fontWeight: 950,
                                textAlign: "center",
                                color: "var(--text)",
                                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
                            }}
                        >
                            {uploading ? "上載中…" : "＋ 選擇相片（可多張）"}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={uploading}
                                onChange={(e) => onPickFiles(e.target.files)}
                                style={{ display: "none" }}
                            />
                        </label>

                        {images.length ? (
                            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            border: "1px solid var(--border)",
                                            borderRadius: 16,
                                            overflow: "hidden",
                                            position: "relative",
                                            background: "white",
                                            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img.url} alt="receipt" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />

                                        <button
                                            onClick={() => removeImage(idx)}
                                            type="button"
                                            aria-label="Remove image"
                                            style={{
                                                position: "absolute",
                                                top: 8,
                                                right: 8,
                                                padding: "8px 10px",
                                                borderRadius: 999,
                                                border: "1px solid rgba(15, 23, 42, 0.16)",
                                                background: "rgba(255,255,255,0.92)",
                                                fontWeight: 950,
                                                cursor: "pointer",
                                                fontSize: 12,
                                                color: "#0f172a",
                                            }}
                                        >
                                            刪除
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {/* Submit */}
                    <button
                        onClick={submit}
                        disabled={busy || uploading || !householdId}
                        style={{
                            marginTop: 16,
                            width: "100%",
                            padding: 14,
                            borderRadius: 16,
                            border: "1px solid rgba(15, 23, 42, 0.12)",
                            background: busy || uploading ? "#9CA3AF" : "#111",
                            color: "white",
                            fontSize: 16,
                            fontWeight: 950,
                            cursor: busy || uploading ? "not-allowed" : "pointer",
                            boxShadow: busy || uploading ? "none" : "0 14px 34px rgba(15, 23, 42, 0.16)",
                        }}
                    >
                        {busy ? "提交中…" : uploading ? "相片上載中…" : "提交記錄"}
                    </button>

                    {!householdId ? (
                        <div style={{ marginTop: 12, color: "crimson", fontWeight: 950 }}>
                            未找到家庭資料。請用僱主邀請連結加入一次。
                        </div>
                    ) : null}
                </div>
            </main>

            {toast ? (
                <Toast
                    text={toast.text}
                    tone={toast.tone}
                    onClose={() => {
                        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
                        setToast(null);
                    }}
                />
            ) : null}
        </AppShell>
    );
}