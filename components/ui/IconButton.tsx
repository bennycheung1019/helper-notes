"use client";

import * as React from "react";

export function IconButton({
    title,
    onClick,
    activeDot,
    disabled,
    children,
}: {
    title: string;
    onClick?: () => void;
    activeDot?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            disabled={disabled}
            style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "white",
                boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.55 : 1,
                position: "relative",
                WebkitTapHighlightColor: "transparent",
            }}
            aria-label={title}
        >
            {children}
            {activeDot ? (
                <span
                    style={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "#EF4444",
                        boxShadow: "0 0 0 2px white",
                    }}
                />
            ) : null}
        </button>
    );
}

export function FilterIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 6h16M7 12h10M10 18h4"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function DownloadIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 3v10m0 0 4-4m-4 4-4-4"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M5 17v3h14v-3"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function BackIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}