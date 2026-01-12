import { Suspense } from "react";
import HelperAuthCallbackClient from "./HelperAuthCallbackClient";

export default function HelperAuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div style={{ padding: 16, maxWidth: 520, margin: "0 auto", fontWeight: 900 }}>
                    處理登入中…
                </div>
            }
        >
            <HelperAuthCallbackClient />
        </Suspense>
    );
}