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
    getDocs,
    query,
    setDoc,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import Button from "@/components/ui/Button";
import { useI18n } from "@/components/i18n/LangProvider";

type HelperRow = {
    uid: string;
    label: string;
};

function shortUid(uid: string) {
    return `${uid.slice(0, 6)}…${uid.slice(-4)}`;
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 22a10 10 0 0 0 8.66-15.01A9.98 9.98 0 0 0 12 2 10 10 0 0 0 3.34 17.04L2 22l5.12-1.32A9.95 9.95 0 0 0 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M9.2 8.9c.3-.6.6-.6.9-.6h.7c.2 0 .5.1.6.4l.8 1.9c.1.3.1.6-.1.8l-.6.7c-.1.2-.2.4 0 .7.6 1 1.5 1.9 2.5 2.5.3.2.5.1.7 0l.7-.6c.2-.2.5-.2.8-.1l1.9.8c.3.1.4.4.4.6v.7c0 .3 0 .6-.6.9-.6.3-1.8.7-3.7-.1-2-.8-3.5-2.3-4.3-4.3-.8-1.9-.4-3.1-.1-3.7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function Panel({
    title,
    subtitle,
    children,
    rightSlot,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    rightSlot?: React.ReactNode;
}) {
    return (
        <div
            style={{
                marginTop: 12,
                border: "1px solid rgba(15,23,42,0.10)",
                background: "rgba(255,255,255,0.85)",
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: "0 14px 34px rgba(15, 23, 42, 0.10)",
            }}
        >
            <div
                style={{
                    padding: 14,
                    borderBottom: "1px solid rgba(15,23,42,0.10)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div style={{ fontWeight: 950, color: "var(--text)" }}>{title}</div>
                    {subtitle ? (
                        <div
                            style={{
                                marginTop: 6,
                                fontSize: 12,
                                fontWeight: 900,
                                color: "var(--muted)",
                                lineHeight: 1.55,
                            }}
                        >
                            {subtitle}
                        </div>
                    ) : null}
                </div>

                {rightSlot ? <div>{rightSlot}</div> : null}
            </div>

            <div style={{ padding: 14 }}>{children}</div>
        </div>
    );
}

function SmallCard({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                border: "1px solid rgba(15,23,42,0.10)",
                borderRadius: 16,
                padding: 12,
                background: "rgba(255,255,255,0.90)",
                boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
            }}
        >
            {children}
        </div>
    );
}

function InputBox(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            style={{
                width: "100%",
                padding: 12,
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "white",
                fontSize: 13,
                fontWeight: 900,
                color: "#111",
                ...((props.style as any) || {}),
            }}
        />
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

export default function EmployerHelpersPage() {
    const router = useRouter();
    const { t } = useI18n();

    // ✅ booting skeleton (like overview page)
    const [booting, setBooting] = useState(true);

    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [plan, setPlan] = useState<"basic" | "pro">("basic");

    const [rows, setRows] = useState<HelperRow[]>([]);
    const [inviteUrl, setInviteUrl] = useState<string>("");

    const [msg, setMsg] = useState("");
    const [busyInvite, setBusyInvite] = useState(false);

    // list actions
    const [editingUid, setEditingUid] = useState<string | null>(null);
    const [draftLabel, setDraftLabel] = useState<string>("");
    const [busyUid, setBusyUid] = useState<string | null>(null); // for save/remove

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setMsg("");

            if (!user) {
                setBooting(false);
                router.replace("/e/login");
                return;
            }

            syncAuthUid(user.uid);

            try {
                const usnap = await getDoc(doc(db, "users", user.uid));
                const u = usnap.exists() ? (usnap.data() as any) : null;

                const hid =
                    (u?.defaultHouseholdId as string | undefined) ||
                    window.localStorage.getItem("defaultHouseholdId") ||
                    null;

                setPlan(u?.plan === "pro" ? "pro" : "basic");
                setHouseholdId(hid);

                if (hid) {
                    await loadHelpers(hid);
                }
            } catch (e) {
                console.error(e);
                setMsg(t("helpers.loadFail"));
            } finally {
                setBooting(false);
            }
        });

        return () => unsub();
    }, [router, t]);

    async function loadHelpers(hid: string) {
        setMsg("");
        try {
            const qh = query(collection(db, "households", hid, "members"), where("role", "==", "helper"));
            const snap = await getDocs(qh);

            const list = snap.docs
                .map((d) => {
                    const data = d.data() as any;
                    return {
                        uid: d.id,
                        label: String(data?.label || t("helpers.defaultLabel")),
                        disabledAt: data?.disabledAt ?? null,
                    };
                })
                .filter((x) => !x.disabledAt)
                .map((x) => ({ uid: x.uid, label: x.label }));

            list.sort((a, b) => a.label.localeCompare(b.label) || a.uid.localeCompare(b.uid));
            setRows(list);
        } catch (e) {
            console.error(e);
            setMsg(t("helpers.readFail"));
        }
    }

    const helperCount = rows.length;

    const canCreateInvite = useMemo(() => {
        if (!householdId) return false;
        if (plan === "pro") return true;
        // basic: only 1 helper allowed
        return helperCount < 1;
    }, [householdId, plan, helperCount]);

    async function onCreateInvite() {
        if (!householdId || !auth.currentUser) return;

        setMsg("");

        if (!canCreateInvite) {
            setMsg(t("helpers.limit.basicFull"));
            return;
        }

        setBusyInvite(true);
        try {
            const token = crypto.randomUUID();

            await setDoc(doc(db, "invites", token), {
                householdId,
                roleToJoin: "helper",
                createdByUserId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
                expiresAt: null,
                revokedAt: null,
                usedAt: null,
                usedByUserId: null,
            });

            const url = `${window.location.origin}/join/${token}`;
            setInviteUrl(url);
            setMsg(t("helpers.invite.created"));
        } catch (e) {
            console.error(e);
            setMsg(t("helpers.invite.createFail"));
        } finally {
            setBusyInvite(false);
        }
    }

    async function onCopy() {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setMsg(t("helpers.invite.copied"));
        } catch {
            setMsg(t("helpers.invite.copyFail"));
        }
    }

    function onShareWhatsapp() {
        if (!inviteUrl) return;
        const text = t("helpers.invite.waText").replace("{url}", inviteUrl);
        const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(wa, "_blank");
    }

    function startEdit(r: HelperRow) {
        setEditingUid(r.uid);
        setDraftLabel((r.label || t("helpers.defaultLabel")).trim() || t("helpers.defaultLabel"));
        setMsg("");
    }

    function cancelEdit() {
        setEditingUid(null);
        setDraftLabel("");
    }

    async function saveLabel(uid: string) {
        if (!householdId) return;

        const label = (draftLabel || "").trim() || t("helpers.defaultLabel");
        setBusyUid(uid);
        setMsg("");

        try {
            await updateDoc(doc(db, "households", householdId, "members", uid), { label });
            setRows((prev) => prev.map((x) => (x.uid === uid ? { ...x, label } : x)));
            setMsg(t("helpers.saveOk"));
            cancelEdit();
        } catch (e) {
            console.error(e);
            setMsg(t("helpers.saveFail"));
        } finally {
            setBusyUid(null);
        }
    }

    async function removeHelper(uid: string) {
        if (!householdId || !auth.currentUser) return;

        const r = rows.find((x) => x.uid === uid);
        const name = r?.label?.trim() || t("helpers.defaultLabel");

        const ok = window.confirm(
            t("helpers.remove.confirm")
                .replace("{name}", name)
        );
        if (!ok) return;

        setBusyUid(uid);
        setMsg("");

        try {
            await updateDoc(doc(db, "households", householdId, "members", uid), {
                disabledAt: serverTimestamp(),
                disabledByUserId: auth.currentUser.uid,
            });

            setRows((prev) => prev.filter((x) => x.uid !== uid));
            if (editingUid === uid) cancelEdit();

            setMsg(t("helpers.remove.ok"));
            setInviteUrl("");
        } catch (e) {
            console.error(e);
            setMsg(t("helpers.remove.fail"));
        } finally {
            setBusyUid(null);
        }
    }

    // ✅ booting skeleton
    if (booting) {
        return (
            <AppShell role="employer" title={t("title.employer.helpers")}>
                <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                    <LoadingCard label={t("common.loading")} />
                </main>
            </AppShell>
        );
    }

    return (
        <AppShell role="employer" title={t("title.employer.helpers")}>
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: "var(--text)" }}>
                            {t("helpers.title")}
                        </h1>

                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>
                            {t("helpers.joined")
                                .replace("{n}", String(helperCount))}
                            {plan !== "pro" ? (
                                <span style={{ marginLeft: 8 }}>
                                    {t("helpers.basicHint")}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* msg */}
                {msg ? (
                    <div
                        style={{
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 14,
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            color: msg.includes("fail") || msg.includes("Fail") || msg.includes("失敗") ? "#991B1B" : "var(--text)",
                            fontWeight: 950,
                            boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
                        }}
                    >
                        {msg}
                    </div>
                ) : null}

                {/* Invite panel */}
                <Panel
                    title={t("helpers.invite.title")}
                    subtitle={t("helpers.invite.sub")}
                >
                    {!inviteUrl ? (
                        <>
                            <Button
                                tone={canCreateInvite ? "primary" : "outline"}
                                fullWidth
                                onClick={onCreateInvite}
                                disabled={busyInvite || !householdId || !canCreateInvite}
                            >
                                {busyInvite
                                    ? t("helpers.invite.busy")
                                    : !canCreateInvite
                                        ? t("helpers.invite.limit")
                                        : t("helpers.invite.cta")}
                            </Button>

                            {!canCreateInvite ? (
                                <div
                                    style={{
                                        marginTop: 10,
                                        fontSize: 12,
                                        fontWeight: 900,
                                        color: "#991B1B",
                                        lineHeight: 1.55,
                                    }}
                                >
                                    {t("helpers.invite.needPro")}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 12, fontWeight: 950, color: "var(--muted)" }}>
                                {t("helpers.invite.oneTimeLabel")}
                            </div>

                            <InputBox value={inviteUrl} readOnly style={{ marginTop: 8 }} />

                            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                                <Button tone="outline" fullWidth={false} onClick={onCopy}>
                                    {t("common.copy")}
                                </Button>

                                <button
                                    type="button"
                                    onClick={onShareWhatsapp}
                                    style={{
                                        border: "1px solid rgba(15,23,42,0.12)",
                                        borderRadius: 14,
                                        padding: "10px 12px",
                                        fontWeight: 950,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        background: "rgba(34,197,94,0.15)",
                                        color: "#166534",
                                        boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
                                        WebkitTapHighlightColor: "transparent",
                                    }}
                                    aria-label={t("helpers.invite.waShareAria")}
                                    title={t("helpers.invite.waShareTitle")}
                                >
                                    <WhatsAppIcon />
                                    WhatsApp
                                </button>

                                <Button
                                    tone="outline"
                                    fullWidth={false}
                                    onClick={() => {
                                        setInviteUrl("");
                                        setMsg("");
                                    }}
                                >
                                    {t("helpers.invite.regen")}
                                </Button>
                            </div>

                            <div style={{ marginTop: 10, color: "var(--muted)", fontWeight: 900, fontSize: 12, lineHeight: 1.55 }}>
                                {t("helpers.invite.tip")}
                            </div>
                        </>
                    )}
                </Panel>

                {/* Helpers list panel */}
                <Panel
                    title={t("helpers.list.title")}
                    subtitle={t("helpers.list.sub")}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {rows.length === 0 ? (
                            <div style={{ color: "var(--muted)", fontWeight: 900 }}>
                                {t("helpers.list.empty")}
                            </div>
                        ) : (
                            rows.map((r) => {
                                const isEditing = editingUid === r.uid;
                                const busy = busyUid === r.uid;

                                return (
                                    <SmallCard key={r.uid}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 12,
                                                alignItems: "flex-start",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <div style={{ minWidth: 240 }}>
                                                <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(15,23,42,0.55)" }}>
                                                    {t("helpers.uidLabel").replace("{uid}", shortUid(r.uid))}
                                                </div>

                                                {!isEditing ? (
                                                    <div style={{ marginTop: 8, fontSize: 16, fontWeight: 950, color: "var(--text)" }}>
                                                        {r.label?.trim() || t("helpers.defaultLabel")}
                                                    </div>
                                                ) : (
                                                    <div style={{ marginTop: 10 }}>
                                                        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                                                            {t("helpers.edit.displayName")}
                                                        </div>
                                                        <InputBox
                                                            value={draftLabel}
                                                            onChange={(e) => setDraftLabel(e.target.value)}
                                                            placeholder={t("helpers.edit.placeholder")}
                                                            style={{ marginTop: 8, width: "min(360px, 100%)", fontSize: 14 }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                                {!isEditing ? (
                                                    <>
                                                        <Button
                                                            tone="outline"
                                                            fullWidth={false}
                                                            onClick={() => startEdit(r)}
                                                            disabled={busy || busyInvite}
                                                        >
                                                            {t("common.edit")}
                                                        </Button>
                                                        <Button
                                                            tone="danger"
                                                            fullWidth={false}
                                                            onClick={() => removeHelper(r.uid)}
                                                            disabled={busy || busyInvite}
                                                        >
                                                            {busy ? t("helpers.remove.busy") : t("common.remove")}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            tone="primary"
                                                            fullWidth={false}
                                                            onClick={() => saveLabel(r.uid)}
                                                            disabled={busy}
                                                        >
                                                            {busy ? t("common.saving") : t("common.save")}
                                                        </Button>
                                                        <Button
                                                            tone="outline"
                                                            fullWidth={false}
                                                            onClick={cancelEdit}
                                                            disabled={busy}
                                                        >
                                                            {t("common.cancel")}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </SmallCard>
                                );
                            })
                        )}
                    </div>
                </Panel>

                {!householdId ? (
                    <div style={{ marginTop: 12, color: "#991B1B", fontWeight: 950 }}>
                        {t("helpers.noHousehold")}
                    </div>
                ) : null}
            </main>
        </AppShell>
    );
}