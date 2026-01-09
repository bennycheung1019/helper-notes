export default function OfflinePage() {
    return (
        <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>你而家離線</h1>
            <p style={{ marginTop: 10, color: "rgba(15,23,42,0.7)", fontWeight: 700, lineHeight: 1.6 }}>
                網絡未連接。你可以返回再試，或者等連線恢復後重新載入。
            </p>
        </main>
    );
}