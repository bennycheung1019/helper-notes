import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const syncCashOnRecordWrite = functions.firestore
    .document("households/{hid}/records/{rid}")
    .onWrite(async (change, ctx) => {
        const hid = ctx.params.hid;

        const before = change.before.exists ? (change.before.data() as any) : null;
        const after = change.after.exists ? (change.after.data() as any) : null;

        // 只處理 amountCents 改變（或 create）
        const beforeAmt = before?.amountCents ?? null;
        const afterAmt = after?.amountCents ?? null;

        // delete：如果你唔會 delete records，可唔處理
        if (!after) {
            if (typeof beforeAmt !== "number") return;
            const delta = beforeAmt; // delete = 加番錢
            await adjustCash(hid, +delta);
            return;
        }

        if (typeof afterAmt !== "number") return;

        // create
        if (!before) {
            await adjustCash(hid, -afterAmt);
            return;
        }

        // update but amount unchanged
        if (beforeAmt === afterAmt) return;

        // amount changed: cash should change by -(after-before)
        const diff = afterAmt - beforeAmt;
        await adjustCash(hid, -diff);
    });

async function adjustCash(hid: string, deltaCents: number) {
    const href = db.doc(`households/${hid}`);
    await db.runTransaction(async (tx) => {
        const hsnap = await tx.get(href);
        if (!hsnap.exists) return;

        const current = Number((hsnap.data() as any)?.cashCents ?? 0) || 0;
        const next = current + deltaCents;

        tx.update(href, {
            cashCents: next,
            cashUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
}