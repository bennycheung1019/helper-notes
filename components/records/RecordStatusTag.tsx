"use client";

import * as React from "react";
import { useI18n } from "@/components/i18n/LangProvider";

export type RecordStatus = "submitted" | "approved" | "flagged";

function statusColor(s: RecordStatus) {
    if (s === "submitted") return "#F59E0B";
    if (s === "approved") return "#10B981";
    return "#EF4444";
}

function statusKey(s: RecordStatus) {
    if (s === "submitted") return "records.status.submitted";
    if (s === "approved") return "records.status.approved";
    return "records.status.flagged";
}

export function RecordStatusTag({
    status,
    placement = "left",
}: {
    status: RecordStatus;
    placement?: "left" | "topRight";
}) {
    const { t } = useI18n();
    const label = t(statusKey(status));

    const commonStyle: React.CSSProperties = {
        height: 30,
        display: "inline-flex",
        alignItems: "center",
        padding: "0 12px",
        background: statusColor(status),
        color: "white",
        fontWeight: 950,
        fontSize: 12,
        boxShadow: "0 10px 18px rgba(15, 23, 42, 0.12)",
        userSelect: "none",
        whiteSpace: "nowrap",
    };

    if (placement === "topRight") {
        return (
            <div
                role="status"
                aria-label={label}
                style={{
                    ...commonStyle,
                    position: "absolute",
                    right: 14,
                    top: 14,
                    borderRadius: 999,
                }}
            >
                {label}
            </div>
        );
    }

    return (
        <div
            role="status"
            aria-label={label}
            style={{
                ...commonStyle,
                position: "absolute",
                left: 0,
                top: 14,
                borderTopRightRadius: 999,
                borderBottomRightRadius: 999,
            }}
        >
            {label}
        </div>
    );
}