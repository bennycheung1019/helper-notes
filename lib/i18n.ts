export type Lang = "zh-HK" | "en" | "id";

export const DEFAULT_LANG_EMPLOYER: Lang = "zh-HK";
export const DEFAULT_LANG_HELPER: Lang = "zh-HK";

// ✅ 分開儲存
export const LS_LANG_EMPLOYER = "__lang_employer";
export const LS_LANG_HELPER = "__lang_helper";

export function safeLang(v: any): Lang {
    if (v === "zh-HK" || v === "en" || v === "id") return v;
    return "zh-HK";
}

export const LANG_LABEL: Record<Lang, string> = {
    "zh-HK": "繁",
    en: "EN",
    id: "ID",
};

export const LANG_NAME: Record<Lang, string> = {
    "zh-HK": "繁體中文",
    en: "English",
    id: "Bahasa Indonesia",
};

type Dict = Record<string, string>;

/**
 * ✅ 注意：
 * - 你而家嘅 AppShell 用: nav.add/nav.records/nav.settings/nav.overview/nav.helpers
 * - Settings page 建議統一用: settings.* + common.*
 * - tKey() 會 fallback 去 zh-HK 再 fallback key 本身，所以未補齊都唔會 crash
 */

const zhHK: Dict = {
    // =========================
    // Landing
    // =========================
    "landing.brand": "姐姐記帳",
    "landing.helperEntry": "姐姐入口",
    "landing.employerEntry": "僱主入口",
    "landing.kicker": "清楚．簡單．每日對數",
    "landing.title": "姐姐記帳",
    "landing.sub":
        "姐姐每日記低買餸／日用品支出，上載收據。僱主按日睇總額、批核同跟進。唔使 Excel，唔使 WhatsApp 問來問去。",
    "landing.ctaEmployer": "開啟僱主 App",
    "landing.ctaHelper": "開啟姐姐 App",
    "landing.mini1": "✅ 按日分組 + 當日總額",
    "landing.mini2": "✅ 待批／已批／需跟進",
    "landing.mini3": "✅ 收據相片留底易追查",
    "landing.f1.title": "每日總額，一眼清",
    "landing.f1.text": "按日期分組，自動計當日總額，對數唔洗估。",
    "landing.f2.title": "收據同備註齊",
    "landing.f2.text": "相片留底＋備註，日後追查／報銷更快。",
    "landing.f3.title": "批核流程好簡單",
    "landing.f3.text": "待批／已批／需跟進，清清楚楚唔混亂。",
    "landing.preview.title": "App 預覽",
    "landing.preview.pill": "示意：今日總額 HK$ 428.50",
    "landing.preview.note":
        "建議：之後你畀我一張 /e/records 或 /h/records 截圖，我哋用一張大圖做重點，視覺會即刻好似 Bear。",
    "landing.lang": "語言",

    // =========================
    // Nav (bottom tab)
    // =========================
    "nav.add": "新增",
    "nav.records": "記錄",
    "nav.settings": "設定",
    "nav.overview": "總覽",
    "nav.helpers": "姐姐",

    // =========================
    // Titles
    // =========================
    "title.employer.settings": "設定",
    "title.employer.overview": "總覽",
    "title.employer.records": "記錄",
    "title.employer.helpers": "姐姐",

    "title.helper.add": "新增",
    "title.helper.records": "記錄",
    "title.helper.settings": "設定",

    // ===== Common =====
    "common.loading": "正在載入…",
    "common.copy": "複製",
    "common.edit": "編輯",
    "common.remove": "移除",
    "common.save": "儲存",
    "common.saving": "儲存中…",
    "common.cancel": "取消",
    "common.dash": "—",
    "common.close": "關閉",
    "common.selected": "已選",

    //offline page
    "offline.title": "你而家離線",
    "offline.description": "網絡未連接。你可以返回再試，或者等連線恢復後重新載入。",


    //e/auth
    "auth.processingTitle": "處理登入",
    "auth.processingLogin": "正在完成登入…",
    "auth.loginSuccessRedirecting": "登入成功 ✅ 正在進入總覽…",
    "auth.invalidLink": "呢條連結唔正確，請返回登入頁重新發送。",
    "auth.promptEmail": "請輸入你嘅電郵以完成登入：",
    "auth.missingEmail": "未輸入電郵，無法完成登入。",
    "auth.loginFailed": "登入失敗，請返回登入頁重新登入。",
    "auth.backToLogin": "返回登入頁",

    // e/login
    "login.employer.title": "僱主登入",
    "login.employer.subtitle": "用電郵連結或 Google 快速登入",

    "login.emailLabel": "電郵地址",
    "login.emailPlaceholder": "you@example.com",

    "login.sendLink": "發送登入連結",
    "login.sending": "發送中…",

    "login.sentTitle": "已寄出 ✅",
    "login.sentText": "請到你嘅電郵收件匣，點擊登入連結完成登入。",

    "login.emailRequired": "請輸入電郵地址",
    "login.sendFail": "發送失敗，請稍後再試。",
    "login.googleFail": "Google 登入失敗，請再試。",

    "common.or": "或",

    "brand.name": "姐姐記帳",
    "brand.alt": "姐姐記帳",

    "auth.googleLogin": "用 Google 登入",

    //installBanner
    "role.employer": "僱主",
    "role.helper": "姐姐",

    "pwa.title": "加到主畫面",
    "pwa.desc.ios": "Safari 下方「分享」→「加入主畫面」。",
    "pwa.desc.default": "安裝後一撳就開，唔怕搵唔返。",

    "pwa.btn.iosGuide": "睇指示",
    "pwa.btn.install": "安裝",
    "pwa.btn.addToHome": "加入主畫面",
    "pwa.btn.remind7d": "7 日後提醒",

    "pwa.toast.installed": "已加入主畫面 ✅",
    "pwa.toast.followSteps": "跟住指示加入主畫面 ✅",
    "pwa.toast.notSupported": "暫時未支援安裝",

    "pwa.aria.installPrompt": "Install app prompt",

    // ===== Overview (e/overview) =====
    "overview.loading": "正在載入…",
    "overview.firstTime": "第一次使用",
    "overview.create.title": "建立家庭",
    "overview.create.desc": "輸入家庭名稱，建立後就可以邀請姐姐加入。",
    "overview.create.placeholder": "例如：張生家庭",
    "overview.create.cta": "建立並前往邀請",
    "overview.create.busy": "建立中…",

    "overview.create.step.household": "建立家庭中…",
    "overview.create.step.member": "建立成員中…",
    "overview.create.step.user": "寫入用戶設定中…",

    "overview.create.fail.household": "建立家庭失敗（step=household, {code}）",
    "overview.create.fail.member": "建立家庭失敗（step=member, {code}）",
    "overview.create.fail.user": "建立家庭失敗（step=user, {code}）",

    "overview.create.successGoInvite": "建立成功 ✅ 前往邀請…",
    "overview.create.employerLabel": "僱主",

    "overview.loadFail": "載入資料失敗（可能係網絡或 Firestore rules）。",
    "overview.householdSubFail": "讀取家庭資料失敗（可能係 Firestore rules）。",
    "overview.recordsFail": "讀取記錄失敗（可能係 Firestore rules）。",

    "overview.currencyPrefix": "HK$",

    "overview.cash.title": "手上現金",
    "overview.cash.desc": "記低姐姐手上仲有幾多錢，方便提醒你幾時要再入錢",
    "overview.cash.edit": "✏️ 編輯",
    "overview.cash.inputLabel": "更新金額（HK$）",
    "overview.cash.placeholder": "例如：2000",
    "overview.cash.invalid": "請輸入有效金額（>= 0）",
    "overview.cash.updateFail": "更新『手上現金』失敗（可能係 Firestore rules）。",

    "overview.stats.month": "本月總支出",
    "overview.stats.today": "今日支出",

    "overview.pending.title": "待批",
    "overview.pending.sub": "點入記錄詳情處理",
    "overview.pending.aria": "待批數量 {n}",
    "overview.pending.empty": "暫時冇待批 ✅",

    "overview.flagged.title": "需跟進",
    "overview.flagged.sub": "點入記錄詳情處理",
    "overview.flagged.aria": "需跟進數量 {n}",
    "overview.flagged.empty": "暫時冇需跟進 ✅",

    "overview.lightbox.title": "收據（{i}/{n}）",
    "overview.lightbox.thumbAria": "打開第 {n} 張",

    // Ads carousel
    "overview.ads.1.title": "優惠位 1",
    "overview.ads.1.desc": "之後可以放合作優惠／贊助",
    "overview.ads.2.title": "優惠位 2",
    "overview.ads.2.desc": "例如：記帳服務／家務用品折扣",
    "overview.ads.3.title": "優惠位 3",
    "overview.ads.3.desc": "例如：保險／外傭服務推廣",
    "overview.ads.cta": "查看 →",
    "overview.ads.dotAria": "前往第 {n} 個優惠",

    // Employer Records (e/records)
    "records.title": "記錄",
    "records.sub.recentAutoLoad": "只顯示最近 {n} 筆，捲到底自動載入更多",

    "records.currencyPrefix": "HK$",

    "records.err.loadProfile": "載入失敗（可能係 Firestore rules / 權限）。",
    "records.err.readFirst": "讀取失敗（可能係 Firestore rules / index）。",
    "records.err.loadMore": "載入更多失敗（可能需要 index）。",

    "records.filters.title": "篩選",
    "records.filters.titleActive": "篩選（已啟用）",
    "records.filters.panelTitle": "篩選",
    "records.filters.clear": "清除",
    "records.filters.all": "全部",
    "records.filters.status.all": "全部",
    "records.filters.status.submitted": "待批",
    "records.filters.status.approved": "已批",
    "records.filters.status.flagged": "需跟進",
    "records.filters.category": "分類",
    "records.filters.submitter": "提交者",

    "records.csv.iconTitle": "CSV 匯出",
    "records.csv.title": "CSV 匯出（Pro）",
    "records.csv.sub": "方便僱主對數／報銷／記帳",
    "records.csv.basicNoExport": "你而家係 Basic（不能匯出）",
    "records.csv.proOnly": "CSV 匯出係 Pro 功能。",
    "records.csv.thisMonth": "匯出本月",
    "records.csv.all": "匯出全部",
    "records.csv.downloaded": "已下載 CSV ✅（{n} 筆）",

    "records.more.loading": "載入更多…",
    "records.more.hint": "（向下捲會載入更多）",
    "records.more.end": "已到最底 ✅",
    "records.empty": "未有記錄",

    "records.lightbox.title": "收據（{i}/{n}）",
    "records.lightbox.thumbAria": "打開第 {n} 張",

    "records.helper.default": "姐姐",
    "records.category.other": "其他",

    // RecordCard
    "records.card.openReceipt": "打開收據圖片",
    "records.card.receiptImage": "收據圖片",
    "records.card.receiptAlt": "收據",

    // RecordList
    "records.date.today": "今日",
    "records.date.unknown": "未有日期",

    // RecordPills
    "records.photos.morePrefix": "+",
    "records.photos.moreSuffix": " 張",

    // RecordStatusTag
    "records.status.submitted": "待批",
    "records.status.approved": "已批",
    "records.status.flagged": "需跟進",

    //records/[id]
    "record.detailTitle": "記錄詳情",
    "record.submitter": "提交者",
    "record.defaultHelper": "姐姐",
    "record.noHousehold": "未建立家庭或未設定家庭。",
    "record.loadFail": "載入失敗（可能係網絡或 Firestore rules）。",
    "record.notFound": "搵唔到呢條記錄。",
    "record.updateStatusFail": "更新狀態失敗（可能係 Firestore rules）。",

    "record.amount": "金額",
    "record.note": "備註",

    "record.action.approve": "批核",
    "record.action.flag": "需跟進",
    "record.action.unflag": "取消標記",

    "record.recordIdLabel": "Record ID",
    "record.copyIdHint": "Click to copy（for CS）",
    "common.copied": "已複製 ✅",

    "record.receiptPhotos": "收據相片",
    "record.openReceiptImage": "Open receipt image",
    "record.receipt": "收據",
    "record.prevImage": "上一張",
    "record.nextImage": "下一張",
    "record.close": "關閉",

    "record.status.submitted": "待批",
    "record.status.approved": "已批",
    "record.status.flagged": "需跟進",

    "common.noData": "暫時未有資料",
    "common.back": "返回",

    // Helpers page
    "helpers.title": "姐姐",
    "helpers.defaultLabel": "姐姐",
    "helpers.uidLabel": "UID：{uid}",
    "helpers.joined": "已加入：{n}",
    "helpers.basicHint": "（Basic 最多 1 位；升級 Pro 可加多位）",
    "helpers.loadFail": "載入失敗（可能係 Firestore rules）。",
    "helpers.readFail": "讀取失敗（可能係 rules / index）。",
    "helpers.saveOk": "已儲存 ✅",
    "helpers.saveFail": "儲存失敗（可能係 rules）。",

    "helpers.limit.basicFull": "你而家係 Basic，已到上限（1 位）。如要再邀請，需升級 Pro。",

    "helpers.invite.title": "邀請姐姐加入",
    "helpers.invite.sub": "每條邀請連結只可以用一次；用完就失效。",
    "helpers.invite.busy": "生成中…",
    "helpers.invite.limit": "已到上限",
    "helpers.invite.cta": "生成邀請連結",
    "helpers.invite.needPro": "已到上限：如要再邀請，需要升級 Pro。",
    "helpers.invite.created": "已生成邀請連結 ✅（一次性使用）",
    "helpers.invite.createFail": "生成邀請連結失敗（可能係 rules）。",
    "helpers.invite.oneTimeLabel": "邀請連結（一次性）",
    "helpers.invite.copied": "已複製連結 ✅",
    "helpers.invite.copyFail": "複製失敗，請手動複製。",
    "helpers.invite.waShareAria": "WhatsApp 分享",
    "helpers.invite.waShareTitle": "WhatsApp 分享",
    "helpers.invite.regen": "再生成一條",
    "helpers.invite.tip": "提示：如果姐姐開錯 browser／唔記得咗，就再生成一條新 link。",
    "helpers.invite.waText": "姐姐你好～請用呢條連結加入記錄買餸/收據（一次性使用）：\n{url}",

    "helpers.list.title": "現有姐姐",
    "helpers.list.sub": "用「編輯」可以改名；用「移除」可以停用姐姐。",
    "helpers.list.empty": "暫時未有姐姐加入。你可以先生成邀請連結，俾姐姐加入。",

    "helpers.edit.displayName": "顯示名",
    "helpers.edit.placeholder": "例如：姐姐A",

    "helpers.remove.busy": "移除中…",
    "helpers.remove.confirm": "確定要移除「{name}」？\n（移除後，姐姐將不能再提交記錄。）",
    "helpers.remove.ok": "已移除 ✅",
    "helpers.remove.fail": "移除失敗（可能係 rules）。",

    "helpers.noHousehold": "未找到家庭資料。請先完成建立家庭。",

    //e/settings page

    "settings.title": "設定",
    "settings.loading": "正在載入設定…",

    "settings.section.account": "帳戶",
    "settings.account.email": "登入電郵",
    "settings.account.plan": "方案",
    "settings.plan.basic": "Basic",
    "settings.plan.pro": "Pro",

    "settings.section.household": "家庭",
    "settings.household.label": "家庭",
    "settings.household.none": "未建立",
    "settings.household.defaultName": "我屋企",
    "settings.household.name": "家庭名稱",
    "settings.household.editHint": "點擊可以修改名稱",
    "settings.household.placeholder": "例如：我屋企",

    "settings.section.general": "一般",
    "settings.general.language": "語言",
    "settings.general.languageHint": "按一下可以切換語言",

    "settings.logout": "登出",
    "settings.logoutHint": "會返回登入頁",

    "settings.langModal.title": "選擇語言",
    "settings.langModal.subtitleEmployer": "會即時套用到僱主介面",

    // =========================
    // Helper App
    // =========================

    //h/login

    "hLogin.title": "姐姐登入",
    "hLogin.subtitle": "登入後會自動完成加入",
    "hLogin.quickLogin": "一鍵登入",
    "hLogin.error.generic": "登入失敗，請再試一次",
    "hLogin.error.google": "Google 登入失敗，請再試",


    //h/auth
    "app.brandName": "姐姐記帳",

    "common.backToLogin": "返回登入",
    "common.reminder": "提醒",

    "hAuth.badgeTitle": "處理登入",
    "hAuth.title": "請稍等",
    "hAuth.goDirect": "直接進入",

    "hAuth.processing": "正在完成登入…",
    "hAuth.successRedirecting": "登入成功 ✅ 正在進入…",
    "hAuth.notCompleted": "未完成登入。請返回登入頁再試一次。",
    "hAuth.failed": "登入失敗。請返回登入頁再試一次。",

    "hAuth.reminderText": "登入完成後，你仍然需要僱主提供嘅「邀請連結」先會正式加入家庭。",

    // Helper add
    "hAdd.submitter": "提交者",
    "hAdd.amount": "金額（HK$）",
    "hAdd.amountPlaceholder": "例如 125.50",
    "hAdd.preview": "預覽",
    "hAdd.category": "分類",
    "hAdd.note": "備註（可選）",
    "hAdd.notePlaceholder": "例如：買米、牛奶、紙巾…",
    "hAdd.receipts": "收據相片（可選）",
    "hAdd.uploading": "上載中…",
    "hAdd.pickPhotos": "＋ 選擇相片（可多張）",
    "hAdd.submitting": "提交中…",
    "hAdd.uploadingPhotos": "相片上載中…",
    "hAdd.submit": "提交記錄",
    "hAdd.noHouseholdInline": "未找到家庭資料。請用僱主邀請連結加入一次。",

    "hAdd.toast.joiningAfterLogin": "完成登入，正幫你加入家庭…",
    "hAdd.toast.noHousehold": "未綁定家庭：請用僱主邀請連結加入一次",
    "hAdd.toast.imageTooLarge": "有相片太大（>8MB），已略過",
    "hAdd.toast.uploaded": "相片已上載 ✅",
    "hAdd.toast.uploadFail": "上載失敗，請再試",
    "hAdd.toast.invalidAmount": "請輸入正確金額",
    "hAdd.toast.submittedWithCash": "已提交 ✅（手上現金：HK$ {cash}）",
    "hAdd.toast.submitFail": "提交失敗（可能係 Firestore rules / 權限）",

    "common.helper": "姐姐",
    "common.delete": "刪除",

    // Helper Records (h/records)
    "hRecords.hint": "先顯示最近 {n} 筆，捲到底會自動載入更多",
    "hRecords.noHousehold": "未綁定家庭，請用僱主邀請連結加入一次。",
    "hRecords.loadFail": "讀取失敗（可能需要 Firestore index 或 rules）。",
    "hRecords.loadMoreFail": "載入更多失敗（可能需要 index）。",
    "hRecords.empty": "未有記錄",

    "records.totalPrefix": "HK$",

    "common.loadingMore": "載入更多…",
    "common.scrollToLoad": "（向下捲會載入更多）",
    "common.reachedEnd": "已到最底 ✅",

    //[id]/records
    "title.helper.recordDetail": "記錄詳情",

    "hRecordEdit.title": "記錄",
    "hRecordEdit.header": "{day} {time} 的記錄",
    "hRecordEdit.noHousehold": "未綁定家庭，請用僱主邀請連結加入一次。",
    "hRecordEdit.notFound": "搵唔到呢條記錄。",
    "hRecordEdit.notOwner": "你唔可以編輯其他人嘅記錄。",
    "hRecordEdit.locked": "呢條記錄已鎖定（唔係待批）。",
    "hRecordEdit.loadFail": "載入失敗（可能係 Firestore 權限）。",
    "hRecordEdit.invalidAmount": "請輸入正確金額。",
    "hRecordEdit.amount": "金額（HK$）",
    "hRecordEdit.amountPlaceholder": "例如 125.5",
    "hRecordEdit.category": "分類",
    "hRecordEdit.note": "備註（可選）",
    "hRecordEdit.notePlaceholder": "例如：買米、牛奶、紙巾…",

    "category.food": "買餸",
    "category.daily": "日用品",
    "category.transport": "交通",
    "category.other": "其他",

    "common.today": "今日",
    "common.saved": "已儲存 ✅",
    "common.saveFail": "儲存失敗",

    "date.year": "年",
    "date.month": "月",
    "date.day": "日",

    // Helper Settings page
    "hSettings.kicker": "登出唔係常用動作，所以放喺設定頁會自然啲。",
    "hSettings.logoutHint": "提示：登出後要再次用邀請連結加入，先會重新綁定家庭。",

    // Lang modal subtitles
    "settings.langModal.subtitleHelper": "只會影響姐姐 App（/h/*）嘅語言。",

    //join page
    "join.title": "加入家庭",
    "join.token": "Token",
    "join.preparing": "準備加入中…",
    "join.verifying": "驗證邀請連結…",
    "join.joining": "加入家庭中…",
    "join.invalidOrExpired": "呢條邀請連結無效或已失效。",
    "join.revoked": "呢條邀請連結已被取消。",
    "join.used": "呢條邀請連結已用過（一次性）。請叫僱主再生成一條。",
    "join.expired": "呢條邀請連結已過期。請叫僱主再生成一條。",
    "join.successToAdd": "加入成功 ✅ 轉到新增頁…",
    "join.successToOverview": "加入成功 ✅ 轉到總覽…",
    "join.failWithCode": "加入失敗（{code}）：多數係 rules / invite 已被用 / 欄位唔符合",

    "common.employer": "僱主",

};

