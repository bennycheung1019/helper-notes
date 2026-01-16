"use client";

import * as React from "react";
import { useMemo } from "react";
import { RecordCard, RecordCardItem } from "./RecordCard";
import { useI18n } from "@/components/i18n/LangProvider";

/* ===== utils ===== */
function ymd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function localeFromLang(lang: string) {
    // your i18n langs: zh-HK / en / id
    if (lang === "zh-HK") return "zh-HK";
    if (lang === "id") return "id-ID";
    return "en";
}

/* ===== types ===== */
export type RecordListItem = RecordCardItem & {
    createdAt?: any; // Firestore Timestamp | Date
};

/* ===== component ===== */
export function RecordList({
    items,
    onItemClick,
    onPreviewClick,
    photoCountPlacement = "pill",
    rightSlot,
    dayRightSlot,
}: {
    items: RecordListItem[];
    onItemClick?: (id: string) => void;
    onPreviewClick?: (id: string, url: string) => void;
    photoCountPlacement?: "pill" | "thumbnail";
    rightSlot?: (item: RecordListItem) => React.ReactNode;
    dayRightSlot?: (dateKey: string, rows: RecordListItem[]) => React.ReactNode;
}) {
    const { t, lang } = useI18n();

    /* ===== group by date ===== */
    const grouped = useMemo(() => {
        const map = new Map<string, { date: Date; rows: RecordListItem[] }>();

        for (const it of items) {
            const d: Date | null =
                it.createdAt?.toDate?.() ??
                (it.createdAt instanceof Date ? it.createdAt : null);

            const key = d ? ymd(d) : "unknown";
            const dateObj = d || new Date(0);

            if (!map.has(key)) {
                map.set(key, { date: dateObj, rows: [] });
            }
            map.get(key)!.rows.push(it);
        }

        const arr = Array.from(map.entries()).map(([key, v]) => {
            const rows = [...v.rows].sort((a, b) => {
                const da: Date | null =
                    a.createdAt?.toDate?.() ??
                    (a.createdAt instanceof Date ? a.createdAt : null);
                const db: Date | null =
                    b.createdAt?.toDate?.() ??
                    (b.createdAt instanceof Date ? b.createdAt : null);

                return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
            });

            return { key, date: v.date, rows };
        });

        // newest day first
        arr.sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
        return arr;
    }, [items]);

    /* ===== date label ===== */
    const prettyDateRowLabel = useMemo(() => {
        const todayKey = ymd(new Date());
        const fmt = new Intl.DateTimeFormat(localeFromLang(lang), {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

        return (d: Date) => {
            if (ymd(d) === todayKey) return t("records.date.today");
            return fmt.format(d);
        };
    }, [lang, t]);

    /* ===== render ===== */
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {grouped.map((g) => (
                <section key={g.key}>
                    {/* date header */}
                    <div
                        style={{
                            margin: "4px 0 10px",
                            padding: "10px 2px",
                            borderBottom: "1px solid rgba(15,23,42,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                color: "rgba(15,23,42,0.62)",
                                fontWeight: 950,
                                letterSpacing: 0.2,
                            }}
                        >
                            {g.key === "unknown"
                                ? t("records.date.unknown")
                                : prettyDateRowLabel(g.date)}
                        </div>

                        {dayRightSlot ? (
                            <div
                                style={{
                                    color: "rgba(15,23,42,0.55)",
                                    fontWeight: 950,
                                    fontSize: 12,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {dayRightSlot(g.key, g.rows)}
                            </div>
                        ) : null}
                    </div>

                    {/* cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {g.rows.map((it) => (
                            <RecordCard
                                key={it.id}
                                item={it}
                                photoCountPlacement={photoCountPlacement}
                                onClick={onItemClick ? () => onItemClick(it.id) : undefined}
                                onPreviewClick={
                                    onPreviewClick
                                        ? (url) => onPreviewClick(it.id, url)
                                        : undefined
                                }
                                rightSlot={rightSlot ? rightSlot(it) : undefined}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}