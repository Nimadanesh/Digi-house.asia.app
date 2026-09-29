---
docId: fifi.product.app-guide.app-overview-and-navigation.v1
docType: app-guide
domain: product
title: "نمای کلی اپ و مسیریابی"
locale: fa
source: implementation audit FIFI-01
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# نمای کلی اپ و مسیریابی

فرکشنال‌لوکس (FractionalLuxe) روی وب‌سایت و اپ خودش در چند بلاکچین (TON و EVM) کار می‌کند: خرید
سهم کسری ویلاهای لوکس، قفل کردن سهم برای سود ماهانه و معامله در بازار ثانویه.

| بخش | عمل | چه می‌بینید |
|---|---|---|
| **Home** | `action.open-home` | موجودی، پرداخت بعدی، کارت ملک‌ها |
| **Marketplace** | `action.open-marketplace` | ۲۴ ملک با قیمت، وضعیت فروش و درآمد پیش‌بینی‌شده‌ی هر سهم + جست‌وجو و فیلتر |
| **صفحه‌ی ملک** | `action.open-estate` | هر ویلا در `/property/[id]`: عکس، قیمت، نوار فروش، ارزش، آمار و پنج تب؛ شروع Buy و Sell اینجاست |
| **Earnings** | `action.open-earnings` | دریافتی (فقط پرداخت‌شده)، انباشته، سوابق هر ملک |
| **Portfolio** | `action.open-portfolio` | دارایی‌ها، توزیع و سفارش‌های باز (قابل لغو تا قبل از انجام) |
| **Settings** | `action.open-settings` | از هدر (تب نیست): کیف پول، زبان، تم، حقوقی |
| **Club** | `action.open-club` | سطح‌ها و مزایا (دامنه‌ی نمونه‌ی اولیه) |
| **Referral** | `action.open-invite` | دعوت (دامنه‌ی نمونه‌ی اولیه) |

## مسیر کلی

۱. **کشف:** در مارکت‌پلیس بگردید و صفحه‌ی ویلا و تب‌هایش را بخوانید. ۲. **خرید:**
تعداد، بررسی جمع و درآمد پیش‌بینی‌شده، تأیید در اپ و امضا در کیف پول. ۳. **قفل
برای سود:** در تب Earn قفل کنید تا سود ماهانه (سناریوی Average) تعلق بگیرد.
۴. **پیگیری:** Earnings (دریافتی + انباشته) و Portfolio (دارایی + سفارش).
۵. **برداشت یا خروج:** برداشت هر زمان (۱٪ کارمزد، خالص در ۴ قسط هفتگی) یا باز
کردن قفل و فروش — در عرضه‌ی اولیه به پلتفرم با ۷٪ تخفیف، یا در بازار ثانویه به
کاربران دیگر.
