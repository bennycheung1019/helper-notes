"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./auth.module.css";

import { useI18n } from "@/components/i18n/LangProvider";

export default function AuthLayout({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    const { t } = useI18n();

    return (
        <div className={styles.page}>
            {/* Top brand */}
            <header className={styles.header}>
                <Link href="/" className={styles.brand}>
                    <span className={styles.logo}>
                        <Image
                            src="/icon_512.png"
                            alt={t("brand.alt")}
                            width={28}
                            height={28}
                            priority
                        />
                    </span>
                    <span className={styles.brandName}>{t("brand.name")}</span>
                </Link>
            </header>

            {/* Center card */}
            <main className={styles.main}>
                <section className={styles.card}>
                    <h1 className={styles.title}>{title}</h1>

                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

                    <div className={styles.body}>{children}</div>
                </section>
            </main>
        </div>
    );
}