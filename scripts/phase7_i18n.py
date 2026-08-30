#!/usr/bin/env python3
"""Add Phase 7 property.* income keys to all 12 locale files (mirrored, translated)."""
import json
import collections
import io

LOCALES = ["en", "ar", "de", "es", "fa", "fr", "hi", "id", "pt", "ru", "tr", "zh"]

KEYS = {
    "incomeHistoryTitle": {
        "en": "Income history",
        "ar": "سجل الدخل",
        "de": "Einkommensverlauf",
        "es": "Historial de ingresos",
        "fa": "تاریخچه درآمد",
        "fr": "Historique des revenus",
        "hi": "आय इतिहास",
        "id": "Riwayat pendapatan",
        "pt": "Histórico de renda",
        "ru": "История доходов",
        "tr": "Gelir geçmişi",
        "zh": "收入历史",
    },
    "cumulativeYieldPerShare": {
        "en": "Cumulative yield per share",
        "ar": "العائد التراكمي لكل سهم",
        "de": "Kumulativer Ertrag pro Anteil",
        "es": "Rendimiento acumulado por acción",
        "fa": "بازده تجمعی به ازای هر سهم",
        "fr": "Rendement cumulé par action",
        "hi": "प्रति शेयर संचयी उपज",
        "id": "Imbal hasil kumulatif per saham",
        "pt": "Rendimento acumulado por ação",
        "ru": "Накопленная доходность на акцию",
        "tr": "Hisse başına kümülatif getiri",
        "zh": "每股累计收益",
    },
    "incomeMonthsWord": {
        "en": "months of history",
        "ar": "أشهر من السجل",
        "de": "Monate Verlauf",
        "es": "meses de historial",
        "fa": "ماه سابقه",
        "fr": "mois d'historique",
        "hi": "महीनों का इतिहास",
        "id": "bulan riwayat",
        "pt": "meses de histórico",
        "ru": "месяцев истории",
        "tr": "ay geçmiş",
        "zh": "个月历史",
    },
    "perShareWord": {
        "en": "per share",
        "ar": "لكل سهم",
        "de": "pro Anteil",
        "es": "por acción",
        "fa": "به ازای هر سهم",
        "fr": "par action",
        "hi": "प्रति शेयर",
        "id": "per saham",
        "pt": "por ação",
        "ru": "на акцию",
        "tr": "hisse başına",
        "zh": "每股",
    },
    "poolWord": {
        "en": "pool",
        "ar": "المجموع",
        "de": "Pool",
        "es": "pool",
        "fa": "کل",
        "fr": "pool",
        "hi": "कुल",
        "id": "total",
        "pt": "total",
        "ru": "пул",
        "tr": "havuz",
        "zh": "总池",
    },
    "incomeTapHint": {
        "en": "Tap a bar for that month's payout detail.",
        "ar": "اضغط على عمود لعرض تفاصيل دفعة ذلك الشهر.",
        "de": "Tippe auf einen Balken für die Auszahlung dieses Monats.",
        "es": "Toca una barra para ver el pago de ese mes.",
        "fa": "برای دیدن جزئیات پرداخت آن ماه، روی یک ستون بزنید.",
        "fr": "Touchez une barre pour voir le versement du mois.",
        "hi": "उस महीने के भुगतान का विवरण देखने के लिए एक बार टैप करें।",
        "id": "Ketuk batang untuk melihat detail pembayaran bulan itu.",
        "pt": "Toque numa barra para ver o pagamento daquele mês.",
        "ru": "Нажмите на столбец, чтобы увидеть выплату за этот месяц.",
        "tr": "O ayın ödemesini görmek için bir sütuna dokunun.",
        "zh": "点击柱形查看该月的派息详情。",
    },
    "payoutHistoryTitle": {
        "en": "Payout history",
        "ar": "سجل المدفوعات",
        "de": "Auszahlungsverlauf",
        "es": "Historial de pagos",
        "fa": "تاریخچه پرداخت‌ها",
        "fr": "Historique des versements",
        "hi": "भुगतान इतिहास",
        "id": "Riwayat pembayaran",
        "pt": "Histórico de pagamentos",
        "ru": "История выплат",
        "tr": "Ödeme geçmişi",
        "zh": "派息记录",
    },
    "payoutHistoryNote": {
        "en": "Simulated income history · on-chain verifiable post-MVP.",
        "ar": "سجل دخل محاكاة · قابل للتحقق على السلسلة بعد MVP.",
        "de": "Simulierter Einkommensverlauf · nach MVP on-chain überprüfbar.",
        "es": "Historial de ingresos simulado · verificable on-chain tras el MVP.",
        "fa": "تاریخچه درآمد شبیه‌سازی‌شده · پس از MVP قابل تأیید روی زنجیره.",
        "fr": "Historique de revenus simulé · vérifiable on-chain après le MVP.",
        "hi": "सिम्युलेटेड आय इतिहास · MVP के बाद on-chain सत्यापन योग्य।",
        "id": "Riwayat pendapatan simulasi · dapat diverifikasi on-chain pasca-MVP.",
        "pt": "Histórico de renda simulado · verificável on-chain pós-MVP.",
        "ru": "Смоделированная история доходов · проверяемая on-chain после MVP.",
        "tr": "Simüle gelir geçmişi · MVP sonrası zincirde doğrulanabilir.",
        "zh": "模拟收入历史 · MVP 后可链上验证。",
    },
    "incomeRatiosTitle": {
        "en": "Real-estate metrics",
        "ar": "مؤشرات العقارات",
        "de": "Immobilien-Kennzahlen",
        "es": "Métricas inmobiliarias",
        "fa": "شاخص‌های املاک",
        "fr": "Indicateurs immobiliers",
        "hi": "रियल-एस्टेट मेट्रिक्स",
        "id": "Metrik real estat",
        "pt": "Métricas imobiliárias",
        "ru": "Показатели недвижимости",
        "tr": "Gayrimenkul metrikleri",
        "zh": "房地产指标",
    },
    "annualYieldRate": {
        "en": "Annual yield rate",
        "ar": "معدل العائد السنوي",
        "de": "Jährliche Rendite",
        "es": "Tasa de rendimiento anual",
        "fa": "نرخ بازده سالانه",
        "fr": "Taux de rendement annuel",
        "hi": "वार्षिक उपज दर",
        "id": "Tingkat imbal hasil tahunan",
        "pt": "Taxa de rendimento anual",
        "ru": "Годовая ставка доходности",
        "tr": "Yıllık getiri oranı",
        "zh": "年收益率",
    },
    "incomeRatiosNote": {
        "en": "Derived from the property's rent and value. Net yield, cap rate, NOI and expense ratio are not shown — the dataset does not carry those fields.",
        "ar": "مشتقة من إيجار العقار وقيمته. لا تُعرض العائد الصافي ومعدل الرسملة و NOI ونسبة المصروفات — مجموعة البيانات لا تحتوي على تلك الحقول.",
        "de": "Abgeleitet aus Miete und Wert der Immobilie. Nettorendite, Cap Rate, NOI und Expense Ratio werden nicht angezeigt — der Datensatz enthält diese Felder nicht.",
        "es": "Derivadas del alquiler y el valor de la propiedad. No se muestran rendimiento neto, cap rate, NOI ni ratio de gastos: el conjunto de datos no incluye esos campos.",
        "fa": "از اجاره و ارزش ملک محاسبه شده است. بازده خالص، نرخ سرمایه‌گذاری، NOI و نسبت هزینه نمایش داده نمی‌شوند — مجموعه داده آن فیلدها را ندارد.",
        "fr": "Dérivés du loyer et de la valeur du bien. Rendement net, taux de capitalisation, NOI et taux de charges non affichés — le jeu de données ne contient pas ces champs.",
        "hi": "संपत्ति के किराए और मूल्य से प्राप्त। नेट यील्ड, कैप रेट, NOI और एक्सपेंस रेशियो नहीं दिखाए जाते — डेटासेट में वे फ़ील्ड नहीं हैं।",
        "id": "Berasal dari sewa dan nilai properti. Imbal hasil bersih, cap rate, NOI, dan rasio biaya tidak ditampilkan — dataset tidak memuat bidang tersebut.",
        "pt": "Derivadas do aluguel e do valor do imóvel. Rendimento líquido, cap rate, NOI e taxa de despesas não exibidos — o conjunto de dados não contém esses campos.",
        "ru": "Получены из аренды и стоимости объекта. Чистая доходность, ставка капитализации, NOI и доля расходов не показаны — в наборе данных нет этих полей.",
        "tr": "Gayrimenkulün kirasından ve değerinden türetilmiştir. Net getiri, cap rate, NOI ve gider oranı gösterilmez — veri setinde bu alanlar yok.",
        "zh": "由物业租金与价值推导。未显示净收益率、资本化率、NOI 与费用率——数据集不含这些字段。",
    },
    "incomeProjectionsTitle": {
        "en": "Projected earnings",
        "ar": "الأرباح المتوقعة",
        "de": "Erwartete Erträge",
        "es": "Ganancias proyectadas",
        "fa": "درآمد پیش‌بینی‌شده",
        "fr": "Gains projetés",
        "hi": "अनुमानित आय",
        "id": "Proyeksi pendapatan",
        "pt": "Ganhos projetados",
        "ru": "Прогнозируемый доход",
        "tr": "Öngörülen kazanç",
        "zh": "预期收益",
    },
    "incomeProjectionsNote": {
        "en": "Use the income calculator on the Overview tab — it projects your earnings from your chosen share count, clearly labelled as projections, not promises.",
        "ar": "استخدم حاسبة الدخل في تبديل النظرة العامة — تحسب أرباحك من عدد الأسهم الذي تختاره، وهي توقعات لا وعود.",
        "de": "Nutze den Einkommensrechner im Übersicht-Tab — er projiziert deine Erträge aus der gewählten Anteilszahl, klar als Prognosen gekennzeichnet, nicht als Versprechen.",
        "es": "Usa la calculadora de ingresos en la pestaña Resumen: proyecta tus ganancias según el número de acciones que elijas, claramente etiquetadas como proyecciones, no promesas.",
        "fa": "از ماشین‌حساب درآمد در تب نمای کلی استفاده کنید — درآمد شما را بر اساس تعداد سهم انتخابی محاسبه می‌کند؛ این‌ها پیش‌بینی هستند نه وعده.",
        "fr": "Utilisez le calculateur de revenus dans l'onglet Aperçu — il projette vos gains selon le nombre d'actions choisi, clairement présentés comme des projections, pas des promesses.",
        "hi": "ओवरव्यू टैब पर आय कैलकुलेटर का उपयोग करें — यह आपके चुने गए शेयरों से आय का अनुमान देता है; ये अनुमान हैं, वादे नहीं।",
        "id": "Gunakan kalkulator pendapatan di tab Ringkasan — menghitung proyeksi penghasilan dari jumlah saham pilihan Anda, diberi label jelas sebagai proyeksi, bukan janji.",
        "pt": "Use a calculadora de renda na aba Resumo — projeta seus ganhos a partir do número de ações escolhido, claramente rotulados como projeções, não promessas.",
        "ru": "Используйте калькулятор дохода на вкладке «Обзор» — он рассчитает ваш доход по выбранному числу акций; это прогнозы, а не обещания.",
        "tr": "Genel bakış sekmesindeki gelir hesaplayıcıyı kullanın — seçtiğiniz hisse sayısına göre kazancınızı öngörür; bunlar vaat değil, öngörülerdir.",
        "zh": "使用概览页的收益计算器——根据您选择的股数计算预期收益；这些是预测，不是承诺。",
    },
}


def main():
    for loc in LOCALES:
        path = f"messages/{loc}.json"
        with io.open(path, "r", encoding="utf-8") as f:
            data = json.load(f, object_pairs_hook=collections.OrderedDict)
        prop = data.setdefault("property", collections.OrderedDict())
        added = 0
        for key, per_locale in KEYS.items():
            if key in prop:
                continue
            prop[key] = per_locale[loc]
            added += 1
        with io.open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"{loc}: +{added} keys")


if __name__ == "__main__":
    main()
