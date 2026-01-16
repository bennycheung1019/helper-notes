"use client";

import * as React from "react";
import { useI18n } from "@/components/i18n/LangProvider";

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
    const { t } = useI18n();

    // 你原本邏輯：count <= 1 就唔顯示
    if (count <= 1) return null;

    const more = count - 1;

    // ✅ 因為 t() 只收 1 個參數，所以用「拼字」方式
    // e.g. "+2 張", "+2 more photos", "+2 foto lagi"
    return (
        <span
            style={{
                fontSize: 12,
                fontWeight: 950,
                color: "var(--muted)",
                whiteSpace: "nowrap",
            }}
            aria-label={`${t("records.photos.morePrefix")} ${more} ${t("records.photos.moreSuffix")}`}
        >
            {t("records.photos.morePrefix")}
            {more}
            {t("records.photos.moreSuffix")}
        </span>
    );
}