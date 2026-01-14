import { Suspense } from "react";
import HelperAddClient from "./HelperAddClient";

export default function Page() {
    return (
        <Suspense fallback={<div style={{ padding: 16, fontWeight: 900 }}>載入中…</div>}>
            <HelperAddClient />
        </Suspense>
    );
}