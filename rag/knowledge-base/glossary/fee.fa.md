---
docId: fifi.glossary.glossary.fee.v1
docType: glossary
domain: glossary
title: "کارمزد (Fee)"
locale: fa
source: PRODUCT-PLAN.md §0.5; src/lib/mock/withdrawals.ts; docs/product/rebuild/PRODUCT-DECISION-LOCK.md §6
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
entities:
  - {kind: glossary-term, id: fee}
related:
  - fifi.glossary.glossary.withdrawal.v1
  - fifi.economics.app-guide.commissions-and-fees.v1
---

# کارمزد (Fee)

**معادل فارسی:** کارمزد

**توضیح ساده:** مبلغی که پلتفرم بابت خدماتش برمی‌دارد؛ مثل کارمزد صرافی.

**معنای اختصاصی در FractionalLuxe:** سه چیز جدا که نباید قاطی شوند: (۱) **کارمزد
پلتفرم** روی هر خرید و فروش (جدول ۹پله‌ای)؛ (۲) **کارمزد ۱٪ برداشت** هنگام ثبت
درخواست (خالص در ۴ قسط هفتگی)؛ (۳) **تخفیف ۷٪ بازخرید اولیه** که کارمزد نیست،
بلکه قیمت بازخرید پلتفرم در عرضه‌ی اولیه است. نرخ دقیق کارمزدها را فقط از جدول
رسمی (`GET /v1/fees`) باید دید، نه از حافظه.

**مرتبط:** Withdrawal (برداشت)، راهنمای Commissions & Fees.
