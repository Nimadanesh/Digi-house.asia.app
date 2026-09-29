---
docId: fifi.troubleshooting.troubleshooting.wallet-connection.v1
docType: troubleshooting
domain: troubleshooting
title: "مشکل اتصال کیف پول"
locale: fa
source: implementation audit FIFI-01 (WalletChooserSheet.tsx, useTonConnect.ts, useEvmWallet.ts)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# مشکل اتصال کیف پول

**نشانه:** کیف پول وصل نمی‌شود یا کیف موردنظر در فهرست نیست.

**راهنمای تأییدشده:**
- اتصال موقع اولین تراکنش از صفحه‌ی انتخاب کیف انجام می‌شود: کیف‌های TON با
  TonConnect و کیف‌های EVM (اتریوم، BSC، Polygon، Arbitrum) با اتصال‌دهنده‌ی EVM.
- کیف‌هایی که روی این دو مسیر نیستند **Coming Soon** نشان داده می‌شوند؛ این باگ
  نیست و موردانتظار است.
- رفتار جفت‌سازی به اپ کیف پول شما بستگی دارد و Fifi داخل اپ سوم‌شخص را عیب‌یابی
  نمی‌کند. اگر خود صفحه‌ی انتخاب باز نشد، به پشتیبانی ارجاع دهید.

علت‌های تأییدنشده **نامشخص** می‌مانند و حدس زده نمی‌شوند.
