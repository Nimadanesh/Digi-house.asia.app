---
docId: fifi.troubleshooting.troubleshooting.transaction-states.v1
docType: troubleshooting
domain: troubleshooting
title: "وضعیت‌های تأیید تراکنش"
locale: fa
source: implementation audit FIFI-01 (sendTx.ts, withdrawal/verify flows, runbook stuck-pending-buy.md)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# وضعیت‌های تأیید تراکنش

**نشانه:** تراکنش در حالت «در انتظار» مانده یا «ناموفق» شده.

**راهنمای تأییدشده:**
- هر تراکنش یک وضعیت دارد: **در انتظار / موفق / ناموفق**. «در انتظار» یعنی نتیجه
  هنوز معلوم نیست و به‌خودی‌خود خطا نیست.
- پرداخت‌های روی زنجیره قبل از تسویه از سمت سرور بررسی می‌شوند؛ بعضی حالت‌ها
  قابل تلاش مجدد‌اند و بعضی نهایی. وضعیت دقیق تراکنش *شما* داده‌ی زنده است و در
  اپ دیده می‌شود — Fifi نتیجه‌ی تراکنش خاصی را حدس نمی‌زند.
- برای خریدِ گیرکرده در انتظار، مسیر پشتیبانی سند `stuck-pending-buy` است.

برای تراکنش خاص، راه‌حل اختراع نمی‌شود.