const en: Dict = {
    // Landing
    "landing.brand": "Helper Notes",
    "landing.helperEntry": "Helper",
    "landing.employerEntry": "Employer",
    "landing.kicker": "Clear. Simple. Daily reconciliation.",
    "landing.title": "Helper Notes",
    "landing.sub":
        "Helpers log daily grocery/household expenses and upload receipts. Employers see daily totals, approve, and follow up—no Excel, no WhatsApp back-and-forth.",
    "landing.ctaEmployer": "Open Employer App",
    "landing.ctaHelper": "Open Helper App",
    "landing.mini1": "✅ Grouped by day + daily total",
    "landing.mini2": "✅ Pending / Approved / Needs follow-up",
    "landing.mini3": "✅ Receipt photos for easy audit",
    "landing.f1.title": "Daily total at a glance",
    "landing.f1.text": "Grouped by date with automatic daily totals—no guessing.",
    "landing.f2.title": "Receipts + notes",
    "landing.f2.text": "Photo proof and notes make auditing/reimbursement faster.",
    "landing.f3.title": "Simple approval flow",
    "landing.f3.text": "Pending / Approved / Flagged stays clear and organized.",
    "landing.preview.title": "App Preview",
    "landing.preview.pill": "Example: Today total HK$ 428.50",
    "landing.preview.note":
        "Tip: If you share a real /e/records or /h/records screenshot later, we can replace this with a strong hero preview like Bear.",
    "landing.lang": "Language",

    // Nav
    "nav.add": "Add",
    "nav.records": "Records",
    "nav.settings": "Settings",
    "nav.overview": "Overview",
    "nav.helpers": "Helpers",

    // Titles
    "title.employer.settings": "Settings",
    "title.employer.overview": "Overview",
    "title.employer.records": "Records",
    "title.employer.helpers": "Helpers",

    "title.helper.add": "Add",
    "title.helper.records": "Records",
    "title.helper.settings": "Settings",

    // Common
    "common.loading": "Loading…",
    "common.copy": "Copy",
    "common.edit": "Edit",
    "common.remove": "Remove",
    "common.save": "Save",
    "common.saving": "Saving…",
    "common.cancel": "Cancel",
    "common.dash": "—",
    "common.close": "Close",
    "common.selected": "Selected",

    //offline page
    "offline.title": "You are offline",
    "offline.description": "No network connection. You can go back and try again, or reload once the connection is restored.",

    //e/auth
    "auth.processingTitle": "Signing in",
    "auth.processingLogin": "Completing sign-in…",
    "auth.loginSuccessRedirecting": "Sign-in successful ✅ Redirecting…",
    "auth.invalidLink": "This sign-in link is invalid. Please request a new one.",
    "auth.promptEmail": "Please enter your email to complete sign-in:",
    "auth.missingEmail": "Email is required to complete sign-in.",
    "auth.loginFailed": "Sign-in failed. Please try again.",
    "auth.backToLogin": "Back to login",

    // e/login
    "login.employer.title": "Employer login",
    "login.employer.subtitle": "Sign in with email link or Google",

    "login.emailLabel": "Email address",
    "login.emailPlaceholder": "you@example.com",

    "login.sendLink": "Send sign-in link",
    "login.sending": "Sending…",

    "login.sentTitle": "Sent ✅",
    "login.sentText": "Check your inbox and click the sign-in link to complete login.",

    "login.emailRequired": "Please enter your email address",
    "login.sendFail": "Failed to send. Please try again later.",
    "login.googleFail": "Google sign-in failed. Please try again.",

    "common.or": "or",

    "brand.name": "Helper Receipts",
    "brand.alt": "Helper Receipts",

    "auth.googleLogin": "Sign in with Google",

    //installBanner
    "role.employer": "Employer",
    "role.helper": "Helper",

    "pwa.title": "Add to Home Screen",
    "pwa.desc.ios": "In Safari, tap Share → Add to Home Screen.",
    "pwa.desc.default": "Install once and open instantly—no more searching.",

    "pwa.btn.iosGuide": "View steps",
    "pwa.btn.install": "Install",
    "pwa.btn.addToHome": "Add to Home Screen",
    "pwa.btn.remind7d": "Remind me in 7 days",

    "pwa.toast.installed": "Added to Home Screen ✅",
    "pwa.toast.followSteps": "Follow the steps to add it ✅",
    "pwa.toast.notSupported": "Install is not supported yet",

    "pwa.aria.installPrompt": "Install app prompt",


    // ===== Overview (e/overview) =====
    "overview.loading": "Loading…",
    "overview.firstTime": "First time",
    "overview.create.title": "Create household",
    "overview.create.desc": "Enter a household name. After creating it, you can invite your helper to join.",
    "overview.create.placeholder": "e.g. Chan Family",
    "overview.create.cta": "Create & go to invite",
    "overview.create.busy": "Creating…",

    "overview.create.step.household": "Creating household…",
    "overview.create.step.member": "Creating member…",
    "overview.create.step.user": "Saving user settings…",

    "overview.create.fail.household": "Failed to create household (step=household, {code})",
    "overview.create.fail.member": "Failed to create household (step=member, {code})",
    "overview.create.fail.user": "Failed to create household (step=user, {code})",

    "overview.create.successGoInvite": "Created ✅ Going to invite…",
    "overview.create.employerLabel": "Employer",

    "overview.loadFail": "Failed to load data (network or Firestore rules).",
    "overview.householdSubFail": "Failed to read household data (Firestore rules).",
    "overview.recordsFail": "Failed to load records (Firestore rules).",

    "overview.currencyPrefix": "HK$",

    "overview.cash.title": "Cash on hand",
    "overview.cash.desc": "Track how much cash your helper still has, so you know when to top up.",
    "overview.cash.edit": "✏️ Edit",
    "overview.cash.inputLabel": "Update amount (HK$)",
    "overview.cash.placeholder": "e.g. 2000",
    "overview.cash.invalid": "Please enter a valid amount (>= 0).",
    "overview.cash.updateFail": "Failed to update ‘Cash on hand’ (Firestore rules).",

    "overview.stats.month": "This month spend",
    "overview.stats.today": "Today spend",

    "overview.pending.title": "Pending",
    "overview.pending.sub": "Open a record to handle it",
    "overview.pending.aria": "Pending count {n}",
    "overview.pending.empty": "No pending ✅",

    "overview.flagged.title": "Needs follow-up",
    "overview.flagged.sub": "Open a record to handle it",
    "overview.flagged.aria": "Follow-up count {n}",
    "overview.flagged.empty": "No follow-up ✅",

    "overview.lightbox.title": "Receipt ({i}/{n})",
    "overview.lightbox.thumbAria": "Open image {n}",

    // Ads carousel
    "overview.ads.1.title": "Ad slot 1",
    "overview.ads.1.desc": "Partner deals / sponsorship can go here",
    "overview.ads.2.title": "Ad slot 2",
    "overview.ads.2.desc": "e.g. bookkeeping / household items discount",
    "overview.ads.3.title": "Ad slot 3",
    "overview.ads.3.desc": "e.g. insurance / helper services promotion",
    "overview.ads.cta": "View →",
    "overview.ads.dotAria": "Go to ad {n}",


    "records.title": "Records",
    "records.sub.recentAutoLoad": "Showing latest {n} records. Scroll to load more.",
    "records.currencyPrefix": "HK$",

    "records.err.loadProfile": "Failed to load (Firestore rules / permission).",
    "records.err.readFirst": "Failed to read (Firestore rules / index).",
    "records.err.loadMore": "Failed to load more (index may be required).",

    "records.filters.title": "Filter",
    "records.filters.titleActive": "Filter (active)",
    "records.filters.panelTitle": "Filter",
    "records.filters.clear": "Clear",
    "records.filters.all": "All",
    "records.filters.status.all": "All",
    "records.filters.status.submitted": "Pending",
    "records.filters.status.approved": "Approved",
    "records.filters.status.flagged": "Needs follow-up",
    "records.filters.category": "Category",
    "records.filters.submitter": "Submitted by",

    "records.csv.iconTitle": "Export CSV",
    "records.csv.title": "Export CSV (Pro)",
    "records.csv.sub": "For reconciliation / reimbursement / bookkeeping",
    "records.csv.basicNoExport": "You are on Basic (export disabled)",
    "records.csv.proOnly": "CSV export is a Pro feature.",
    "records.csv.thisMonth": "Export this month",
    "records.csv.all": "Export all",
    "records.csv.downloaded": "CSV downloaded ✅ ({n} rows)",

    "records.more.loading": "Loading more…",
    "records.more.hint": "(Scroll down to load more)",
    "records.more.end": "Reached the end ✅",
    "records.empty": "No records yet",

    "records.lightbox.title": "Receipt ({i}/{n})",
    "records.lightbox.thumbAria": "Open image {n}",

    "records.helper.default": "Helper",
    "records.category.other": "Other",

    // RecordCard
    "records.card.openReceipt": "Open receipt image",
    "records.card.receiptImage": "Receipt image",
    "records.card.receiptAlt": "Receipt",

    // RecordList
    "records.date.today": "Today",
    "records.date.unknown": "No date",

    // RecordPills
    "records.photos.morePrefix": "+",
    "records.photos.moreSuffix": " more photos",

    // RecordStatusTag
    "records.status.submitted": "Pending",
    "records.status.approved": "Approved",
    "records.status.flagged": "Needs follow-up",

    //records/[id]
    "record.detailTitle": "Record Details",
    "record.submitter": "Submitted by",
    "record.defaultHelper": "Helper",
    "record.noHousehold": "No household is set.",
    "record.loadFail": "Failed to load (network or Firestore rules).",
    "record.notFound": "Record not found.",
    "record.updateStatusFail": "Failed to update status.",

    "record.amount": "Amount",
    "record.note": "Note",

    "record.action.approve": "Approve",
    "record.action.flag": "Flag",
    "record.action.unflag": "Unflag",

    "record.recordIdLabel": "Record ID",
    "record.copyIdHint": "Click to copy (for CS)",
    "common.copied": "Copied ✅",

    "record.receiptPhotos": "Receipt Photos",
    "record.openReceiptImage": "Open receipt image",
    "record.receipt": "Receipt",
    "record.prevImage": "Previous",
    "record.nextImage": "Next",
    "record.close": "Close",

    "record.status.submitted": "Pending",
    "record.status.approved": "Approved",
    "record.status.flagged": "Flagged",

    "common.noData": "No data",
    "common.back": "Back",

    // Helpers page
    "helpers.title": "Helpers",
    "helpers.defaultLabel": "Helper",
    "helpers.uidLabel": "UID: {uid}",
    "helpers.joined": "Joined: {n}",
    "helpers.basicHint": "(Basic: max 1; upgrade to Pro for more)",
    "helpers.loadFail": "Failed to load (Firestore rules / permission).",
    "helpers.readFail": "Failed to read (rules / index).",
    "helpers.saveOk": "Saved ✅",
    "helpers.saveFail": "Save failed (rules).",

    "helpers.limit.basicFull": "You are on Basic and reached the limit (1 helper). Upgrade to Pro to invite more.",

    "helpers.invite.title": "Invite a helper",
    "helpers.invite.sub": "Each invite link can be used only once.",
    "helpers.invite.busy": "Creating…",
    "helpers.invite.limit": "Limit reached",
    "helpers.invite.cta": "Create invite link",
    "helpers.invite.needPro": "Limit reached. Upgrade to Pro to invite more.",
    "helpers.invite.created": "Invite link created ✅ (one-time use)",
    "helpers.invite.createFail": "Failed to create invite link (rules).",
    "helpers.invite.oneTimeLabel": "Invite link (one-time)",
    "helpers.invite.copied": "Link copied ✅",
    "helpers.invite.copyFail": "Copy failed. Please copy manually.",
    "helpers.invite.waShareAria": "Share via WhatsApp",
    "helpers.invite.waShareTitle": "Share via WhatsApp",
    "helpers.invite.regen": "Generate a new one",
    "helpers.invite.tip": "Tip: if they opened the wrong browser or lost it, generate a new link.",
    "helpers.invite.waText": "Hi! Please use this link to join and submit receipts (one-time use):\n{url}",

    "helpers.list.title": "Current helpers",
    "helpers.list.sub": "Use Edit to rename. Use Remove to disable a helper.",
    "helpers.list.empty": "No helper yet. Create an invite link to add one.",

    "helpers.edit.displayName": "Display name",
    "helpers.edit.placeholder": "e.g. Helper A",

    "helpers.remove.busy": "Removing…",
    "helpers.remove.confirm": "Remove \"{name}\"?\n(After removal, they can no longer submit records.)",
    "helpers.remove.ok": "Removed ✅",
    "helpers.remove.fail": "Remove failed (rules).",

    "helpers.noHousehold": "Household not found. Please finish creating a household first.",

    // Settings
    "settings.title": "Settings",
    "settings.loading": "Loading settings…",

    "settings.section.account": "Account",
    "settings.account.email": "Email",
    "settings.account.plan": "Plan",
    "settings.plan.basic": "Basic",
    "settings.plan.pro": "Pro",

    "settings.section.household": "Household",
    "settings.household.label": "Household",
    "settings.household.none": "Not created",
    "settings.household.defaultName": "My Home",
    "settings.household.name": "Household name",
    "settings.household.editHint": "Tap to edit name",
    "settings.household.placeholder": "e.g. My Home",

    "settings.section.general": "General",
    "settings.general.language": "Language",
    "settings.general.languageHint": "Tap to change language",

    "settings.logout": "Log out",
    "settings.logoutHint": "You will be returned to the login page",

    "settings.langModal.title": "Select language",
    "settings.langModal.subtitleEmployer": "Applies immediately to Employer interface",

    // =========================
    // Helper App
    // =========================

    //h/login
    "hLogin.title": "Helper Login",
    "hLogin.subtitle": "You will be automatically added after login",
    "hLogin.quickLogin": "Quick Login",
    "hLogin.error.generic": "Login failed. Please try again.",
    "hLogin.error.google": "Google login failed. Please try again.",

    //h/auth
    "app.brandName": "Helper Ledger",

    "common.backToLogin": "Back to login",
    "common.reminder": "Reminder",

    "hAuth.badgeTitle": "Signing in",
    "hAuth.title": "Please wait",
    "hAuth.goDirect": "Go directly",

    "hAuth.processing": "Completing sign-in…",
    "hAuth.successRedirecting": "Signed in ✅ Redirecting…",
    "hAuth.notCompleted": "Sign-in not completed. Please go back to the login page and try again.",
    "hAuth.failed": "Sign-in failed. Please go back to the login page and try again.",

    "hAuth.reminderText": "After signing in, you still need an invite link from the employer to officially join a household.",

    // Helper add
    "hAdd.submitter": "Submitted by",
    "hAdd.amount": "Amount (HK$)",
    "hAdd.amountPlaceholder": "e.g. 125.50",
    "hAdd.preview": "Preview",
    "hAdd.category": "Category",
    "hAdd.note": "Note (optional)",
    "hAdd.notePlaceholder": "e.g. rice, milk, tissues…",
    "hAdd.receipts": "Receipt photos (optional)",
    "hAdd.uploading": "Uploading…",
    "hAdd.pickPhotos": "+ Choose photos (multiple)",
    "hAdd.submitting": "Submitting…",
    "hAdd.uploadingPhotos": "Uploading photos…",
    "hAdd.submit": "Submit record",
    "hAdd.noHouseholdInline": "Household not found. Please join once using the employer invite link.",

    "hAdd.toast.joiningAfterLogin": "Login complete. Joining your household…",
    "hAdd.toast.noHousehold": "Not linked to a household. Please join once using the employer invite link.",
    "hAdd.toast.imageTooLarge": "One photo is too large (>8MB). Skipped.",
    "hAdd.toast.uploaded": "Photos uploaded ✅",
    "hAdd.toast.uploadFail": "Upload failed. Please try again.",
    "hAdd.toast.invalidAmount": "Please enter a valid amount.",
    "hAdd.toast.submittedWithCash": "Submitted ✅ (Cash on hand: HK$ {cash})",
    "hAdd.toast.submitFail": "Submit failed (Firestore rules/permission).",

    "common.helper": "Helper",
    "common.delete": "Delete",

    // Helper Records (h/records)
    "hRecords.hint": "Showing the latest {n} records. Scroll down to load more.",
    "hRecords.noHousehold": "No household linked. Please join once using the employer invite link.",
    "hRecords.loadFail": "Failed to load records (Firestore index or rules may be required).",
    "hRecords.loadMoreFail": "Failed to load more records.",
    "hRecords.empty": "No records yet.",

    "records.totalPrefix": "HK$",

    "common.loadingMore": "Loading more…",
    "common.scrollToLoad": "(Scroll down to load more)",
    "common.reachedEnd": "Reached the end ✅",

    // [id]/records
    "title.helper.recordDetail": "Record Details",

    "hRecordEdit.title": "Record",
    "hRecordEdit.header": "Record on {day} {time}",
    "hRecordEdit.noHousehold": "Not linked to a household. Please join using the employer’s invitation link.",
    "hRecordEdit.notFound": "Record not found.",
    "hRecordEdit.notOwner": "You cannot edit records created by others.",
    "hRecordEdit.locked": "This record is locked (not in pending status).",
    "hRecordEdit.loadFail": "Failed to load (possibly due to Firestore permissions).",
    "hRecordEdit.invalidAmount": "Please enter a valid amount.",
    "hRecordEdit.amount": "Amount (HK$)",
    "hRecordEdit.amountPlaceholder": "e.g. 125.5",
    "hRecordEdit.category": "Category",
    "hRecordEdit.note": "Note (optional)",
    "hRecordEdit.notePlaceholder": "e.g. rice, milk, tissues…",

    "category.food": "Groceries",
    "category.daily": "Daily necessities",
    "category.transport": "Transport",
    "category.other": "Other",

    "common.today": "Today",
    "common.saved": "Saved ✅",
    "common.saveFail": "Save failed",

    "date.year": "",
    "date.month": "/",
    "date.day": "",

    // Helper Settings page
    "hSettings.kicker": "Logging out isn’t a frequent action, so it fits naturally in Settings.",
    "hSettings.logoutHint": "Tip: after logging out, you’ll need to join again via an invite link to rebind the household.",
    // Lang modal subtitles
    "settings.langModal.subtitleHelper": "This only affects the Helper app language (/h/*).",

    //join page
    "join.title": "Join household",
    "join.token": "Token",
    "join.preparing": "Preparing to join…",
    "join.verifying": "Verifying invite link…",
    "join.joining": "Joining household…",
    "join.invalidOrExpired": "This invite link is invalid or has expired.",
    "join.revoked": "This invite link has been revoked.",
    "join.used": "This invite link has already been used (one-time). Please ask the employer to create a new one.",
    "join.expired": "This invite link has expired. Please ask the employer to create a new one.",
    "join.successToAdd": "Joined ✅ Redirecting to Add…",
    "join.successToOverview": "Joined ✅ Redirecting to Overview…",
    "join.failWithCode": "Join failed ({code}). Usually rules/permission, invite already used, or payload mismatch.",

    "common.employer": "Employer",
};

