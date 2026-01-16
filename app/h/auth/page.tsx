"use client";

import { Suspense } from "react";
import HelperAuthCallbackClient from "./HelperAuthCallbackClient";
import { useI18n } from "@/components/i18n/LangProvider";

function LoadingFallback() {
    const { t } = useI18n();

    return (
        <div style={{ padding: 16, maxWidth: 520, margin: "0 auto", fontWeight: 900 }}>
            {t("auth.processingLogin")}
        </div>
    );
}

export default function HelperAuthCallbackPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <HelperAuthCallbackClient />
        </Suspense>
    );
}