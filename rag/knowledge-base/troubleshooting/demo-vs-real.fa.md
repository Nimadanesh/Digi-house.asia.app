---
docId: fifi.troubleshooting.troubleshooting.demo-vs-real.v1
docType: troubleshooting
domain: troubleshooting
title: "داده‌ی نمایشی در برابر واقعی"
locale: fa
source: docs/product/rebuild/PRODUCT-DECISION-LOCK.md §2E; implementation audit FIFI-01 (DemoModeBadge, simulated labels)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# داده‌ی نمایشی در برابر واقعی

**نشانه:** مطمئن نیستید یک عدد واقعی است یا نه.

**راهنمای تأییدشده:**
- نسخه‌ی فعلی نمایشی است و نشان **«Demo mode»** دارد. ردیف‌های پرداخت نمایشی برچسب
  **simulated** دارند. این داده برای نمایش کامل مسیر است، نه سابقه‌ی واقعی.
- قاعده: هرچه برچسب Demo/simulated دارد نمایشی است؛ هرچه برچسب ندارد (مشخصات ملک،
  محاسبات، وضعیت‌ها) مطابق منبع تنظیم‌شده‌اش درست است.
- کاربر جعلی، معامله‌ی واقعی‌نمایی‌شده، سودِ سابقه‌جازده‌شده و شراکت ادعایی وجود
  ندارد — اگر چیزی شبیه آن دیدید گزارش بدهید، نه اینکه اعتماد کنید.
