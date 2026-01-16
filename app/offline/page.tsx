"use client";

import { useI18n } from "@/components/i18n/LangProvider";

export default function OfflinePage() {
    const { t } = useI18n();

    return (
        <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
                {t("offline.title")}
            </h1>

            <p
                style={{
                    marginTop: 10,
                    color: "rgba(15,23,42,0.7)",
                    fontWeight: 700,
                    lineHeight: 1.6,
                }}
            >
                {t("offline.description")}
            </p>
        </main>
    );
}