#!/usr/bin/env python3
"""Add Phase 6 holder analytics i18n keys to all 12 locale files."""
import json, collections, io

LOCALES = ["en","ar","de","es","fa","fr","hi","id","pt","ru","tr","zh"]

def k(en, ar, de, es, fa, fr, hi, id_, pt, ru, tr, zh):
    return {"en": en, "ar": ar, "de": de, "es": es, "fa": fa, "fr": fr,
            "hi": hi, "id": id_, "pt": pt, "ru": ru, "tr": tr, "zh": zh}

KEYS = collections.OrderedDict([
    ("holderDonutTitle", k("Token holder distribution", "توزيع حاملي العملات",
        "Verteilung der Anteilseigner", "Distribución de los accionistas",
        "توزیع دارندگان سهام", "Répartition des actionnaires",
        "शेयरधारकों का वितरण", "Distribusi pemegang saham",
        "Distribuição dos acionistas", "Распределение держателей",
        "Hisse sahibi dağılımı", "持有人分布")),
    ("totalHolders", k("Total holders", "إجمالي الحائزين", "Anzahl Halter",
        "Total de accionistas", "کل دارندگان", "Total des détenteurs",
        "कुल धारक", "Total pemegang", "Total de detentores",
        "Всего держателей", "Toplam hisse sahibi", "持有人总数")),
    ("holder.others", k("Others", "آخرون", "Andere", "Otros", "سایران",
        "Autres", "अन्य", "Lainnya", "Outros", "Другие", "Diğerleri", "其他")),
    ("holderPrivacyNote", k(
        "Holders shown as anonymized categories — no personal data.",
        "يظهر الحائزون كفئات مجهولة — دون أي بيانات شخصية.",
        "Halter als anonymisierte Kategorien — keine persönlichen Daten.",
        "Accionistas como categorías anonimizadas — sin datos personales.",
        "دارندگان به‌صورت دسته‌های ناشناس — بدون داده شخصی.",
        "Détenteurs en catégories anonymisées — aucune donnée personnelle.",
        "धारक गुमनाम श्रेणियों के रूप में — कोई व्यक्तिगत डेटा नहीं।",
        "Pemegang ditampilkan sebagai kategori anonim — tanpa data pribadi.",
        "Detentores como categorias anonimizadas — sem dados pessoais.",
        "Держатели как анонимные категории — без личных данных.",
        "Hissedarlar anonim kategoriler olarak — kişisel veri yok.",
        "持有人以匿名类别显示——不含个人数据。")),
    ("holderStatsTitle", k("Holder statistics", "إحصاءات الحائزين",
        "Halterstatistik", "Estadísticas de accionistas", "آمار دارندگان",
        "Statistiques des détenteurs", "धारक सांख्यिकी", "Statistik pemegang",
        "Estatísticas dos detentores", "Статистика держателей",
        "Hisse sahibi istatistikleri", "持有人统计")),
    ("statTotalHolders", k("Total holders", "إجمالي الحائزين", "Anzahl Halter",
        "Total de accionistas", "کل دارندگان", "Total des détenteurs",
        "कुल धारक", "Total pemegang", "Total de detentores",
        "Всего держателей", "Toplam hisse sahibi", "持有人总数")),
    ("statAvgHolding", k("Average holding", "متوسط الحيازة",
        "Durchschnittliche Halftung", "Tenencia media", "میانگین دارایی",
        "Détention moyenne", "औसत धारण", "Rata-rata kepemilikan",
        "Posse média", "Среднее владение", "Ortalama elde tutma", "平均持有")),
    ("statMedianHolding", k("Median holding", "وسيط الحيازة",
        "Median-Halftung", "Tenencia mediana", "میانه دارایی",
        "Détention médiane", "मध्यिका धारण", "Kepemilikan median",
        "Posse mediana", "Медианное владение", "Medyan elde tutma", "持有中位数")),
    ("statTop5Ownership", k("Top 5 ownership", "أكبر 5 حصص", "Top-5-Anteil",
        "Los 5 mayores", "۵ دارنده برتر", "Top 5", "शीर्ष 5 स्वामित्व",
        "5 teratas", "Top 5", "Топ-5 доля", "İlk 5 hisse", "前5名占比")),
    ("statNewHolders30d", k("New holders 30D", "حائزون جدد 30 يومًا",
        "Neue Halter 30T", "Nuevos 30 días", "دارندگان جدید ۳۰ روز",
        "Nouveaux 30 j", "नए धारक 30द", "Pemegang baru 30h", "Novos 30D",
        "Новые за 30 дн.", "Yeni 30G", "30天新增")),
    ("statLargestHolder", k("Largest holder", "أكبر حائز", "Größter Halter",
        "Mayor accionista", "بزرگ‌ترین دارنده", "Plus grand détenteur",
        "सबसे बड़ा धारक", "Pemegang terbesar", "Maior detentor",
        "Крупнейший держатель", "En büyük hisse sahibi", "最大持有人")),
    ("holder.others", k("Others", "آخرون", "Andere", "Otros", "سایران",
        "Autres", "अन्य", "Lainnya", "Outros", "Другие", "Diğerleri", "其他")),
    ("holderPrivacyNote", k(
        "Holders shown as anonymized categories — no personal data.",
        "يظهر الحائزون كفئات مجهولة — دون أي بيانات شخصية.",
        "Halter als anonymisierte Kategorien — keine persönlichen Daten.",
        "Accionistas como categorías anonimizadas — sin datos personales.",
        "دارندگان به‌صورت دسته‌های ناشناس — بدون داده شخصی.",
        "Détenteurs en catégories anonymisées — aucune donnée personnelle.",
        "धारक गुमनाम श्रेणियों के रूप में — कोई व्यक्तिगत डेटा नहीं।",
        "Pemegang ditampilkan sebagai kategori anonim — tanpa data pribadi.",
        "Detentores como categorias anonimizadas — sem dados pessoais.",
        "Держатели как анонимные категории — без личных данных.",
        "Hissedarlar anonim kategoriler olarak — kişisel veri yok.",
        "持有人以匿名类别显示——不含个人数据。")),
    ("sharesWord", k("shares", "أسهم", "Anteile", "acciones", "سهام",
        "actions", "शेयर", "saham", "ações", "долей", "hisse", "股")),
    ("donutTapHint", k("Tap a segment for details",
        "اضغط على جزء لعرض التفاصيل", "Segment antippen für Details",
        "Toca un segmento para ver detalles", "برای جزئیات روی یک بخش بزنید",
        "Touchez un segment pour les détails",
        "विवरण के लिए किसी खंड को टैप करें", "Ketuk segmen untuk detail",
        "Toque num segmento para detalhes", "Нажмите на сегмент для деталей",
        "Ayrıntılar için bir dilime dokunun", "点按扇区查看详情")),
    ("topHoldersTitle", k("Top token holders", "أكبر حاملي العملات",
        "Größte Anteilseigner", "Mayores accionistas",
        "بزرگ‌ترین دارندگان سهام", "Principaux actionnaires",
        "शीर्ष शेयरधारक", "Pemegang saham teratas", "Principais acionistas",
        "Крупнейшие держатели", "En büyük hisse sahipleri", "主要持有人")),
    ("treemapTitle", k("Ownership treemap", "خريطة الملكية",
        "Eigentums-Treemap", "Mapa de propiedad", "نقشه مالکیت",
        "Carte de propriété", "स्वामित्व ट्रीमैप", "Peta kepemilikan",
        "Mapa de propriedade", "Карта владения", "Sahiplik ağacı", "所有权矩形图")),
    ("treemapTapHint", k("Tap a block for details",
        "اضغط على مربع لعرض التفاصيل", "Block antippen für Details",
        "Toca un bloque para ver detalles", "برای جزئیات روی یک مربع بزنید",
        "Touchez un bloc pour les détails",
        "विवरण के लिए किसी ब्लॉक को टैप करें", "Ketuk blok untuk detail",
        "Toque num bloco para detalhes", "Нажмите на блок для деталей",
        "Ayrıntılar için bir bloğa dokunun", "点按色块查看详情")),
    ("distributionOverTimeTitle", k("Token distribution over time",
        "توزيع العملات عبر الزمن", "Verteilung der Anteile im Zeitverlauf",
        "Distribución de acciones en el tiempo", "توزیع سهام در طول زمان",
        "Distribution des actions dans le temps", "समय के साथ शेयर वितरण",
        "Distribusi saham dari waktu ke waktu",
        "Distribuição das ações ao longo do tempo",
        "Распределение долей по времени", "Zaman içinde hisse dağılımı",
        "份额分布（随时间）")),
    ("distributionTapHint", k("Tap the chart for details at that date",
        "اضغط على المخطط لعرض تفاصيل ذلك التاريخ",
        "Diagramm antippen für Details zu diesem Datum",
        "Toca el gráfico para ver detalles de esa fecha",
        "برای جزئیات آن تاریخ روی نمودار بزنید",
        "Touchez le graphique pour les détails de cette date",
        "उस तारीख के विवरण के लिए चार्ट टैप करें",
        "Ketuk grafik untuk detail pada tanggal itu",
        "Toque no gráfico para detalhes dessa data",
        "Нажмите на график для деталей на эту дату",
        "O tarihin ayrıntıları için grafiğe dokunun", "点按图表查看该日期的详情")),
    ("bubbleChartTitle", k("Holder bubble chart", "مخطط فقاعات الحائزين",
        "Blasendiagramm der Halter", "Diagrama de burbujas",
        "نمودار حبابی دارندگان", "Diagramme à bulles", "बुलबुला चार्ट",
        "Diagram gelembung", "Diagrama de bolhas", "Пузырьковая диаграмма",
        "Kabarcık grafiği", "持有人气泡图")),
    ("bubbleTapHint", k("Tap a bubble for details",
        "اضغط على فقاعة لعرض التفاصيل", "Blase antippen für Details",
        "Toca una burbuja para ver detalles", "برای جزئیات روی یک حباب بزنید",
        "Touchez une bulle pour les détails",
        "विवरण के लिए किसी बुलबुले को टैप करें",
        "Ketuk gelembung untuk detail", "Toque numa bolha para detalhes",
        "Нажмите на пузырь для деталей",
        "Ayrıntılar için bir kabarcığa dokunun", "点按气泡查看详情")),
])

