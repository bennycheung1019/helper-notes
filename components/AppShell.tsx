"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import InstallPromptBanner from "@/components/pwa/InstallPromptBanner";
import { useI18n } from "@/components/i18n/LangProvider";

export type Role = "helper" | "employer";

type Props = {
    role: Role;
    children: ReactNode;
    title?: string;
    showHeader?: boolean;
};

export function AppShell({ role, children }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const { t, lang } = useI18n();

    // ✅ keep <html lang="..."> aligned (no UI button here)
    useEffect(() => {
        try {
            document.documentElement.lang = lang;
        } catch { }
    }, [lang]);

    // ✅ memo tabs to avoid re-create every render
    const tabs = useMemo(() => {
        return role === "helper"
            ? [
                { key: "add", label: t("nav.add"), href: "/h/add" },
                { key: "records", label: t("nav.records"), href: "/h/records" },
                { key: "settings", label: t("nav.settings"), href: "/h/settings" },
            ]
            : [
                { key: "overview", label: t("nav.overview"), href: "/e/overview" },
                { key: "records", label: t("nav.records"), href: "/e/records" },
                { key: "helpers", label: t("nav.helpers"), href: "/e/helpers" },
                { key: "settings", label: t("nav.settings"), href: "/e/settings" },
            ];
    }, [role, t]);

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    return (
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
            <div style={{ flex: 1, paddingBottom: "calc(76px + env(safe-area-inset-bottom))" }}>{children}</div>

            {/* ✅ PWA Install banner (role-aware) */}
            <InstallPromptBanner role={role} />

            <nav
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "calc(64px + env(safe-area-inset-bottom))",
                    paddingBottom: "env(safe-area-inset-bottom)",
                    background: "var(--card)",
                    borderTop: "1px solid var(--border)",
                    boxShadow: "0 -8px 20px rgba(15, 23, 42, 0.06)",
                    display: "grid",
                    gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
                    zIndex: 50,
                }}
            >
                {tabs.map((tab) => {
                    const active = isActive(tab.href);

                    return (
                        <button
                            key={tab.key}
                            onClick={() => router.push(tab.href)}
                            type="button"
                            aria-current={active ? "page" : undefined}
                            style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                padding: "10px 8px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                color: active ? "var(--text)" : "var(--muted)",
                                fontWeight: 900,
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    width: 26,
                                    height: 4,
                                    borderRadius: 999,
                                    background: active ? "#2563EB" : "transparent",
                                }}
                            />
                            <span style={{ fontSize: 13 }}>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}

export default AppShell;