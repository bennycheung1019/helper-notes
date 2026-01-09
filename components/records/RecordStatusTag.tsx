"use client";

import * as React from "react";

export type RecordStatus = "submitted" | "approved" | "flagged";

function statusLabel(s: RecordStatus) {
    if (s === "submitted") return "待批";
    if (s === "approved") return "已批";
    return "需跟進";
}

function statusColor(s: RecordStatus) {
    if (s === "submitted") return "#F59E0B";
    if (s === "approved") return "#10B981";
    return "#EF4444";
}

export function RecordStatusTag({
    status,
    placement = "left",
}: {
    status: RecordStatus;
    placement?: "left" | "topRight";
}) {
    if (placement === "topRight") {
        return (
            <div
                style={{
                    position: "absolute",
                    right: 14,
                    top: 14,
                    height: 30,
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 12px",
                    background: statusColor(status),
                    color: "white",
                    fontWeight: 950,
                    fontSize: 12,
                    borderRadius: 999,
                    boxShadow: "0 10px 18px rgba(15, 23, 42, 0.12)",
                }}
            >
                {statusLabel(status)}
            </div>
        );
    }

    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                top: 14,
                height: 30,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 12px",
                background: statusColor(status),
                color: "white",
                fontWeight: 950,
                fontSize: 12,
                borderTopRightRadius: 999,
                borderBottomRightRadius: 999,
                boxShadow: "0 10px 18px rgba(15, 23, 42, 0.12)",
            }}
        >
            {statusLabel(status)}
        </div>
    );
}