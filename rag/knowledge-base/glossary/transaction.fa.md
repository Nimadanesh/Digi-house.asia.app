---
docId: fifi.glossary.glossary.transaction.v1
docType: glossary
domain: glossary
title: "تراکنش (Transaction)"
locale: fa
source: implementation audit FIFI-01 (sendTx.ts, http-repos.ts, mock settlement)
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
entities:
  - {kind: glossary-term, id: transaction}
related:
  - fifi.glossary.glossary.wallet.v1
---
# تراکنش (Transaction)

**تراکنش** اقدامی است که با تأیید کیف پول انجام می‌شود؛ مثل پرداخت خرید یا یک عملیات مرتبط با سفارش و معمولاً وضعیتی مانند «در انتظار»، «موفق» یا «ناموفق» دارد.

اگر تراکنش روی بلاکچین ثبت شده باشد، می‌تواند هش تراکنش هم داشته باشد. فعالیت نمایشی یا شبیه‌سازی‌شده را نباید سابقه‌ی واقعی بلاکچین در نظر گرفت.

وضعیت یک تراکنش مشخص می‌تواند تغییر کند؛ برای آخرین وضعیت، اطلاعات همان تراکنش یا بخش Activity اپ را بررسی کنید.

**مرتبط:** Wallet (کیف پول)، Withdrawal (برداشت)، Open Orders (سفارش‌های باز).
