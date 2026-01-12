"use client";

import * as React from "react";

export type ButtonTone =
    | "primary"
    | "outline"
    | "ghost"
    | "yellow"
    | "danger"
    | "success"
    | "muted";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: ButtonTone;
    fullWidth?: boolean;

    /**
     * ✅ 預設 true：避免 click 冒泡到外層 Card/onClick
     */
    stopPropagation?: boolean;
};

function toneStyle(tone: ButtonTone): React.CSSProperties {
    switch (tone) {
        case "primary":
            return {
                background: "var(--primary)",
                color: "var(--primaryText)",
                borderColor: "transparent",
                boxShadow: "0 12px 26px rgba(15, 23, 42, 0.12)",
            };

        case "yellow":
            return {
                background: "var(--brand-yellow)",
                color: "#1f2937",
                borderColor: "transparent",
                boxShadow: "0 12px 26px rgba(15, 23, 42, 0.10)",
            };

        case "success":
            return {
                background: "rgba(16,185,129,0.14)",
                color: "#065F46",
                borderColor: "rgba(16,185,129,0.35)",
            };

        case "danger":
            return {
                background: "rgba(239,68,68,0.14)",
                color: "#991B1B",
                borderColor: "rgba(239,68,68,0.35)",
            };

        case "muted":
            return {
                background: "rgba(15,23,42,0.06)",
                color: "var(--text)",
                borderColor: "rgba(15,23,42,0.12)",
            };

        case "ghost":
            return {
                background: "transparent",
                color: "var(--text)",
                borderColor: "transparent",
            };

        case "outline":
        default:
            return {
                background: "white",
                color: "var(--text)",
                borderColor: "var(--border)",
            };
    }
}

const ButtonImpl = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        tone = "outline",
        fullWidth = false,
        stopPropagation = true,
        onClick,
        style,
        disabled,
        children,
        ...rest
    },
    ref
) {
    const toneCss = toneStyle(tone);

    const baseStyle: React.CSSProperties = {
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        width: fullWidth ? "100%" : "auto",
        padding: "12px 14px",
        borderRadius: "var(--radius)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "var(--border)",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        lineHeight: 1,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        transition: "transform 120ms ease, box-shadow 120ms ease, filter 120ms ease, opacity 120ms ease",
        ...toneCss,
        ...style,
    };

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
        if (stopPropagation) e.stopPropagation();
        onClick?.(e);
    }

    return (
        <button
            ref={ref}
            type={rest.type ?? "button"}
            {...rest}
            disabled={disabled}
            onClick={handleClick}
            style={baseStyle}
        >
            {children}
        </button>
    );
});

export const Button = ButtonImpl;
export default ButtonImpl;