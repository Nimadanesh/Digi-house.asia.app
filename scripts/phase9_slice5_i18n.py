#!/usr/bin/env python3
"""Phase 9 Slice 5 (Income /earnings) i18n reframe in all 12 locale files.

Mirrors the phase9_slice4_i18n.py convention. The Earnings surface is reframed
to rental-income semantics (Phase 9 redesign §10 / UI Mapping §7) per the
weekly-vs-monthly conflict UX rules (§7.3 AUDIT-OVERRIDE):

* updates values: hero total -> "Received in total" (paid money only),
  next payout -> "Next distribution" + status word Expected (never
  "guaranteed"/"Est."), chart caption -> the one honest alignment line
  (§7.3 rule 5), timeline "Next estimated" -> "Expected", lock-yield card
  -> "Accrued income" with "Projected monthly" (conversion always attached
  to the word projected/Expected, §7.3 rule 2).
* adds keys: page title/subtitle, Expected status word, Accrued timeline
  row ("paid with next distribution" — no period claim), chart legend
  (Paid / Projected), Income-by-estate section.
* removes keys orphaned by the reframe: timelineAccruing,
  timelineAccruingSub ("current month" — a non-authoritative period claim),
  timelineCaption ("Monthly accrual; payouts reconcile every Sunday." —
  frequency claims, §7.3 rule 1).

The earnings.* namespace is kept (components/route stay earnings-named; the
bottom-nav "Earnings" label change belongs to Milestone 9.1, deferred).

Usage: python scripts/phase9_slice5_i18n.py
"""
import io
import json

LOCALES = ["en", "ar", "de", "es", "fa", "fr", "hi", "id", "pt", "ru", "tr", "zh"]

# earnings.* keys dissolved by the Slice 5 reframe (orphaned after the
# component changes; usage verified before removal).
REMOVE_EARNINGS = [
    "timelineAccruing",
    "timelineAccruingSub",
    "timelineCaption",
]

# earnings.* keys whose VALUE changes (same key, new copy).
UPDATE = {
    "totalEarned": {
        "en": "Received in total",
        "ar": "إجمالي المستلم",
        "de": "Insgesamt erhalten",
        "es": "Total recibido",
        "fa": "کل دریافتی",
        "fr": "Total reçu",
        "hi": "कुल प्राप्त",
        "id": "Total diterima",
        "pt": "Total recebido",
        "ru": "Получено всего",
        "tr": "Toplam alınan",
        "zh": "累计收到",
    },
    "nextPayoutIn": {
        "en": "Next distribution",
        "ar": "التوزيع القادم",
        "de": "Nächste Ausschüttung",
        "es": "Próximo reparto",
        "fa": "توزیع بعدی",
        "fr": "Prochaine distribution",
        "hi": "अगला वितरण",
        "id": "Distribusi berikutnya",
        "pt": "Próxima distribuição",
        "ru": "Следующая выплата",
        "tr": "Sonraki dağıtım",
        "zh": "下次分红",
    },
    "chartCaption": {
        "en": "Distribution schedule is being aligned with the monthly income model.",
        "ar": "يتم حاليًا مواءمة جدول التوزيع مع نموذج الدخل الشهري.",
        "de": "Der Ausschüttungsrhythmus wird an das monatliche Einkommensmodell angeglichen.",
        "es": "El calendario de repartos se está alineando con el modelo de ingresos mensuales.",
        "fa": "برنامه توزیع با مدل درآمد ماهانه هماهنگ می‌شود.",
        "fr": "Le calendrier de distribution est en cours d'alignement sur le modèle de revenus mensuels.",
        "hi": "वितरण अनुसूची को मासिक आय मॉडल के साथ संरेखित किया जा रहा है।",
        "id": "Jadwal distribusi sedang diselaraskan dengan model pendapatan bulanan.",
        "pt": "O cronograma de distribuição está sendo alinhado ao modelo de renda mensal.",
        "ru": "График выплат приводится в соответствие с моделью ежемесячного дохода.",
        "tr": "Dağıtım takvimi aylık gelir modeliyle uyumlu hale getiriliyor.",
        "zh": "分红时间表正在与月度收入模型对齐。",
    },
    "timelineNext": {
        "en": "Expected",
        "ar": "متوقع",
        "de": "Erwartet",
        "es": "Esperado",
        "fa": "پیش‌بینی‌شده",
        "fr": "Attendu",
        "hi": "अपेक्षित",
        "id": "Diharapkan",
        "pt": "Esperado",
        "ru": "Ожидается",
        "tr": "Beklenen",
        "zh": "预期",
    },
    "yieldTitle": {
        "en": "Accrued income",
        "ar": "الدخل المستحق",
        "de": "Aufgelaufene Einkünfte",
        "es": "Ingresos acumulados",
        "fa": "درآمد تعلق‌گرفته",
        "fr": "Revenus cumulés",
        "hi": "उपार्जित आय",
        "id": "Pendapatan terakrual",
        "pt": "Renda acumulada",
        "ru": "Начисленный доход",
        "tr": "Tahakkuk eden gelir",
        "zh": "已累计收入",
    },
    "emptyMessage": {
        "en": "Buy your first share and start earning.",
        "ar": "اشترِ حصتك الأولى وابدأ بالربح.",
        "de": "Kaufen Sie Ihren ersten Anteil und starten Sie das Einkommen.",
        "es": "Compra tu primera acción y empieza a ganar.",
        "fa": "اولین سهم خود را بخرید و شروع به کسب درآمد کنید.",
        "fr": "Achetez votre première part et commencez à gagner.",
        "hi": "अपना पहला शेयर खरीदें और कमाना शुरू करें।",
        "id": "Beli saham pertama Anda dan mulailah memperoleh pendapatan.",
        "pt": "Compre sua primeira parte e comece a ganhar.",
        "ru": "Купите свою первую долю и начните получать доход.",
        "tr": "İlk hissenizi satın alın ve kazanmaya başlayın.",
        "zh": "购买您的第一份股份并开始赚取收益。",
    },
    "yieldMonthly": {
        "en": "Projected monthly",
        "ar": "الشهري المتوقع",
        "de": "Projiziert monatlich",
        "es": "Mensual proyectado",
        "fa": "ماهانه پیش‌بینی‌شده",
        "fr": "Mensuel prévisionnel",
        "hi": "अनुमानित मासिक",
        "id": "Perkiraan bulanan",
        "pt": "Mensal projetado",
        "ru": "Прогноз на месяц",
        "tr": "Öngörülen aylık",
        "zh": "预计月收入",
    },
}

