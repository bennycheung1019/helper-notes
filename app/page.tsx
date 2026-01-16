"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import styles from "./landing.module.css";
import Image from "next/image";
import React from "react";

import { useI18n } from "@/components/i18n/LangProvider";
import type { Lang } from "@/lib/i18n";
import { LANG_NAME } from "@/lib/i18n";

function ImgPlaceholder({
  label,
  ratio,
  suggest,
}: {
  label: string;
  ratio: string;
  suggest: string;
}) {
  return (
    <div className={styles.phWrap}>
      <div className={styles.phBox}>
        <div className={styles.phLabel}>{label}</div>
        <div className={styles.phMeta}>
          <span className={styles.phPill}>比例：{ratio}</span>
          <span className={styles.phPill}>建議：{suggest}</span>
        </div>
      </div>
    </div>
  );
}

function nextLang(current: Lang): Lang {
  const order: Lang[] = ["zh-HK", "en", "id"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

function langLabelShort(lang: Lang) {
  // 顯示俾 user 易明：唔用「繁」
  if (lang === "zh-HK") return "中文";
  if (lang === "en") return "English";
  return "Bahasa";
}

export default function LandingPage() {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();

  // Theme button colors (Employer = Green, Helper = Yellow)
  const employerBtnStyle: React.CSSProperties = {
    background: "#2EC4B6",
    color: "#ffffff",
    border: "1px solid rgba(18,18,18,0.10)",
    boxShadow: "0 14px 30px rgba(18,18,18,0.10)",
  };

  const helperBtnStyle: React.CSSProperties = {
    background: "#F4C430",
    color: "#111827",
    border: "1px solid rgba(18,18,18,0.10)",
    boxShadow: "0 14px 30px rgba(18,18,18,0.08)",
  };

  return (
    <div className={styles.page}>
      {/* Top Nav */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.brand}>
            <div className={styles.logo} aria-hidden="true">
              <Image src="/icon_512.png" alt="" width={34} height={34} priority />
            </div>

            {/* ✅ bold brand name */}
            <div className={styles.brandName} style={{ fontWeight: 950 }}>
              {t("landing.brand")}
            </div>
          </div>

          {/* ✅ only language switch, remove login buttons */}
          <div className={styles.navRight} style={{ gap: 10 }}>
            <button
              type="button"
              onClick={() => setLang(nextLang(lang))}
              aria-label="Switch language"
              title={`Language: ${LANG_NAME[lang]}`}
              style={{
                height: 40,
                padding: "0 10px 0 8px",
                borderRadius: 999,
                border: "1px solid rgba(18,18,18,0.10)",
                background: "rgba(255,255,255,0.88)",
                boxShadow: "0 10px 22px rgba(18,18,18,0.08)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {/* 🌐 icon */}
              <span
                aria-hidden
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  background: "rgba(15,23,42,0.06)",
                  border: "1px solid rgba(15,23,42,0.10)",
                  lineHeight: 1,
                }}
              >
                🌐
              </span>

              {/* language pill */}
              <span
                style={{
                  height: 28,
                  padding: "0 10px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.06)",
                  border: "1px solid rgba(15,23,42,0.10)",
                  fontWeight: 950,
                  fontSize: 12,
                  color: "#111827",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {langLabelShort(lang)}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {/* Hero */}
        <section className={styles.heroBear}>
          <div className={styles.heroLeft}>
            <div className={styles.kicker}>{t("landing.kicker")}</div>
            <h1 className={styles.h1}>{t("landing.title")}</h1>
            <p className={styles.sub}>{t("landing.sub")}</p>

            <div className={styles.ctas}>
              <Button
                tone="primary"
                fullWidth={false}
                onClick={() => router.push("/e/login")}
                style={employerBtnStyle}
              >
                {t("landing.ctaEmployer")}
              </Button>

              <Button
                tone="outline"
                fullWidth={false}
                onClick={() => router.push("/h/login")}
                style={helperBtnStyle}
              >
                {t("landing.ctaHelper")}
              </Button>
            </div>

            <ul className={styles.mini}>
              <li>{t("landing.mini1")}</li>
              <li>{t("landing.mini2")}</li>
              <li>{t("landing.mini3")}</li>
            </ul>
          </div>

          <div className={styles.heroRight}>
            {/* HERO MAIN ILLUSTRATION */}
            <Image
              src="/hero/hero-assistant2.png"
              alt="Hero illustration"
              width={1024}
              height={1024}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: 26,
                boxShadow: "0 18px 52px rgba(18,18,18,0.06)",
              }}
              priority
            />

            {/* ✅ removed 小插畫 A–C */}
          </div>
        </section>

        {/* Simple 3-line features */}
        <section className={styles.features} aria-label="Features">
          <div className={styles.featureCard}>
            <div className={styles.featureTitle}>{t("landing.f1.title")}</div>
            <div className={styles.featureText}>{t("landing.f1.text")}</div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureTitle}>{t("landing.f2.title")}</div>
            <div className={styles.featureText}>{t("landing.f2.text")}</div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureTitle}>{t("landing.f3.title")}</div>
            <div className={styles.featureText}>{t("landing.f3.text")}</div>
          </div>
        </section>

        {/* App screenshot / mock placeholder */}
        <section className={styles.previewWrap}>
          <div className={styles.previewCard}>
            <div className={styles.previewTop}>
              <div className={styles.previewTitle}>{t("landing.preview.title")}</div>
              <div className={styles.previewPill}>{t("landing.preview.pill")}</div>
            </div>

            <ImgPlaceholder
              label="App 截圖（建議用真 screenshot）"
              ratio="16:10"
              suggest="1600×1000（最少 1200×750）"
            />

            <div className={styles.previewNote}>{t("landing.preview.note")}</div>
          </div>
        </section>

        <footer className={styles.footer}>
          <div>© {new Date().getFullYear()} {t("landing.brand")}</div>
          {/* ✅ removed “下一步…” line */}
        </footer>
      </main>
    </div>
  );
}