HOLDER_LABELS = collections.OrderedDict([
    ("holder.A", k("Holder A", "الحائز أ", "Halter A", "Accionista A",
        "دارنده الف", "Détenteur A", "धारक A", "Pemegang A", "Detentor A",
        "Держатель A", "Hissedar A", "持有人A")),
    ("holder.B", k("Holder B", "الحائز ب", "Halter B", "Accionista B",
        "دارنده ب", "Détenteur B", "धारक B", "Pemegang B", "Detentor B",
        "Держатель B", "Hissedar B", "持有人B")),
    ("holder.C", k("Holder C", "الحائز ج", "Halter C", "Accionista C",
        "دارنده ج", "Détenteur C", "धारक C", "Pemegang C", "Detentor C",
        "Держатель C", "Hissedar C", "持有人C")),
    ("holder.D", k("Holder D", "الحائز د", "Halter D", "Accionista D",
        "دارنده د", "Détenteur D", "धारक D", "Pemegang D", "Detentor D",
        "Держатель D", "Hissedar D", "持有人D")),
    ("holder.E", k("Holder E", "الحائز هـ", "Halter E", "Accionista E",
        "دارنده ه", "Détenteur E", "धारक E", "Pemegang E", "Detentor E",
        "Держатель E", "Hissedar E", "持有人E")),
    ("holder.F", k("Holder F", "الحائز و", "Halter F", "Accionista F",
        "دارنده و", "Détenteur F", "धारक F", "Pemegang F", "Detentor F",
        "Держатель F", "Hissedar F", "持有人F")),
])
KEYS.update(HOLDER_LABELS)

for loc in LOCALES:
    path = f"messages/{loc}.json"
    with io.open(path, "r", encoding="utf-8") as f:
        data = json.load(f, object_pairs_hook=collections.OrderedDict)
    prop = data.get("property")
    if prop is None:
        print(f"{loc}: no property namespace — SKIPPED")
        continue
    changed = 0
    for key, vals in KEYS.items():
        if key in prop:
            continue
        prop[key] = vals[loc]
        changed += 1
    with io.open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{loc}: +{changed} keys")
