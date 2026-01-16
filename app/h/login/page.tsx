// app/h/login/page.tsx
"use client";
import React, { Suspense } from "react";
import HelperLoginClient from "./HelperLoginClient";
import { useI18n } from "@/components/i18n/LangProvider";

function Fallback() {
    const { t } = useI18n();
    return <div style={{ padding: 16 }}>{t("common.loading")}</div>;
}

export default function HelperLoginPage() {
    return (
        <Suspense fallback={<Fallback />}>
            <HelperLoginClient />
        </Suspense>
    );
}