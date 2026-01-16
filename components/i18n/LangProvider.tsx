"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import type { Lang } from "@/lib/i18n";
import {
    safeLang,
    DEFAULT_LANG_EMPLOYER,
    DEFAULT_LANG_HELPER,
    LS_LANG_EMPLOYER,
    LS_LANG_HELPER,
    tKey,
} from "@/lib/i18n";

type RoleScope = "employer" | "helper";

type I18nCtx = {
    lang: Lang; // effective lang (based on role from pathname)
    t: (key: string) => string;

    employerLang: Lang;
    helperLang: Lang;

    setEmployerLang: (l: Lang) => void;
    setHelperLang: (l: Lang) => void;

    setLangForRole: (role: RoleScope, l: Lang) => void;

    // 兼容舊用法：按 pathname 自動分流
    setLang: (l: Lang) => void;
};

const Ctx = createContext<I18nCtx | null>(null);

function roleFromPath(pathname: string): RoleScope | null {
    if (!pathname) return null;
    if (pathname.startsWith("/e/")) return "employer";
    if (pathname.startsWith("/h/")) return "helper";
    return null;
}

function readLs(key: string, fallback: Lang): Lang {
    try {
        const v = window.localStorage.getItem(key);
        if (!v) return fallback;
        return safeLang(v);
    } catch {
        return fallback;
    }
}

function writeLs(key: string, val: Lang) {
    try {
        window.localStorage.setItem(key, val);
    } catch { }
}

async function syncLangToFirestore(uid: string, patch: Partial<{ langEmployer: Lang; langHelper: Lang }>) {
    const ref = doc(db, "users", uid);
    try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, { ...patch }, { merge: true });
        } else {
            await updateDoc(ref, { ...patch } as any);
        }
    } catch {
        // ignore (rules/no network)
    }
}

async function readLangFromFirestore(uid: string) {
    const ref = doc(db, "users", uid);
    try {
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;

        const data = snap.data() as any;
        const le = data?.langEmployer ? safeLang(data.langEmployer) : null;
        const lh = data?.langHelper ? safeLang(data.langHelper) : null;

        return { langEmployer: le, langHelper: lh } as { langEmployer: Lang | null; langHelper: Lang | null };
    } catch {
        return null;
    }
}

export function LangProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const scope = roleFromPath(pathname || "");

    /**
     * ✅ IMPORTANT: 初始值一律用 default（server/client 一致）
     * 之後先喺 useEffect 讀 localStorage，避免 hydration mismatch
     */
    const [employerLang, setEmployerLangState] = useState<Lang>(DEFAULT_LANG_EMPLOYER);
    const [helperLang, setHelperLangState] = useState<Lang>(DEFAULT_LANG_HELPER);

    // ✅ mount 後先 hydrate localStorage
    const didHydrateLsRef = useRef(false);
    useEffect(() => {
        if (didHydrateLsRef.current) return;
        didHydrateLsRef.current = true;

        const le = readLs(LS_LANG_EMPLOYER, DEFAULT_LANG_EMPLOYER);
        const lh = readLs(LS_LANG_HELPER, DEFAULT_LANG_HELPER);
        setEmployerLangState(le);
        setHelperLangState(lh);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ effective lang
    const lang: Lang = scope === "employer" ? employerLang : scope === "helper" ? helperLang : employerLang;

    // ✅ keep <html lang=...>
    useEffect(() => {
        try {
            document.documentElement.lang = lang;
        } catch { }
    }, [lang]);

    // ✅ persist to localStorage whenever changed (client only)
    useEffect(() => {
        // 如果未 hydrate LS，都照寫冇問題，但會覆蓋空值；所以確保已 hydrate
        if (!didHydrateLsRef.current) return;
        writeLs(LS_LANG_EMPLOYER, employerLang);
    }, [employerLang]);

    useEffect(() => {
        if (!didHydrateLsRef.current) return;
        writeLs(LS_LANG_HELPER, helperLang);
    }, [helperLang]);

    // ✅ auth uid for Firestore sync
    const [uid, setUid] = useState<string | null>(null);
    const hydratedFromRemoteRef = useRef(false);

    // ✅ login: read remote once (if any), then apply
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setUid(null);
                hydratedFromRemoteRef.current = false;
                return;
            }

            setUid(user.uid);

            const remote = await readLangFromFirestore(user.uid);
            hydratedFromRemoteRef.current = true;

            if (remote?.langEmployer) setEmployerLangState(remote.langEmployer);
            if (remote?.langHelper) setHelperLangState(remote.langHelper);
        });

        return () => unsub();
    }, []);

    // ✅ after hydrated + uid, push current state to remote (merge)
    useEffect(() => {
        if (!uid) return;
        if (!hydratedFromRemoteRef.current) return;

        syncLangToFirestore(uid, { langEmployer: employerLang, langHelper: helperLang });
    }, [uid, employerLang, helperLang]);

    function setEmployerLang(l: Lang) {
        const v = safeLang(l);
        setEmployerLangState(v);
        if (auth.currentUser?.uid) syncLangToFirestore(auth.currentUser.uid, { langEmployer: v });
    }

    function setHelperLang(l: Lang) {
        const v = safeLang(l);
        setHelperLangState(v);
        if (auth.currentUser?.uid) syncLangToFirestore(auth.currentUser.uid, { langHelper: v });
    }

    function setLangForRole(role: RoleScope, l: Lang) {
        if (role === "employer") setEmployerLang(l);
        else setHelperLang(l);
    }

    function setLang(l: Lang) {
        const v = safeLang(l);
        if (scope === "helper") setHelperLang(v);
        else setEmployerLang(v); // employer OR landing fallback
    }

    const value = useMemo<I18nCtx>(() => {
        return {
            lang,
            t: (key: string) => tKey(lang, key),
            employerLang,
            helperLang,
            setEmployerLang,
            setHelperLang,
            setLangForRole,
            setLang,
        };
    }, [lang, employerLang, helperLang]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
    const v = useContext(Ctx);
    if (!v) throw new Error("useI18n must be used within <LangProvider />");
    return v;
}