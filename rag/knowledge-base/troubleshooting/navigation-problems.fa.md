---
docId: fifi.troubleshooting.troubleshooting.navigation-problems.v1
docType: troubleshooting
domain: troubleshooting
title: "مشکل مسیریابی"
locale: fa
source: implementation audit FIFI-01 (tab bar, deep-link.ts, back-stack behavior)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# مشکل مسیریابی

**نشانه:** صفحه‌ای را پیدا نمی‌کنید یا لینک جای اشتباهی باز شد.

**راهنمای تأییدشده:**
- نوار پایین فقط چهار تب دارد: Home، Marketplace، Earnings و Portfolio. بقیه
  (Settings، Club، Referral، Card و صفحات ویلا) از هدر، کارت‌ها یا لینک‌ها باز
  می‌شوند.
- لینک ویلا از وب‌سایت مستقیم صفحه‌ی همان ملک را باز می‌کند؛ پارامتر خراب یا قدیمی
  رد می‌شود و به Home برمی‌گردید — این موردانتظار است.
- دکمه‌ی برگشت اول شیتِ باز را می‌بندد و جای هر تب را نگه می‌دارد.

تنظیمات سمت ربات و نام کاربری آن برای Fifi **نامشخص** است.
