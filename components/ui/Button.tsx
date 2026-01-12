"use client";

import * as React from "react";

export type ButtonTone = "primary" | "yellow" | "outline" | "ghost";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: ButtonTone;
    fullWidth?: boolean;
    stopPropagation?: boolean;
};

function toneStyle(tone: ButtonTone): React.CSSProperties {
    switch (tone) {
        case "primary": // 僱主（綠）
            return {
                backgroundColor: "var(--brand-green)",
                color: "#ffffff",
                borderColor: "transparent",
                boxShadow: "0 12px 26px rgba(46, 196, 182, 0.28)",
            };

        case "yellow": // 姐姐（黃）
            return {
                backgroundColor: "var(--brand-yellow)",
                color: "#1f2937",
                borderColor: "transparent",
                boxShadow: "0 12px 26px rgba(244, 196, 48, 0.28)",
            };

        case "ghost":
            return {
                backgroundColor: "transparent",
                color: "var(--text)",
                borderColor: "transparent",
            };

        case "outline":
        default:
            return {
                backgroundColor: "#ffffff",
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
    const baseStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,

        width: fullWidth ? "100%" : "auto",
        padding: "12px 14px",
        borderRadius: "var(--radius)",

        /* ✅ border 永遠存在 */
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "var(--border)",

        fontWeight: 900,
        lineHeight: 1,
        userSelect: "none",

        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,

        WebkitTapHighlightColor: "transparent",
        transition:
            "transform 120ms ease, box-shadow 120ms ease, filter 120ms ease, opacity 120ms ease",

        ...toneStyle(tone),
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