"use client";

import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export type Role = "helper" | "employer";

type Props = {
    role: Role;
    children: ReactNode;

    /**
     * Optional page title.
     * We accept it to avoid TS errors, but we DO NOT render any header by default
     * (so your UI stays exactly the same).
     */
    title?: string;

    /**
     * Future use: if you ever want AppShell to render a top header.
     * Default false, so current UI stays unchanged.
     */
    showHeader?: boolean;
};

export function AppShell({ role, children /* title, showHeader */ }: Props) {
    const pathname = usePathname();
    const router = useRouter();

    const tabs =
        role === "helper"
            ? [
                { key: "add", label: "新增", href: "/h/add" },
                { key: "records", label: "記錄", href: "/h/records" },
                { key: "settings", label: "設定", href: "/h/settings" }, // ✅ 加呢行
            ]
            : [
                { key: "overview", label: "總覽", href: "/e/overview" },
                { key: "records", label: "記錄", href: "/e/records" },
                { key: "helpers", label: "姐姐", href: "/e/helpers" },
                { key: "settings", label: "設定", href: "/e/settings" }, // 之後做
            ];

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    return (
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
            <div style={{ flex: 1, paddingBottom: "calc(76px + env(safe-area-inset-bottom))" }}>{children}</div>

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
                {tabs.map((t) => {
                    const active = isActive(t.href);
                    return (
                        <button
                            key={t.key}
                            onClick={() => router.push(t.href)}
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
                            }}
                        >
                            <span
                                style={{
                                    width: 26,
                                    height: 4,
                                    borderRadius: 999,
                                    background: active ? "#2563EB" : "transparent",
                                }}
                            />
                            <span style={{ fontSize: 13 }}>{t.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}