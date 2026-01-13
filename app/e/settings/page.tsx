"use client";

import { AppShell } from "@/components/AppShell";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { syncAuthUid } from "@/lib/localAuth";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
    setDoc,
} from "firebase/firestore";

type Household = {
    id: string;
    name: string;
    currency: "HKD";
    deletedAt?: any;
};

function safeText(s: unknown) {
    return String(s ?? "").trim();
}

function LoadingCard({ label = "載入中…" }: { label?: string }) {
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

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
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

function Row({
    left,
    right,
    onClick,
    danger,
    disabled,
}: {
    left: React.ReactNode;
    right?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
    disabled?: boolean;
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
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                cursor: clickable ? "pointer" : "default",
                textAlign: "left",
            }}
        >
            <div
                style={{
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: danger ? "#991B1B" : "var(--text)",
                    fontWeight: 950,
                }}
            >
                {left}
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
                    }}
                >
                    {right}
                </div>
            ) : (
                <div
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        opacity: 0,
                    }}
                />
            )}
        </button>
    );
}

function Divider() {
    return (
        <div style={{ height: 1, background: "rgba(15,23,42,0.10)", marginLeft: 14 }} />
    );
}

export default function EmployerSettingsPage() {
    const router = useRouter();

    const [booting, setBooting] = useState(true);

    const [uid, setUid] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [plan, setPlan] = useState<"basic" | "pro">("basic");

    const [household, setHousehold] = useState<Household | null>(null);

    // edit household name
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState("");
    const [busySaveName, setBusySaveName] = useState(false);

    // language (future)
    const [language, setLanguage] = useState<"zh-HK" | "en">("zh-HK");

    // future toggles placeholders
    const [futurePushEnabled] = useState(false);
    const [futureExportEnabled] = useState(false);

    const householdName = useMemo(() => household?.name || "未建立", [household?.name]);

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
                    name: safeText(h?.name) || "我屋企",
                    currency: "HKD",
                };

                setHousehold(hh);
                setNameDraft(hh.name);

                // (optional) load future language setting if you store it later:
                // setLanguage(u?.language === "en" ? "en" : "zh-HK");

                setBooting(false);
            } catch (e) {
                console.error(e);
                setHousehold(null);
                setNameDraft("");
                setBooting(false);
            }
        });

        return () => unsub();
    }, [router]);

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
            // keep editing mode so user can retry
        } finally {
            setBusySaveName(false);
        }
    }

    async function onChangeLanguage(next: "zh-HK" | "en") {
        setLanguage(next);

        // ✅ future: save to users doc
        try {
            if (uid) {
                await setDoc(
                    doc(db, "users", uid),
                    { language: next, updatedAt: serverTimestamp() },
                    { merge: true }
                );
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (booting) {
        return (
            <AppShell role="employer" title="設定">
                <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
                    <LoadingCard label="正在載入設定…" />
                </main>
            </AppShell>
        );
    }

    return (
        <AppShell role="employer" title="設定">
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
                        設定
                    </h1>
                </div>

                {/* Account */}
                <Section title="帳戶">
                    <Row
                        left={<span>登入電郵</span>}
                        right={
                            <span
                                style={{
                                    maxWidth: 220,
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
                    <Row
                        left={<span>方案</span>}
                        right={<span>{plan === "pro" ? "Pro" : "Basic"}</span>}
                    />
                </Section>

                {/* Household */}
                <Section title="家庭">
                    {!household ? (
                        <Row
                            left={<span>家庭</span>}
                            right={<span style={{ fontWeight: 950 }}>未建立</span>}
                            onClick={() => router.push("/e/overview")}
                        />
                    ) : (
                        <>
                            {!editingName ? (
                                <Row
                                    left={<span>家庭名稱</span>}
                                    right={
                                        <>
                                            <span
                                                style={{
                                                    maxWidth: 200,
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
                                />
                            ) : (
                                <div style={{ padding: 14 }}>
                                    <div style={{ fontSize: 12, fontWeight: 1000, color: "rgba(18,18,18,0.55)" }}>
                                        家庭名稱
                                    </div>

                                    <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                                        <input
                                            value={nameDraft}
                                            onChange={(e) => setNameDraft(e.target.value)}
                                            placeholder="例如：我屋企"
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
                                            {busySaveName ? "儲存…" : "儲存"}
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
                                        取消
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </Section>

                {/* Language + future */}
                <Section title="一般">
                    <Row
                        left={<span>Language</span>}
                        right={<span>{language === "zh-HK" ? "繁體中文" : "English"}</span>}
                        onClick={() => {
                            // super simple toggle now; later you can replace with a modal picker
                            onChangeLanguage(language === "zh-HK" ? "en" : "zh-HK");
                        }}
                    />
                    <Divider />

                    <Row
                        left={<span>通知（推送）</span>}
                        right={<span>{futurePushEnabled ? "On" : "Off"}</span>}
                        disabled
                    />
                    <Divider />

                    <Row
                        left={<span>CSV 匯出</span>}
                        right={<span>{futureExportEnabled ? "可用" : "未開放"}</span>}
                        disabled
                    />
                    <Divider />

                    <Row left={<span>資料備份</span>} right={<span>未開放</span>} disabled />
                    <Divider />

                    <Row left={<span>安全性</span>} right={<span>未開放</span>} disabled />
                </Section>

                {/* Logout */}
                <Section title=" ">
                    <Row left={<span style={{ color: "#991B1B" }}>登出</span>} danger onClick={onLogout} />
                </Section>

                {/* Small footer spacing */}
                <div style={{ height: 18 }} />
            </main>
        </AppShell>
    );
}