const id: Dict = {
    // Landing
    "landing.brand": "Catatan Asisten",
    "landing.helperEntry": "Asisten",
    "landing.employerEntry": "Majikan",
    "landing.kicker": "Jelas. Sederhana. Rekonsiliasi harian.",
    "landing.title": "Catatan Asisten",
    "landing.sub":
        "Asisten mencatat pengeluaran harian (belanja kebutuhan) dan mengunggah struk. Majikan melihat total per hari, menyetujui, dan menindaklanjuti—tanpa Excel, tanpa chat bolak-balik.",
    "landing.ctaEmployer": "Buka App Majikan",
    "landing.ctaHelper": "Buka App Asisten",
    "landing.mini1": "✅ Dikelompokkan per hari + total harian",
    "landing.mini2": "✅ Menunggu / Disetujui / Perlu tindak lanjut",
    "landing.mini3": "✅ Foto struk untuk audit mudah",
    "landing.f1.title": "Total harian sekali lihat",
    "landing.f1.text": "Dikelompokkan per tanggal dengan total otomatis—tanpa tebak-tebakan.",
    "landing.f2.title": "Struk + catatan",
    "landing.f2.text": "Bukti foto dan catatan mempercepat audit/penggantian.",
    "landing.f3.title": "Alur persetujuan sederhana",
    "landing.f3.text": "Menunggu / Disetujui / Ditandai tetap rapi dan jelas.",
    "landing.preview.title": "Pratinjau App",
    "landing.preview.pill": "Contoh: Total hari ini HK$ 428.50",
    "landing.preview.note":
        "Tips: Kalau nanti kamu kasih screenshot asli /e/records atau /h/records, kita bisa ganti bagian ini jadi preview yang lebih kuat.",
    "landing.lang": "Bahasa",

    // Nav
    "nav.add": "Tambah",
    "nav.records": "Catatan",
    "nav.settings": "Pengaturan",
    "nav.overview": "Ringkasan",
    "nav.helpers": "Asisten",

    // Titles
    "title.employer.settings": "Pengaturan",
    "title.employer.overview": "Ringkasan",
    "title.employer.records": "Catatan",
    "title.employer.helpers": "Asisten",

    "title.helper.add": "Tambah",
    "title.helper.records": "Catatan",
    "title.helper.settings": "Pengaturan",

    // Common
    "common.loading": "Memuat…",
    "common.copy": "Salin",
    "common.edit": "Ubah",
    "common.remove": "Hapus",
    "common.save": "Simpan",
    "common.saving": "Menyimpan…",
    "common.cancel": "Batal",
    "common.dash": "—",
    "common.close": "Tutup",
    "common.selected": "Dipilih",

    //offline page
    "offline.title": "Kamu sedang offline",
    "offline.description": "Tidak ada koneksi internet. Kamu bisa kembali dan mencoba lagi, atau muat ulang setelah koneksi pulih.",

    //e/auth
    "auth.processingTitle": "Memproses login",
    "auth.processingLogin": "Menyelesaikan login…",
    "auth.loginSuccessRedirecting": "Login berhasil ✅ Mengalihkan…",
    "auth.invalidLink": "Tautan ini tidak valid. Silakan minta tautan baru.",
    "auth.promptEmail": "Masukkan email Anda untuk menyelesaikan login:",
    "auth.missingEmail": "Email diperlukan untuk menyelesaikan login.",
    "auth.loginFailed": "Login gagal. Silakan coba lagi.",
    "auth.backToLogin": "Kembali ke halaman login",

    // e/login
    "login.employer.title": "Login majikan",
    "login.employer.subtitle": "Masuk dengan tautan email atau Google",

    "login.emailLabel": "Alamat email",
    "login.emailPlaceholder": "you@example.com",

    "login.sendLink": "Kirim tautan masuk",
    "login.sending": "Mengirim…",

    "login.sentTitle": "Terkirim ✅",
    "login.sentText": "Silakan cek email Anda dan klik tautan untuk menyelesaikan login.",

    "login.emailRequired": "Silakan masukkan alamat email",
    "login.sendFail": "Gagal mengirim. Silakan coba lagi nanti.",
    "login.googleFail": "Login Google gagal. Silakan coba lagi.",

    "common.or": "atau",

    "brand.name": "Catatan Asisten",
    "brand.alt": "Catatan Asisten",

    "auth.googleLogin": "Masuk dengan Google",

    //installBanner
    "role.employer": "Majikan",
    "role.helper": "Asisten",

    "pwa.title": "Tambahkan ke Layar Utama",
    "pwa.desc.ios": "Di Safari, ketuk Bagikan → Tambahkan ke Layar Utama.",
    "pwa.desc.default": "Instal sekali lalu buka cepat—tidak perlu cari lagi.",

    "pwa.btn.iosGuide": "Lihat panduan",
    "pwa.btn.install": "Instal",
    "pwa.btn.addToHome": "Tambahkan ke Layar Utama",
    "pwa.btn.remind7d": "Ingatkan 7 hari lagi",

    "pwa.toast.installed": "Sudah ditambahkan ✅",
    "pwa.toast.followSteps": "Ikuti panduan untuk menambahkan ✅",
    "pwa.toast.notSupported": "Fitur instal belum didukung",

    "pwa.aria.installPrompt": "Install app prompt",


    // ===== Overview (e/overview) =====
    "overview.loading": "Memuat…",
    "overview.firstTime": "Pertama kali",
    "overview.create.title": "Buat rumah tangga",
    "overview.create.desc": "Masukkan nama rumah tangga. Setelah dibuat, kamu bisa mengundang asisten untuk bergabung.",
    "overview.create.placeholder": "contoh: Keluarga Bapak Chan",
    "overview.create.cta": "Buat & lanjut undang",
    "overview.create.busy": "Membuat…",

    "overview.create.step.household": "Membuat rumah tangga…",
    "overview.create.step.member": "Membuat anggota…",
    "overview.create.step.user": "Menyimpan pengaturan pengguna…",

    "overview.create.fail.household": "Gagal membuat rumah tangga (step=household, {code})",
    "overview.create.fail.member": "Gagal membuat rumah tangga (step=member, {code})",
    "overview.create.fail.user": "Gagal membuat rumah tangga (step=user, {code})",

    "overview.create.successGoInvite": "Berhasil ✅ Menuju undang…",
    "overview.create.employerLabel": "Majikan",

    "overview.loadFail": "Gagal memuat data (jaringan atau aturan Firestore).",
    "overview.householdSubFail": "Gagal membaca data rumah tangga (aturan Firestore).",
    "overview.recordsFail": "Gagal memuat catatan (aturan Firestore).",

    "overview.currencyPrefix": "HK$",

    "overview.cash.title": "Uang tunai di tangan",
    "overview.cash.desc": "Catat sisa uang tunai yang dipegang asisten, supaya kamu tahu kapan perlu top up.",
    "overview.cash.edit": "✏️ Edit",
    "overview.cash.inputLabel": "Perbarui jumlah (HK$)",
    "overview.cash.placeholder": "contoh: 2000",
    "overview.cash.invalid": "Masukkan jumlah yang valid (>= 0).",
    "overview.cash.updateFail": "Gagal memperbarui ‘Uang tunai di tangan’ (aturan Firestore).",

    "overview.stats.month": "Pengeluaran bulan ini",
    "overview.stats.today": "Pengeluaran hari ini",

    "overview.pending.title": "Menunggu",
    "overview.pending.sub": "Buka catatan untuk memproses",
    "overview.pending.aria": "Jumlah menunggu {n}",
    "overview.pending.empty": "Tidak ada yang menunggu ✅",

    "overview.flagged.title": "Perlu tindak lanjut",
    "overview.flagged.sub": "Buka catatan untuk memproses",
    "overview.flagged.aria": "Jumlah tindak lanjut {n}",
    "overview.flagged.empty": "Tidak ada tindak lanjut ✅",

    "overview.lightbox.title": "Struk ({i}/{n})",
    "overview.lightbox.thumbAria": "Buka gambar {n}",

    // Ads carousel
    "overview.ads.1.title": "Slot promo 1",
    "overview.ads.1.desc": "Promo partner / sponsor bisa ditaruh di sini",
    "overview.ads.2.title": "Slot promo 2",
    "overview.ads.2.desc": "mis: pencatatan / diskon kebutuhan rumah",
    "overview.ads.3.title": "Slot promo 3",
    "overview.ads.3.desc": "mis: asuransi / layanan asisten rumah tangga",
    "overview.ads.cta": "Lihat →",
    "overview.ads.dotAria": "Ke promo {n}",

    "records.title": "Catatan",
    "records.sub.recentAutoLoad": "Menampilkan {n} catatan terbaru. Gulir ke bawah untuk memuat lebih banyak.",
    "records.currencyPrefix": "HK$",

    "records.err.loadProfile": "Gagal memuat (aturan Firestore / izin).",
    "records.err.readFirst": "Gagal membaca (aturan Firestore / index).",
    "records.err.loadMore": "Gagal memuat lebih banyak (mungkin perlu index).",

    "records.filters.title": "Filter",
    "records.filters.titleActive": "Filter (aktif)",
    "records.filters.panelTitle": "Filter",
    "records.filters.clear": "Bersihkan",
    "records.filters.all": "Semua",
    "records.filters.status.all": "Semua",
    "records.filters.status.submitted": "Menunggu",
    "records.filters.status.approved": "Disetujui",
    "records.filters.status.flagged": "Perlu tindak lanjut",
    "records.filters.category": "Kategori",
    "records.filters.submitter": "Dikirim oleh",

    "records.csv.iconTitle": "Ekspor CSV",
    "records.csv.title": "Ekspor CSV (Pro)",
    "records.csv.sub": "Untuk rekonsiliasi / penggantian / pembukuan",
    "records.csv.basicNoExport": "Kamu pakai Basic (ekspor nonaktif)",
    "records.csv.proOnly": "Ekspor CSV adalah fitur Pro.",
    "records.csv.thisMonth": "Ekspor bulan ini",
    "records.csv.all": "Ekspor semua",
    "records.csv.downloaded": "CSV terunduh ✅ ({n} baris)",

    "records.more.loading": "Memuat lebih banyak…",
    "records.more.hint": "(Gulir ke bawah untuk memuat lebih banyak)",
    "records.more.end": "Sudah paling bawah ✅",
    "records.empty": "Belum ada catatan",

    "records.lightbox.title": "Struk ({i}/{n})",
    "records.lightbox.thumbAria": "Buka gambar {n}",

    "records.helper.default": "Asisten",
    "records.category.other": "Lainnya",

    // RecordCard

    "records.card.openReceipt": "Buka gambar struk",
    "records.card.receiptImage": "Gambar struk",
    "records.card.receiptAlt": "Struk",

    // RecordList
    "records.date.today": "Hari ini",
    "records.date.unknown": "Tanpa tanggal",

    // RecordPills
    "records.photos.morePrefix": "+",
    "records.photos.moreSuffix": " foto lagi",

    // RecordStatusTag
    "records.status.submitted": "Menunggu",
    "records.status.approved": "Disetujui",
    "records.status.flagged": "Perlu tindak lanjut",

    //records/[id]
    "record.detailTitle": "Detail Catatan",
    "record.submitter": "Dikirim oleh",
    "record.defaultHelper": "Asisten",
    "record.noHousehold": "Rumah tangga belum diatur.",
    "record.loadFail": "Gagal memuat (jaringan atau aturan Firestore).",
    "record.notFound": "Catatan tidak ditemukan.",
    "record.updateStatusFail": "Gagal memperbarui status.",

    "record.amount": "Jumlah",
    "record.note": "Catatan",

    "record.action.approve": "Setujui",
    "record.action.flag": "Tandai",
    "record.action.unflag": "Batalkan Tanda",

    "record.recordIdLabel": "ID Catatan",
    "record.copyIdHint": "Klik untuk menyalin (CS)",
    "common.copied": "Tersalin ✅",

    "record.receiptPhotos": "Foto Struk",
    "record.openReceiptImage": "Buka foto struk",
    "record.receipt": "Struk",
    "record.prevImage": "Sebelumnya",
    "record.nextImage": "Berikutnya",
    "record.close": "Tutup",

    "record.status.submitted": "Menunggu",
    "record.status.approved": "Disetujui",
    "record.status.flagged": "Perlu Tindak Lanjut",

    "common.noData": "Belum ada data",
    "common.back": "Kembali",

    // Helpers page
    "helpers.title": "Asisten",
    "helpers.defaultLabel": "Asisten",
    "helpers.uidLabel": "UID: {uid}",
    "helpers.joined": "Sudah bergabung: {n}",
    "helpers.basicHint": "(Basic: maks 1; upgrade ke Pro untuk tambah)",
    "helpers.loadFail": "Gagal memuat (aturan/izin Firestore).",
    "helpers.readFail": "Gagal membaca (rules / index).",
    "helpers.saveOk": "Tersimpan ✅",
    "helpers.saveFail": "Gagal menyimpan (rules).",

    "helpers.limit.basicFull": "Paket kamu Basic dan sudah mencapai batas (1 asisten). Upgrade ke Pro untuk mengundang lebih banyak.",

    "helpers.invite.title": "Undang asisten",
    "helpers.invite.sub": "Setiap tautan undangan hanya bisa dipakai sekali.",
    "helpers.invite.busy": "Membuat…",
    "helpers.invite.limit": "Batas tercapai",
    "helpers.invite.cta": "Buat tautan undangan",
    "helpers.invite.needPro": "Batas tercapai. Upgrade ke Pro untuk mengundang lebih banyak.",
    "helpers.invite.created": "Tautan undangan dibuat ✅ (sekali pakai)",
    "helpers.invite.createFail": "Gagal membuat tautan undangan (rules).",
    "helpers.invite.oneTimeLabel": "Tautan undangan (sekali pakai)",
    "helpers.invite.copied": "Tautan disalin ✅",
    "helpers.invite.copyFail": "Gagal menyalin. Silakan salin manual.",
    "helpers.invite.waShareAria": "Bagikan via WhatsApp",
    "helpers.invite.waShareTitle": "Bagikan via WhatsApp",
    "helpers.invite.regen": "Buat yang baru",
    "helpers.invite.tip": "Tip: kalau salah browser atau lupa, buat tautan baru.",
    "helpers.invite.waText": "Halo! Silakan pakai tautan ini untuk bergabung dan kirim struk (sekali pakai):\n{url}",

    "helpers.list.title": "Asisten saat ini",
    "helpers.list.sub": "Gunakan Ubah untuk ganti nama. Gunakan Hapus untuk menonaktifkan asisten.",
    "helpers.list.empty": "Belum ada asisten. Buat tautan undangan untuk menambah.",

    "helpers.edit.displayName": "Nama tampilan",
    "helpers.edit.placeholder": "mis. Asisten A",

    "helpers.remove.busy": "Menghapus…",
    "helpers.remove.confirm": "Hapus \"{name}\"?\n(Setelah dihapus, tidak bisa mengirim catatan lagi.)",
    "helpers.remove.ok": "Berhasil dihapus ✅",
    "helpers.remove.fail": "Gagal menghapus (rules).",

    "helpers.noHousehold": "Data household tidak ditemukan. Silakan buat household terlebih dahulu.",

    // Settings
    "settings.title": "Pengaturan",
    "settings.loading": "Memuat pengaturan…",

    "settings.section.account": "Akun",
    "settings.account.email": "Email",
    "settings.account.plan": "Paket",
    "settings.plan.basic": "Basic",
    "settings.plan.pro": "Pro",

    "settings.section.household": "Rumah Tangga",
    "settings.household.label": "Rumah Tangga",
    "settings.household.none": "Belum dibuat",
    "settings.household.defaultName": "Rumah Saya",
    "settings.household.name": "Nama rumah tangga",
    "settings.household.editHint": "Ketuk untuk ubah nama",
    "settings.household.placeholder": "contoh: Rumah Saya",

    "settings.section.general": "Umum",
    "settings.general.language": "Bahasa",
    "settings.general.languageHint": "Ketuk untuk mengganti bahasa",

    "settings.logout": "Keluar",
    "settings.logoutHint": "Kamu akan kembali ke halaman masuk",

    "settings.langModal.title": "Pilih bahasa",
    "settings.langModal.subtitleEmployer": "Langsung diterapkan untuk antarmuka Majikan",


    // =========================
    // Helper App
    // =========================

    //h/login
    "hLogin.title": "Login Asisten",
    "hLogin.subtitle": "Setelah login, kamu akan otomatis bergabung",
    "hLogin.quickLogin": "Login Cepat",
    "hLogin.error.generic": "Login gagal. Silakan coba lagi.",
    "hLogin.error.google": "Login Google gagal. Silakan coba lagi.",

    //h/auth
    "app.brandName": "Catatan Asisten",

    "common.backToLogin": "Kembali ke login",
    "common.reminder": "Pengingat",

    "hAuth.badgeTitle": "Memproses login",
    "hAuth.title": "Mohon tunggu",
    "hAuth.goDirect": "Masuk langsung",

    "hAuth.processing": "Menyelesaikan login…",
    "hAuth.successRedirecting": "Login berhasil ✅ Mengalihkan…",
    "hAuth.notCompleted": "Login belum selesai. Silakan kembali ke halaman login dan coba lagi.",
    "hAuth.failed": "Login gagal. Silakan kembali ke halaman login dan coba lagi.",

    "hAuth.reminderText": "Setelah login, kamu tetap perlu tautan undangan dari pemberi kerja untuk resmi bergabung ke rumah tangga.",

    // Helper add
    "hAdd.submitter": "Dikirim oleh",
    "hAdd.amount": "Jumlah (HK$)",
    "hAdd.amountPlaceholder": "contoh 125.50",
    "hAdd.preview": "Pratinjau",
    "hAdd.category": "Kategori",
    "hAdd.note": "Catatan (opsional)",
    "hAdd.notePlaceholder": "contoh: beras, susu, tisu…",
    "hAdd.receipts": "Foto struk (opsional)",
    "hAdd.uploading": "Mengunggah…",
    "hAdd.pickPhotos": "+ Pilih foto (bisa banyak)",
    "hAdd.submitting": "Mengirim…",
    "hAdd.uploadingPhotos": "Mengunggah foto…",
    "hAdd.submit": "Kirim catatan",
    "hAdd.noHouseholdInline": "Data rumah tangga tidak ditemukan. Silakan bergabung lewat tautan undangan majikan.",

    "hAdd.toast.joiningAfterLogin": "Login selesai. Menghubungkan ke rumah tangga…",
    "hAdd.toast.noHousehold": "Belum terhubung ke rumah tangga. Silakan bergabung lewat tautan undangan majikan.",
    "hAdd.toast.imageTooLarge": "Ada foto terlalu besar (>8MB), dilewati.",
    "hAdd.toast.uploaded": "Foto berhasil diunggah ✅",
    "hAdd.toast.uploadFail": "Gagal mengunggah. Coba lagi.",
    "hAdd.toast.invalidAmount": "Masukkan jumlah yang valid.",
    "hAdd.toast.submittedWithCash": "Terkirim ✅ (Uang tunai: HK$ {cash})",
    "hAdd.toast.submitFail": "Gagal mengirim (aturan/izin Firestore).",

    "common.helper": "Asisten",
    "common.delete": "Hapus",

    // Helper Records (h/records)
    "hRecords.hint": "Menampilkan {n} catatan terbaru. Gulir ke bawah untuk memuat lebih banyak.",
    "hRecords.noHousehold": "Belum terhubung ke household. Silakan bergabung lewat tautan undangan majikan.",
    "hRecords.loadFail": "Gagal memuat catatan (mungkin perlu index atau aturan Firestore).",
    "hRecords.loadMoreFail": "Gagal memuat catatan tambahan.",
    "hRecords.empty": "Belum ada catatan.",

    "records.totalPrefix": "HK$",

    "common.loadingMore": "Memuat lebih banyak…",
    "common.scrollToLoad": "(Gulir ke bawah untuk memuat)",
    "common.reachedEnd": "Sudah mencapai akhir ✅",

    // [id]/records
    "title.helper.recordDetail": "Detail Catatan",

    "hRecordEdit.title": "Catatan",
    "hRecordEdit.header": "Catatan pada {day} {time}",
    "hRecordEdit.noHousehold": "Belum terhubung ke rumah tangga. Silakan bergabung melalui tautan undangan majikan.",
    "hRecordEdit.notFound": "Catatan tidak ditemukan.",
    "hRecordEdit.notOwner": "Anda tidak dapat mengedit catatan milik orang lain.",
    "hRecordEdit.locked": "Catatan ini terkunci (bukan dalam status menunggu persetujuan).",
    "hRecordEdit.loadFail": "Gagal memuat (kemungkinan izin Firestore).",
    "hRecordEdit.invalidAmount": "Silakan masukkan jumlah yang valid.",
    "hRecordEdit.amount": "Jumlah (HK$)",
    "hRecordEdit.amountPlaceholder": "contoh 125.5",
    "hRecordEdit.category": "Kategori",
    "hRecordEdit.note": "Catatan (opsional)",
    "hRecordEdit.notePlaceholder": "contoh: beras, susu, tisu…",

    "category.food": "Belanja dapur",
    "category.daily": "Kebutuhan sehari-hari",
    "category.transport": "Transportasi",
    "category.other": "Lainnya",

    "common.today": "Hari ini",
    "common.saved": "Tersimpan ✅",
    "common.saveFail": "Gagal menyimpan",

    "date.year": "",
    "date.month": "/",
    "date.day": "",

    // Helper Settings page
    "hSettings.kicker": "Keluar bukan tindakan yang sering, jadi lebih cocok ditempatkan di halaman Pengaturan.",
    "hSettings.logoutHint": "Tips: setelah keluar, kamu perlu bergabung lagi lewat tautan undangan untuk menghubungkan ulang household.",
    // Lang modal subtitles
    "settings.langModal.subtitleHelper": "Ini hanya memengaruhi bahasa aplikasi Asisten (/h/*).",

    "join.title": "Gabung ke rumah tangga",
    "join.token": "Token",
    "join.preparing": "Menyiapkan proses bergabung…",
    "join.verifying": "Memverifikasi tautan undangan…",
    "join.joining": "Sedang bergabung ke rumah tangga…",
    "join.invalidOrExpired": "Tautan undangan tidak valid atau sudah tidak berlaku.",
    "join.revoked": "Tautan undangan ini sudah dibatalkan.",
    "join.used": "Tautan undangan ini sudah pernah dipakai (sekali pakai). Minta majikan buat tautan baru.",
    "join.expired": "Tautan undangan sudah kedaluwarsa. Minta majikan buat tautan baru.",
    "join.successToAdd": "Berhasil bergabung ✅ Mengalihkan ke Tambah…",
    "join.successToOverview": "Berhasil bergabung ✅ Mengalihkan ke Ringkasan…",
    "join.failWithCode": "Gagal bergabung ({code}). Biasanya karena aturan/izin, undangan sudah dipakai, atau data tidak sesuai.",

    "common.employer": "Majikan",
};

const DICTS: Record<Lang, Dict> = {
    "zh-HK": zhHK,
    en,
    id,
};

export function tKey(lang: Lang, key: string): string {
    return DICTS[lang]?.[key] ?? DICTS["zh-HK"]?.[key] ?? key;
}