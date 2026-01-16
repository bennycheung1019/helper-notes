"use client";

import { AppShell } from "@/components/AppShell";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { syncAuthUid } from "@/lib/localAuth";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { useI18n } from "@/components/i18n/LangProvider";
import type { Lang } from "@/lib/i18n";
import { LANG_NAME } from "@/lib/i18n";

type Household = {
    id: string;
    name: string;
    currency: "HKD";
    deletedAt?: any;
};

function safeText(s: unknown) {
    return String(s ?? "").trim();
}

function LoadingCard({ label }: { label: string }) {
    return (
        <div
            style={{
                border: "1px solid var(--border)",
                borderRadius: 22,
                background: "var(--card)",
                boxShadow: "0 18px 48px rgba(18,18,18,0.07)",
                padding: 16,
            }}
        >
            <div style={{ fontWeight: 1000, color: "var(--text)" }}>{label}</div>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            height: 14,
                            borderRadius: 10,
                            background: "rgba(18,18,18,0.06)",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginTop: 14 }}>
            <div
                style={{
                    padding: "0 8px 8px",
                    fontSize: 12,
                    fontWeight: 1000,
                    color: "rgba(18,18,18,0.55)",
                    letterSpacing: 0.2,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    background: "var(--card)",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
                    overflow: "hidden",
                }}
            >
                {children}
            </div>
        </section>
    );
}

function Divider() {
    return <div style={{ height: 1, background: "rgba(15,23,42,0.10)", marginLeft: 14 }} />;
}

function Chevron() {
    return (
        <span
            aria-hidden
            style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(18,18,18,0.12)",
                background: "rgba(255,255,255,0.75)",
                color: "rgba(18,18,18,0.75)",
                fontSize: 14,
                fontWeight: 1100,
                lineHeight: 1,
            }}
        >
            ›
        </span>
    );
}

function Row({
    left,
    right,
    onClick,
    danger,
    disabled,
    hint,
}: {
    left: React.ReactNode;
    right?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
    disabled?: boolean;
    hint?: string;
}) {
    const clickable = !!onClick && !disabled;

    return (
        <button
            type="button"
            onClick={clickable ? onClick : undefined}
            disabled={!clickable}
            style={{
                width: "100%",
                border: "none",
                background: "transparent",
                padding: "14px 14px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                cursor: clickable ? "pointer" : "default",
                textAlign: "left",
            }}
        >
            <div style={{ minWidth: 0 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: danger ? "#991B1B" : "var(--text)",
                        fontWeight: 950,
                    }}
                >
                    {left}
                </div>

                {hint ? (
                    <div
                        style={{
                            marginTop: 6,
                            fontSize: 12,
                            fontWeight: 900,
                            color: "rgba(18,18,18,0.55)",
                            lineHeight: 1.5,
                        }}
                    >
                        {hint}
                    </div>
                ) : null}
            </div>

            {right ? (
                <div
                    style={{
                        minWidth: 0,
                        color: "rgba(18,18,18,0.55)",
                        fontWeight: 950,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                    }}
                >
                    {right}
                </div>
            ) : (
                <div style={{ width: 10, height: 10, borderRadius: 999, opacity: 0 }} />
            )}
        </button>
    );
}

