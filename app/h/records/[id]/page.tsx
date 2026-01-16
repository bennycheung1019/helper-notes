"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { syncAuthUid } from "@/lib/localAuth";
import { doc, getDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

import { consumeReturnTo } from "@/lib/returnTo";
import { useI18n } from "@/components/i18n/LangProvider";

/* ---------- types ---------- */

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
    receiptImages?: ReceiptImage[];
    createdAt?: any;
    updatedAt?: any;
};

/* ---------- helpers ---------- */

function centsFromHKDString(s: string) {
    const v = Number(String(s || "").replace(/[^\d.]/g, ""));
    if (!isFinite(v) || v <= 0) return 0;
    return Math.round(v * 100);
}
function hkdFromCents(cents: number) {
    return (cents / 100).toFixed(2);
}
function pad2(n: number) {
    return String(n).padStart(2, "0");
}
function formatTimeHHMM(d: Date) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function ymd(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/* ---------- UI bits ---------- */

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
                whiteSpace: "nowrap",
            }}
        >
            {text}
        </button>
    );
}

/* ---------- main ---------- */

export default function HelperRecordEditPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: recordId } = React.use(params);
    const { t } = useI18n();

    const [loading, setLoading] = useState(true);
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [original, setOriginal] = useState<RecordDoc | null>(null);

    const [amountStr, setAmountStr] = useState("");
    const [category, setCategory] = useState<string>("food");
    const [note, setNote] = useState("");
    const [images, setImages] = useState<ReceiptImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const amountCents = useMemo(() => centsFromHKDString(amountStr), [amountStr]);
    const amountPreview = useMemo(() => hkdFromCents(amountCents), [amountCents]);

    const createdInfo = useMemo(() => {
        const d: Date | null = original?.createdAt?.toDate?.() ?? null;
        if (!d) return null;
        const today = ymd(new Date());
        const target = ymd(d);
        return {
            day:
                target === today
                    ? t("common.today")
                    : `${d.getFullYear()}${t("date.year")}${d.getMonth() + 1}${t("date.month")}${d.getDate()}${t("date.day")}`,
            time: formatTimeHHMM(d),
        };
    }, [original?.createdAt, t]);

    function canEdit() {
        if (!original || !uid) return false;
        if (original.status !== "submitted") return false;
        if (original.createdByUserId && original.createdByUserId !== uid) return false;
        return true;
    }

    function handleBack() {
        const rt = consumeReturnTo();
        if (rt) return router.replace(rt);
        router.replace("/h/records");
    }

    /* ---------- auth + load ---------- */

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.replace(`/h/login`);
                return;
            }

            syncAuthUid(user.uid);
            setUid(user.uid);

            const hid = window.localStorage.getItem("helperHouseholdId");
            if (!hid) {
                setMsg(t("hRecordEdit.noHousehold"));
                setLoading(false);
                return;
            }

            setHouseholdId(hid);
            await loadRecord(hid, user.uid, recordId);
        });

        return () => unsub();
    }, [router, recordId, t]);

    async function loadRecord(hid: string, userId: string, rid: string) {
        setLoading(true);
        setMsg("");

        try {
            const rsnap = await getDoc(doc(db, "households", hid, "records", rid));
            if (!rsnap.exists()) {
                setMsg(t("hRecordEdit.notFound"));
                setOriginal(null);
                return;
            }

            const data = rsnap.data() as RecordDoc;
            setOriginal(data);

            setAmountStr(hkdFromCents(data.amountCents || 0));
            setCategory(data.category || "food");
            setNote(data.note || "");
            setImages(data.receiptImages || []);

            if (data.createdByUserId && data.createdByUserId !== userId) {
                setMsg(t("hRecordEdit.notOwner"));
            } else if (data.status !== "submitted") {
                setMsg(t("hRecordEdit.locked"));
            }
        } catch (e) {
            console.error(e);
            setMsg(t("hRecordEdit.loadFail"));
        } finally {
            setLoading(false);
        }
    }

    /* ---------- save ---------- */

    async function onSave() {
        if (!householdId || !uid || !original) return;
        if (!canEdit()) {
            setMsg(t("hRecordEdit.locked"));
            return;
        }
        if (amountCents <= 0) {
            setMsg(t("hRecordEdit.invalidAmount"));
            return;
        }

        setBusy(true);
        setMsg("");

        try {
            const householdRef = doc(db, "households", householdId);
            const recordRef = doc(db, "households", householdId, "records", recordId);

            await runTransaction(db, async (tx) => {
                const rsnap = await tx.get(recordRef);
                if (!rsnap.exists()) throw new Error("not_found");

                const old = rsnap.data() as any;
                const delta = amountCents - (old.amountCents || 0);

                tx.update(recordRef, {
                    amountCents,
                    category,
                    note,
                    receiptImages: images,
                    updatedAt: serverTimestamp(),
                    updatedByUserId: uid,
                });

                const hsnap = await tx.get(householdRef);
                const cash = Number(hsnap.data()?.cashCents ?? 0);
                tx.update(householdRef, { cashCents: cash - delta });
            });

            setMsg(t("common.saved"));
        } catch (e) {
            console.error(e);
            setMsg(t("common.saveFail"));
        } finally {
            setBusy(false);
        }
    }

    const locked = original && !canEdit();

    return (
        <AppShell role="helper" title={t("title.helper.recordDetail")}>
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                            {createdInfo
                                ? t("hRecordEdit.header")
                                    .replace("{day}", createdInfo.day)
                                    .replace("{time}", createdInfo.time)
                                : t("hRecordEdit.title")}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 950 }}>HK$ {amountPreview}</div>
                    </div>

                    <button onClick={handleBack} style={{ fontWeight: 900 }}>
                        ← {t("common.back")}
                    </button>
                </div>

                {/* form */}
                <div style={{ marginTop: 16 }}>
                    {msg && (
                        <div style={{ padding: 12, borderRadius: 14, background: "#fee2e2", color: "#991b1b", fontWeight: 900 }}>
                            {msg}
                        </div>
                    )}

                    <div style={{ marginTop: 14 }}>
                        <label>{t("hRecordEdit.amount")}</label>
                        <input
                            value={amountStr}
                            onChange={(e) => setAmountStr(e.target.value)}
                            disabled={!canEdit()}
                            placeholder={t("hRecordEdit.amountPlaceholder")}
                        />
                    </div>

                    <div style={{ marginTop: 14 }}>
                        <label>{t("hRecordEdit.category")}</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {["food", "daily", "transport", "other"].map((c) => (
                                <CategoryPill
                                    key={c}
                                    text={t(`category.${c}`)}
                                    active={category === c}
                                    disabled={!canEdit()}
                                    onClick={() => setCategory(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                        <label>{t("hRecordEdit.note")}</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={!canEdit()}
                            placeholder={t("hRecordEdit.notePlaceholder")}
                        />
                    </div>

                    <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                        <button onClick={handleBack}>{t("common.back")}</button>
                        <button onClick={onSave} disabled={!canEdit() || busy || uploading}>
                            {busy ? t("common.saving") : t("common.save")}
                        </button>
                    </div>
                </div>
            </main>
        </AppShell>
    );
}