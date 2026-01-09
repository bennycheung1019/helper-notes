"use client";

import * as React from "react";
import { RecordStatusTag } from "@/components/records/RecordStatusTag";
import { CategoryPill, PhotoCount } from "@/components/records/RecordPills";

export type ReceiptImage = { url: string; path?: string; uploadedAtMs?: number };

export type RecordCardItem = {
    id: string;
    amountCents: number;
    status: "submitted" | "approved" | "flagged";
    category?: string;
    note?: string;
    receiptImages?: ReceiptImage[];
};

function centsToHKD(cents: number) {
    const v = (cents || 0) / 100;
    return v.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RecordCard({
    item,
    onClick,
    onPreviewClick,
    rightSlot,
    photoCountPlacement = "pill", // ✅ 新增：pill | thumbnail
}: {
    item: RecordCardItem;
    onClick?: () => void;
    onPreviewClick?: (url: string) => void;
    rightSlot?: React.ReactNode;
    photoCountPlacement?: "pill" | "thumbnail";
}) {
    const category = (item.category || "其他").trim() || "其他";
    const note = (item.note || "").trim();
    const imgCount = item.receiptImages?.length ?? 0;
    const preview = imgCount > 0 ? item.receiptImages![0].url : null;
    const moreCount = imgCount > 1 ? imgCount - 1 : 0;

    return (
        <div
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
                if (!onClick) return;
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
            style={{
                width: "100%",
                textAlign: "left",
                border: "1px solid rgba(15, 23, 42, 0.10)",
                background: "var(--card)",
                borderRadius: 18,
                padding: 14,
                cursor: onClick ? "pointer" : "default",
                boxShadow: "0 14px 34px rgba(15, 23, 42, 0.10)",
                position: "relative",
            }}
        >
            <RecordStatusTag status={item.status} />

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: preview ? "1fr 76px" : "1fr",
                    gap: 12,
                    alignItems: "start",
                    paddingLeft: 68,
                }}
            >
                {/* ROW 1 / COL 1 */}
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 950, color: "var(--text)" }}>
                        HK$ {centsToHKD(item.amountCents)}
                    </div>

                    <div
                        style={{
                            marginTop: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <CategoryPill text={category} />

                            {/* ✅ 只喺 pill 模式先顯示 */}
                            {photoCountPlacement === "pill" ? <PhotoCount count={imgCount} /> : null}
                        </div>
                    </div>

                    {note ? (
                        <div
                            style={{
                                marginTop: 10,
                                color: "rgba(15,23,42,0.55)",
                                fontSize: 14,
                                fontWeight: 700,
                                lineHeight: 1.35,
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                            }}
                        >
                            {note}
                        </div>
                    ) : null}
                </div>

                {/* ROW 1 / COL 2 */}
                {preview ? (
                    <div
                        onClick={(e) => {
                            if (!onPreviewClick) return;
                            e.stopPropagation();
                            onPreviewClick(preview);
                        }}
                        style={{
                            width: 76,
                            height: 76,
                            borderRadius: 16,
                            overflow: "hidden",
                            border: "1px solid rgba(15,23,42,0.10)",
                            background: "white",
                            boxShadow: "0 10px 22px rgba(15, 23, 42, 0.10)",
                            cursor: onPreviewClick ? "pointer" : "default",
                            justifySelf: "end",
                            position: "relative",
                        }}
                        aria-label={onPreviewClick ? "Open receipt image" : "receipt image"}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview}
                            alt="receipt"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />

                        {/* ✅ thumbnail badge：只喺 thumbnail 模式顯示 */}
                        {photoCountPlacement === "thumbnail" && moreCount > 0 ? (
                            <span
                                style={{
                                    position: "absolute",
                                    right: 6,
                                    bottom: 6,
                                    padding: "3px 6px",
                                    borderRadius: 999,
                                    background: "rgba(15,23,42,0.72)",
                                    color: "white",
                                    fontSize: 11,
                                    fontWeight: 950,
                                    lineHeight: 1,
                                }}
                            >
                                +{moreCount}
                            </span>
                        ) : null}
                    </div>
                ) : null}

                {/* ROW 2: actions pinned bottom-right */}
                {rightSlot ? (
                    <div
                        style={{
                            gridColumn: "1 / -1",
                            marginTop: 12,
                            display: "flex",
                            gap: 10,
                            justifyContent: "flex-end",
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        {rightSlot}
                    </div>
                ) : null}
            </div>
        </div>
    );
}