# earnings.* keys added by the Slice 5 reframe.
NEW = {
    "title": {
        "en": "Income",
        "ar": "الدخل",
        "de": "Einkünfte",
        "es": "Ingresos",
        "fa": "درآمد",
        "fr": "Revenus",
        "hi": "आय",
        "id": "Pendapatan",
        "pt": "Rendimentos",
        "ru": "Доход",
        "tr": "Gelir",
        "zh": "收入",
    },
    "subtitle": {
        "en": "Your share of the rental income from every estate you own.",
        "ar": "حصتك من دخل الإيجار من كل عقار تملكه.",
        "de": "Ihr Anteil an den Mieteinnahmen jedes Objekts, das Sie besitzen.",
        "es": "Tu parte de los ingresos por alquiler de cada propiedad que posees.",
        "fa": "سهم شما از درآمد اجاره‌ی هر املاکی که دارید.",
        "fr": "Votre part des revenus locatifs de chaque bien que vous possédez.",
        "hi": "आपके स्वामित्व वाली हर संपत्ति से किराया आय का आपका हिस्सा।",
        "id": "Bagian Anda dari pendapatan sewa setiap properti yang Anda miliki.",
        "pt": "Sua parte da renda de aluguel de cada propriedade que você possui.",
        "ru": "Ваша доля арендного дохода от каждого объекта, которым вы владеете.",
        "tr": "Sahip olduğunuz her emlağın kira gelirinden size düşen pay.",
        "zh": "您拥有的每处房产的租金收入分成。",
    },
    "expected": {
        "en": "Expected",
        "ar": "متوقع",
        "de": "Erwartet",
        "es": "Esperado",
        "fa": "پیش‌بینی‌شده",
        "fr": "Attendu",
        "hi": "अपेक्षित",
        "id": "Diharapkan",
        "pt": "Esperado",
        "ru": "Ожидается",
        "tr": "Beklenen",
        "zh": "预期",
    },
    "timelineAccrued": {
        "en": "Accrued",
        "ar": "مستحق",
        "de": "Aufgelaufen",
        "es": "Acumulado",
        "fa": "تعلق‌گرفته",
        "fr": "Cumulé",
        "hi": "उपार्जित",
        "id": "Terakrual",
        "pt": "Acumulado",
        "ru": "Начислено",
        "tr": "Tahakkuk eden",
        "zh": "已累计",
    },
    "timelineAccruedSub": {
        "en": "paid with next distribution",
        "ar": "يُدفع مع التوزيع القادم",
        "de": "wird mit der nächsten Ausschüttung gezahlt",
        "es": "se paga con el próximo reparto",
        "fa": "با توزیع بعدی پرداخت می‌شود",
        "fr": "payé avec la prochaine distribution",
        "hi": "अगले वितरण के साथ भुगतान किया गया",
        "id": "dibayar dengan distribusi berikutnya",
        "pt": "pago com a próxima distribuição",
        "ru": "выплачивается со следующей выплатой",
        "tr": "bir sonraki dağıtımla ödenir",
        "zh": "随下次分红支付",
    },
    "yieldAccruedSub": {
        "en": "Accrued, paid with next distribution",
        "ar": "مستحق، يُدفع مع التوزيع القادم",
        "de": "Aufgelaufen, wird mit der nächsten Ausschüttung gezahlt",
        "es": "Acumulado, se paga con el próximo reparto",
        "fa": "تعلق‌گرفته، با توزیع بعدی پرداخت می‌شود",
        "fr": "Cumulé, payé avec la prochaine distribution",
        "hi": "उपार्जित, अगले वितरण के साथ भुगतान किया गया",
        "id": "Terakrual, dibayar dengan distribusi berikutnya",
        "pt": "Acumulado, pago com a próxima distribuição",
        "ru": "Начислено, выплачивается со следующей выплатой",
        "tr": "Tahakkuk etti, bir sonraki dağıtımla ödenir",
        "zh": "已累计，随下次分红支付",
    },
    "chartLegendPaid": {
        "en": "Paid",
        "ar": "مدفوع",
        "de": "Bezahlt",
        "es": "Pagado",
        "fa": "پرداخت‌شده",
        "fr": "Payé",
        "hi": "भुगतान किया गया",
        "id": "Dibayar",
        "pt": "Pago",
        "ru": "Выплачено",
        "tr": "Ödendi",
        "zh": "已支付",
    },
    "chartLegendProjected": {
        "en": "Projected",
        "ar": "متوقع",
        "de": "Projiziert",
        "es": "Proyectado",
        "fa": "پیش‌بینی‌شده",
        "fr": "Prévisionnel",
        "hi": "अनुमानित",
        "id": "Perkiraan",
        "pt": "Projetado",
        "ru": "Прогноз",
        "tr": "Öngörülen",
        "zh": "预计",
    },
    "byEstateTitle": {
        "en": "Income by estate",
        "ar": "الدخل حسب العقار",
        "de": "Einkünfte nach Objekt",
        "es": "Ingresos por propiedad",
        "fa": "درآمد به تفکیک املاک",
        "fr": "Revenus par bien",
        "hi": "संपत्ति के अनुसार आय",
        "id": "Pendapatan per properti",
        "pt": "Renda por propriedade",
        "ru": "Доход по объектам",
        "tr": "Emlak bazlı gelir",
        "zh": "按房产分列的收入",
    },
    "byEstateReceived": {
        "en": "Received",
        "ar": "المستلم",
        "de": "Erhalten",
        "es": "Recibido",
        "fa": "دریافت‌شده",
        "fr": "Reçu",
        "hi": "प्राप्त",
        "id": "Diterima",
        "pt": "Recebido",
        "ru": "Получено",
        "tr": "Alınan",
        "zh": "已收到",
    },
}


def load(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def dump(path, data):
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    for locale in LOCALES:
        path = f"messages/{locale}.json"
        data = load(path)

        earnings = data.get("earnings", {})

        # Remove keys orphaned by the reframe.
        for key in REMOVE_EARNINGS:
            if key in earnings:
                del earnings[key]

        # Fresh values for changed keys.
        for key, values in UPDATE.items():
            if key in earnings:
                earnings[key] = values[locale]
            else:
                print(f"WARN {locale}: UPDATE key earnings.{key} missing; adding")

        # New keys.
        for key, values in NEW.items():
            earnings[key] = values[locale]

        dump(path, data)
        print(f"updated {path}")


if __name__ == "__main__":
    main()
