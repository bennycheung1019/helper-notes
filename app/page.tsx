"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import styles from "./landing.module.css";
import Image from "next/image";

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

export default function LandingPage() {
  const router = useRouter();

  // Theme button colors (Employer = Green, Helper = Yellow)
  const employerBtnStyle: React.CSSProperties = {
    background: "#2EC4B6", // Tiffany-ish Green
    color: "#ffffff",
    border: "1px solid rgba(18,18,18,0.10)",
    boxShadow: "0 14px 30px rgba(18,18,18,0.10)",
  };

  const helperBtnStyle: React.CSSProperties = {
    background: "#F4C430", // Warm Yellow
    color: "#111827", // dark gray text
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
            <div className={styles.brandName}>姐姐記帳</div>
          </div>

          <div className={styles.navRight}>
            <Button
              tone="outline"
              fullWidth={false}
              onClick={() => router.push("/h/login")}
              style={helperBtnStyle}
            >
              姐姐入口
            </Button>

            <Button
              tone="primary"
              fullWidth={false}
              onClick={() => router.push("/e/login")}
              style={employerBtnStyle}
            >
              僱主入口
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {/* Hero */}
        <section className={styles.heroBear}>
          <div className={styles.heroLeft}>
            <div className={styles.kicker}>清楚．簡單．每日對數</div>
            <h1 className={styles.h1}>姐姐記帳</h1>
            <p className={styles.sub}>
              姐姐每日記低買餸／日用品支出，上載收據。僱主按日睇總額、批核同跟進。唔使 Excel，
              唔使 WhatsApp 問來問去。
            </p>

            <div className={styles.ctas}>
              <Button
                tone="primary"
                fullWidth={false}
                onClick={() => router.push("/e/login")}
                style={employerBtnStyle}
              >
                開啟僱主 App
              </Button>

              <Button
                tone="outline"
                fullWidth={false}
                onClick={() => router.push("/h/login")}
                style={helperBtnStyle}
              >
                開啟姐姐 App
              </Button>
            </div>

            <ul className={styles.mini}>
              <li>✅ 按日分組 + 當日總額</li>
              <li>✅ 待批／已批／需跟進</li>
              <li>✅ 收據相片留底易追查</li>
            </ul>
          </div>

          <div className={styles.heroRight}>
            {/* HERO MAIN ILLUSTRATION */}
            <Image
              src="/hero/hero-assistant2.png"
              alt="姐姐／助手 手繪主角插畫"
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

            {/* Optional small doodles */}
            <div className={styles.heroDoodles}>
              <ImgPlaceholder label="小插畫 A（收據/袋/車仔）" ratio="1:1" suggest="256×256" />
              <ImgPlaceholder label="小插畫 B（清單/鉛筆）" ratio="1:1" suggest="256×256" />
              <ImgPlaceholder label="小插畫 C（相機/票據）" ratio="1:1" suggest="256×256" />
            </div>
          </div>
        </section>

        {/* Simple 3-line features */}
        <section className={styles.features} aria-label="Features">
          <div className={styles.featureCard}>
            <div className={styles.featureTitle}>每日總額，一眼清</div>
            <div className={styles.featureText}>按日期分組，自動計當日總額，對數唔洗估。</div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureTitle}>收據同備註齊</div>
            <div className={styles.featureText}>相片留底＋備註，日後追查／報銷更快。</div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureTitle}>批核流程好簡單</div>
            <div className={styles.featureText}>待批／已批／需跟進，清清楚楚唔混亂。</div>
          </div>
        </section>

        {/* App screenshot / mock placeholder */}
        <section className={styles.previewWrap}>
          <div className={styles.previewCard}>
            <div className={styles.previewTop}>
              <div className={styles.previewTitle}>App 預覽</div>
              <div className={styles.previewPill}>示意：今日總額 HK$ 428.50</div>
            </div>

            <ImgPlaceholder
              label="App 截圖（建議用真 screenshot）"
              ratio="16:10"
              suggest="1600×1000（最少 1200×750）"
            />

            <div className={styles.previewNote}>
              建議：之後你畀我一張 /e/records 或 /h/records 截圖，我哋用一張大圖做重點，視覺會即刻好似
              Bear。
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <div>© {new Date().getFullYear()} 姐姐記帳</div>
          <div style={{ color: "var(--muted)" }}>
            下一步：換上你嘅手繪插畫（主角 + 小圖示 + App 截圖）
          </div>
        </footer>
      </main>
    </div>
  );
}