function LangPill({ label }: { label: string }) {
    return (
        <span
            style={{
                padding: "7px 10px",
                borderRadius: 999,
                border: "1px solid rgba(15,23,42,0.12)",
                background: "rgba(15,23,42,0.06)",
                color: "var(--text)",
                fontWeight: 950,
                fontSize: 12,
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </span>
    );
}

function LangModal({
    open,
    current,
    onClose,
    onPick,
    title,
    subtitle,
    closeText,
    selectedText,
}: {
    open: boolean;
    current: Lang;
    onClose: () => void;
    onPick: (l: Lang) => void;
    title: string;
    subtitle: string;
    closeText: string;
    selectedText: string;
}) {
    if (!open) return null;

    const options: Array<{ lang: Lang; title: string; sub: string }> = [
        { lang: "zh-HK", title: "中文（繁體）", sub: "Traditional Chinese" },
        { lang: "en", title: "English", sub: "English" },
        { lang: "id", title: "Bahasa Indonesia", sub: "Indonesian" },
    ];

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 80,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                padding: 14,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "min(520px, 100%)",
                    background: "white",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
                    border: "1px solid rgba(15,23,42,0.12)",
                }}
            >
                <div style={{ padding: 14, borderBottom: "1px solid rgba(15,23,42,0.10)" }}>
                    <div style={{ fontWeight: 1100, color: "#0f172a" }}>{title}</div>
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "rgba(15,23,42,0.55)" }}>
                        {subtitle}
                    </div>
                </div>

                <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {options.map((o) => {
                        const active = o.lang === current;
                        return (
                            <button
                                key={o.lang}
                                type="button"
                                onClick={() => {
                                    onPick(o.lang);
                                    onClose();
                                }}
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    borderRadius: 14,
                                    border: active ? "2px solid rgba(37,99,235,0.45)" : "1px solid rgba(15,23,42,0.12)",
                                    background: active ? "rgba(37,99,235,0.06)" : "rgba(255,255,255,0.95)",
                                    padding: 12,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 1000, color: "#0f172a" }}>{o.title}</div>
                                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 900, color: "rgba(15,23,42,0.55)" }}>
                                        {o.sub}
                                    </div>
                                </div>

                                {active ? (
                                    <span
                                        style={{
                                            padding: "6px 10px",
                                            borderRadius: 999,
                                            background: "rgba(37,99,235,0.12)",
                                            color: "#1D4ED8",
                                            fontWeight: 1000,
                                            fontSize: 12,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {selectedText}
                                    </span>
                                ) : (
                                    <Chevron />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div style={{ padding: 12, borderTop: "1px solid rgba(15,23,42,0.10)" }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: "100%",
                            padding: 12,
                            borderRadius: 14,
                            border: "1px solid rgba(15,23,42,0.12)",
                            background: "rgba(255,255,255,0.9)",
                            fontWeight: 1000,
                            cursor: "pointer",
                        }}
                    >
                        {closeText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function EmployerSettingsPage() {
    const router = useRouter();
    const { t, employerLang, setEmployerLang } = useI18n();

    const [booting, setBooting] = useState(true);

    const [uid, setUid] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [plan, setPlan] = useState<"basic" | "pro">("basic");

    const [household, setHousehold] = useState<Household | null>(null);

    // edit household name
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState("");
    const [busySaveName, setBusySaveName] = useState(false);

    // language modal
    const [langOpen, setLangOpen] = useState(false);

    const householdName = useMemo(() => household?.name || t("settings.household.none"), [household?.name, t]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setBooting(false);
                router.replace("/e/login");
                return;
            }

            syncAuthUid(user.uid);
            setUid(user.uid);
            setEmail(user.email || "");

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
                    setNameDraft("");
                    setBooting(false);
                    return;
                }

                const hsnap = await getDoc(doc(db, "households", hid));
                if (!hsnap.exists()) {
                    setHousehold(null);
                    setNameDraft("");
                    setBooting(false);
                    return;
                }

                const h = hsnap.data() as any;
                if (h?.deletedAt) {
                    setHousehold(null);
                    setNameDraft("");
                    setBooting(false);
                    return;
                }

                const hh: Household = {
                    id: hid,
                    name: safeText(h?.name) || t("settings.household.defaultName"),
                    currency: "HKD",
                };

                setHousehold(hh);
                setNameDraft(hh.name);
                setBooting(false);
            } catch (e) {
                console.error(e);
                setHousehold(null);
                setNameDraft("");
                setBooting(false);
            }
        });

        return () => unsub();
    }, [router, t]);

    async function onLogout() {
        try {
            await signOut(auth);
            router.replace("/e/login");
        } catch (e) {
            console.error(e);
        }
    }

    async function saveHouseholdName() {
        if (!uid || !household?.id) return;

        const newName = safeText(nameDraft);
        if (!newName) return;

        setBusySaveName(true);
        try {
            await updateDoc(doc(db, "households", household.id), {
                name: newName,
                updatedAt: serverTimestamp(),
                updatedByUserId: uid,
            });
            setHousehold((p) => (p ? { ...p, name: newName } : p));
            setEditingName(false);
        } catch (e) {
            console.error(e);
        } finally {
            setBusySaveName(false);
        }
    }

    if (booting) {
        return (
            <AppShell role="employer" title={t("title.employer.settings")}>
                <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                    <LoadingCard label={t("settings.loading")} />
                </main>
            </AppShell>
        );
    }

    return (
        <AppShell role="employer" title={t("title.employer.settings")}>
            <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                {/* Title */}
                <div style={{ padding: "4px 4px 10px" }}>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 1200,
                            letterSpacing: -0.4,
                            color: "var(--text)",
                        }}
                    >
                        {t("title.employer.settings")}
                    </h1>
                </div>

                {/* Account */}
                <Section title={t("settings.section.account")}>
                    <Row
                        left={<span>{t("settings.account.email")}</span>}
                        right={
                            <span
                                style={{
                                    maxWidth: 240,
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    display: "block",
                                }}
                                title={email}
                            >
                                {email || "—"}
                            </span>
                        }
                    />
                    <Divider />
                    <Row left={<span>{t("settings.account.plan")}</span>} right={<span>{plan === "pro" ? "Pro" : "Basic"}</span>} />
                </Section>

                {/* Household */}
                <Section title={t("settings.section.household")}>
                    {!household ? (
                        <Row
                            left={<span>{t("settings.household.label")}</span>}
                            right={<span style={{ fontWeight: 950 }}>{t("settings.household.none")}</span>}
                            onClick={() => router.push("/e/overview")}
                        />
                    ) : (
                        <>
                            {!editingName ? (
                                <Row
                                    left={<span>{t("settings.household.name")}</span>}
                                    right={
                                        <>
                                            <span
                                                style={{
                                                    maxWidth: 220,
                                                    minWidth: 0,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                                title={householdName}
                                            >
                                                {householdName}
                                            </span>
                                            <span
                                                aria-hidden
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 10,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: "1px solid rgba(18,18,18,0.12)",
                                                    background: "rgba(255,255,255,0.75)",
                                                    color: "rgba(18,18,18,0.75)",
                                                    fontSize: 14,
                                                    fontWeight: 1000,
                                                }}
                                            >
                                                ✏️
                                            </span>
                                        </>
                                    }
                                    onClick={() => setEditingName(true)}
                                    hint={t("settings.household.editHint")}
                                />
                            ) : (
                                <div style={{ padding: 14 }}>
                                    <div style={{ fontSize: 12, fontWeight: 1000, color: "rgba(18,18,18,0.55)" }}>
                                        {t("settings.household.name")}
                                    </div>

                                    <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                                        <input
                                            value={nameDraft}
                                            onChange={(e) => setNameDraft(e.target.value)}
                                            placeholder={t("settings.household.placeholder")}
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                padding: 12,
                                                borderRadius: 14,
                                                border: "1px solid rgba(18,18,18,0.12)",
                                                background: "rgba(255,255,255,0.9)",
                                                fontSize: 16,
                                                fontWeight: 950,
                                                outline: "none",
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={saveHouseholdName}
                                            disabled={busySaveName}
                                            style={{
                                                padding: "12px 14px",
                                                borderRadius: 14,
                                                border: "1px solid rgba(18,18,18,0.10)",
                                                background: "var(--brand-green)",
                                                color: "white",
                                                fontWeight: 1100,
                                                cursor: busySaveName ? "not-allowed" : "pointer",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {busySaveName ? t("common.saving") : t("common.save")}
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNameDraft(householdName);
                                            setEditingName(false);
                                        }}
                                        style={{
                                            marginTop: 10,
                                            width: "100%",
                                            padding: 12,
                                            borderRadius: 14,
                                            border: "1px solid rgba(18,18,18,0.12)",
                                            background: "rgba(255,255,255,0.8)",
                                            color: "rgba(18,18,18,0.75)",
                                            fontWeight: 1000,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {t("common.cancel")}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </Section>

                {/* Language (same style as Household section) */}
                <Section title={t("settings.section.general")}>
                    <Row
                        left={<span>{t("settings.general.language")}</span>}
                        right={
                            <>
                                <LangPill label={LANG_NAME[employerLang] || employerLang} />
                                <Chevron />
                            </>
                        }
                        onClick={() => setLangOpen(true)}
                        hint={t("settings.general.languageHint")}
                    />
                </Section>

                {/* Logout */}
                <Section title=" ">
                    <Row
                        left={<span style={{ color: "#991B1B" }}>{t("settings.logout")}</span>}
                        danger
                        onClick={onLogout}
                        hint={t("settings.logoutHint")}
                    />
                </Section>

                <div style={{ height: 18 }} />

                <LangModal
                    open={langOpen}
                    current={employerLang}
                    onClose={() => setLangOpen(false)}
                    onPick={(l) => setEmployerLang(l)}
                    title={t("settings.langModal.title")}
                    subtitle={t("settings.langModal.subtitleEmployer")}
                    closeText={t("common.close")}
                    selectedText={t("common.selected")}
                />
            </main>
        </AppShell>
    );
}