// app/h/login/page.tsx
import React, { Suspense } from "react";
import HelperLoginClient from "./HelperLoginClient";

export default function HelperLoginPage() {
    return (
        <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
            <HelperLoginClient />
        </Suspense>
    );
}