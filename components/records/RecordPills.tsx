"use client";

import * as React from "react";

export function CategoryPill({ text }: { text: string }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.85)",
                color: "var(--text)",
                fontSize: 12,
                fontWeight: 900,
                lineHeight: 1,
                whiteSpace: "nowrap",
            }}
        >
            {text}
        </span>
    );
}

export function PhotoCount({ count }: { count: number }) {
    if (count <= 1) return null;
    return (
        <span
            style={{
                fontSize: 12,
                fontWeight: 950,
                color: "var(--muted)",
                whiteSpace: "nowrap",
            }}
        >
            +{count - 1} 張
        </span>
    );
}