"use client";

import { Suspense } from "react";
import HelperAddClient from "./HelperAddClient";
import { useI18n } from "@/components/i18n/LangProvider";

function LoadingFallback() {
    const { t } = useI18n();

    return (
        <div style={{ padding: 16, fontWeight: 900 }}>
            {t("common.loading")}
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <HelperAddClient />
        </Suspense>
    );
}