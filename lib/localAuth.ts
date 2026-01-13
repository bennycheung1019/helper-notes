const AUTH_UID_KEY = "__auth_uid";

export function syncAuthUid(uid: string) {
    if (typeof window === "undefined") return;

    const prev = window.localStorage.getItem(AUTH_UID_KEY);
    if (prev && prev !== uid) {
        // Clear stale household bindings when switching accounts on the same device.
        window.localStorage.removeItem("defaultHouseholdId");
        window.localStorage.removeItem("helperHouseholdId");
    }

    window.localStorage.setItem(AUTH_UID_KEY, uid);
}
