import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function ensureMember({
    householdId,
    userId,
    role,
}: {
    householdId: string;
    userId: string;
    role: "helper" | "employer";
}) {
    const ref = doc(db, "households", householdId, "members", userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            role,
            label: role === "helper" ? "姐姐" : "僱主",
            joinedAt: serverTimestamp(),
        });
    }
}

export async function updateMemberLabel({
    householdId,
    userId,
    label,
}: {
    householdId: string;
    userId: string;
    label: string;
}) {
    await updateDoc(doc(db, "households", householdId, "members", userId), {
        label,
    });
}
