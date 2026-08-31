#!/usr/bin/env python3
"""Add/update Phase 9 Slice 3 (Home) home.* keys in all 12 locale files.

Mirrors the phase9_slice2_i18n.py convention: a single KEYS dict with all 12
translations, applied to every locale file. Removes home keys dissolved by the
ownership-first Home refactor. Keys still used by other surfaces
(home.monthlyPerShare for PropertyCard, home.featuredTag, home.pendingThisWeek)
are left untouched.

Usage: python scripts/phase9_slice3_i18n.py
"""
import json
import io

LOCALES = ["en", "ar", "de", "es", "fa", "fr", "hi", "id", "pt", "ru", "tr", "zh"]

# Keys dissolved by the ownership-first Home redesign (Home-only usage confirmed).
REMOVE_HOME = [
    "featuredOpportunity",  # → featuredEstate
    "moreOpportunities",    # → moreEstates
    "nextPayout",           # → nextDistribution
    "portfolioValue",       # → yourEstates
    "myProperties",         # → myEstates
    "myPropertiesCount",    # → myEstatesCount
    "viewAllCount",         # → moreEstatesCount
    "emptyStepBuy",         # 3-step Buy/Lock/Earn removed
    "emptyStepLock",
    "emptyStepEarn",
]

# key -> {locale: value} — new home keys plus value updates on existing keys.
KEYS = {
    "yourEstates": {
        "en": "Your Estates", "ar": "عقاراتك", "de": "Ihre Immobilien",
        "es": "Tus propiedades", "fa": "املاک شما", "fr": "Vos biens",
        "hi": "आपकी संपत्तियाँ", "id": "Properti Anda", "pt": "Suas propriedades",
        "ru": "Ваши объекты", "tr": "Emlaklarınız", "zh": "您的房产",
    },
    "estatesCount": {
        "en": "{count} estates", "ar": "{count} عقارات", "de": "{count} Immobilien",
        "es": "{count} propiedades", "fa": "{count} ملک", "fr": "{count} biens",
        "hi": "{count} संपत्तियाँ", "id": "{count} properti", "pt": "{count} propriedades",
        "ru": "{count} объектов", "tr": "{count} emlak", "zh": "{count} 处房产",
    },
    "rentalIncomeYtd": {
        "en": "rental income YTD",
        "ar": "دخل الإيجار منذ بداية العام",
        "de": "Mieteinnahmen seit Jahresbeginn",
        "es": "ingresos por alquiler en lo que va del año",
        "fa": "درآمد اجاره از ابتدای سال",
        "fr": "revenus locatifs depuis le début de l'année",
        "hi": "वर्ष की किराया आय",
        "id": "pendapatan sewa tahun berjalan",
        "pt": "receita de aluguel no ano",
        "ru": "арендный доход с начала года",
        "tr": "yıl başından beri kira geliri",
        "zh": "年初至今租金收入",
    },
    "viewMyEstates": {
        "en": "View My Estates", "ar": "عرض عقاراتي", "de": "Meine Immobilien ansehen",
        "es": "Ver mis propiedades", "fa": "مشاهده املاک من", "fr": "Voir mes biens",
        "hi": "मेरी संपत्तियाँ देखें", "id": "Lihat properti saya",
        "pt": "Ver minhas propriedades", "ru": "Смотреть мои объекты",
        "tr": "Emlaklarımı görüntüle", "zh": "查看我的房产",
    },
    "nextDistribution": {
        "en": "Next Distribution", "ar": "التوزيع القادم", "de": "Nächste Ausschüttung",
        "es": "Próxima distribución", "fa": "توزیع بعدی", "fr": "Prochaine distribution",
        "hi": "अगला वितरण", "id": "Distribusi berikutnya", "pt": "Próxima distribuição",
        "ru": "Следующая выплата", "tr": "Sonraki dağıtım", "zh": "下次分配",
    },
    "statusExpected": {
        "en": "Expected", "ar": "متوقع", "de": "Erwartet", "es": "Esperado",
        "fa": "پیش‌بینی‌شده", "fr": "Attendu", "hi": "अपेक्षित", "id": "Diharapkan",
        "pt": "Esperado", "ru": "Ожидается", "tr": "Beklenen", "zh": "预期",
    },
    "myEstatesCount": {
        "en": "My Estates ({count})", "ar": "عقاراتي ({count})",
        "de": "Meine Immobilien ({count})", "es": "Mis propiedades ({count})",
        "fa": "املاک من ({count})", "fr": "Mes biens ({count})",
        "hi": "मेरी संपत्तियाँ ({count})", "id": "Properti saya ({count})",
        "pt": "Minhas propriedades ({count})", "ru": "Мои объекты ({count})",
        "tr": "Emlaklarım ({count})", "zh": "我的房产（{count}）",
    },
    "allMyEstates": {
        "en": "All my estates", "ar": "كل عقاراتي", "de": "Alle meine Immobilien",
        "es": "Todas mis propiedades", "fa": "همه املاک من", "fr": "Tous mes biens",
        "hi": "मेरी सभी संपत्तियाँ", "id": "Semua properti saya",
        "pt": "Todas as minhas propriedades", "ru": "Все мои объекты",
        "tr": "Tüm emlaklarım", "zh": "我的所有房产",
    },
    "moreEstatesCount": {
        "en": "+{count} more in My Estates", "ar": "+{count} أخرى في عقاراتي",
        "de": "+{count} weitere in Meine Immobilien", "es": "+{count} más en Mis propiedades",
        "fa": "+{count} مورد دیگر در املاک من", "fr": "+{count} autres dans Mes biens",
        "hi": "मेरी संपत्तियों में +{count} और", "id": "+{count} lagi di Properti saya",
        "pt": "+{count} a mais em Minhas propriedades", "ru": "Ещё {count} в «Мои объекты»",
        "tr": "Emlaklarımda +{count} daha", "zh": "我的房产中还有 {count} 处",
    },
    "featuredEstate": {
        "en": "Featured Estate", "ar": "عقار مميز", "de": "Ausgewählte Immobilie",
        "es": "Propiedad destacada", "fa": "ملک ویژه", "fr": "Bien à la une",
        "hi": "विशेष संपत्ति", "id": "Properti unggulan", "pt": "Propriedade em destaque",
        "ru": "Рекомендуемый объект", "tr": "Öne çıkan emlak", "zh": "精选房产",
    },
    "projectedIncomePerShare": {
        "en": "Projected income / share",
        "ar": "الدخل المتوقع / السهم",
        "de": "Voraussichtliches Einkommen / Anteil",
        "es": "Ingreso proyectado / acción",
        "fa": "درآمد پیش‌بینی‌شده / سهم",
        "fr": "Revenu projeté / part",
        "hi": "अनुमानित आय / शेयर",
        "id": "Pendapatan proyeksi / saham",
        "pt": "Renda projetada / ação",
        "ru": "Прогнозируемый доход / доля",
        "tr": "Öngörülen gelir / hisse",
        "zh": "预计收入 / 股",
    },
    "ownerStay": {
        "en": "Owner stay", "ar": "إقامة المالك", "de": "Eigentümer-Aufenthalt",
        "es": "Estancia del propietario", "fa": "اقامت مالک", "fr": "Séjour du propriétaire",
        "hi": "मालिक का प्रवास", "id": "Menginap pemilik", "pt": "Estadia do proprietário",
        "ru": "Проживание владельца", "tr": "Sahip konaklaması", "zh": "业主入住",
    },
    "dataPending": {
        "en": "Data pending", "ar": "البيانات معلقة", "de": "Daten ausstehend",
        "es": "Datos pendientes", "fa": "داده در انتظار", "fr": "Données en attente",
        "hi": "डेटा लंबित", "id": "Data tertunda", "pt": "Dados pendentes",
        "ru": "Данные ожидаются", "tr": "Veri bekleniyor", "zh": "数据待定",
    },
    "viewEstate": {
        "en": "View Estate", "ar": "عرض العقار", "de": "Immobilie ansehen",
        "es": "Ver propiedad", "fa": "مشاهده ملک", "fr": "Voir le bien",
        "hi": "संपत्ति देखें", "id": "Lihat properti", "pt": "Ver propriedade",
        "ru": "Смотреть объект", "tr": "Emlağı görüntüle", "zh": "查看房产",
    },
    "moreEstates": {
        "en": "More Estates", "ar": "مزيد من العقارات", "de": "Weitere Immobilien",
        "es": "Más propiedades", "fa": "املاک بیشتر", "fr": "Plus de biens",
        "hi": "अधिक संपत्तियाँ", "id": "Properti lainnya", "pt": "Mais propriedades",
        "ru": "Другие объекты", "tr": "Diğer emlaklar", "zh": "更多房产",
    },
    "ownShareOfEstate": {
        "en": "{pct} of the estate", "ar": "{pct} من العقار", "de": "{pct} der Immobilie",
        "es": "{pct} de la propiedad", "fa": "{pct} از ملک", "fr": "{pct} du bien",
        "hi": "संपत्ति का {pct}", "id": "{pct} dari properti", "pt": "{pct} da propriedade",
        "ru": "{pct} объекта", "tr": "emlağın {pct}", "zh": "房产的 {pct}",
    },
    "currentValue": {
        "en": "Current value", "ar": "القيمة الحالية", "de": "Aktueller Wert",
        "es": "Valor actual", "fa": "ارزش فعلی", "fr": "Valeur actuelle",
        "hi": "वर्तमान मूल्य", "id": "Nilai saat ini", "pt": "Valor atual",
        "ru": "Текущая стоимость", "tr": "Güncel değer", "zh": "当前价值",
    },
    # Value updates on existing home keys (ownership-first empty state + trust copy).
    "emptyTitle": {
        "en": "You don't own any estates yet",
        "ar": "لا تمتلك أي عقارات بعد",
        "de": "Sie besitzen noch keine Immobilien",
        "es": "Aún no posees propiedades",
        "fa": "هنوز هیچ ملکی ندارید",
        "fr": "Vous ne possédez encore aucun bien",
        "hi": "आपके पास अभी कोई संपत्ति नहीं है",
        "id": "Anda belum memiliki properti apa pun",
        "pt": "Você ainda não possui propriedades",
        "ru": "У вас пока нет объектов",
        "tr": "Henüz hiç emlağınız yok",
        "zh": "您还没有房产",
    },
    "emptyHint": {
        "en": "Own a share of an exceptional property and participate in its rental income.",
        "ar": "امتلك حصة من عقار استثنائي وشارك في دخله من الإيجار.",
        "de": "Besitzen Sie einen Anteil an einer außergewöhnlichen Immobilie und partizipieren Sie an ihren Mieteinnahmen.",
        "es": "Posee una acción de una propiedad excepcional y participa en sus ingresos por alquiler.",
        "fa": "سهمی از یک ملک استثنایی بخرید و در درآمد اجاره آن شریک شوید.",
        "fr": "Possédez une part d'un bien exceptionnel et participez à ses revenus locatifs.",
        "hi": "एक असाधारण संपत्ति का शेयर पाएँ और उसकी किराया आय में हिस्सा लें।",
        "id": "Miliki saham properti istimewa dan ikut serta dalam pendapatan sewanya.",
        "pt": "Possua uma parte de uma propriedade excepcional e participe da renda de aluguel.",
        "ru": "Владейте долей выдающегося объекта и получайте долю арендного дохода.",
        "tr": "Olağanüstü bir emlağın hissesine sahip olun ve kira gelirine ortak olun.",
        "zh": "拥有一处优质房产的股份，参与其租金收入。",
    },
    "emptyCta": {
        "en": "Explore Estates", "ar": "استكشف العقارات", "de": "Immobilien entdecken",
        "es": "Explorar propiedades", "fa": "کاوش در املاک", "fr": "Explorer les biens",
        "hi": "संपत्तियाँ देखें", "id": "Jelajahi properti", "pt": "Explorar propriedades",
        "ru": "Смотреть объекты", "tr": "Emlakları keşfet", "zh": "探索房产",
    },
    "trustFooter": {
        "en": "Ownership shares are secured on TON. Rental income accrues monthly and reflects each estate's rental performance. Simulated figures are labeled as simulated until live.",
        "ar": "أسهم الملكية مؤمّنة على TON. يُستحق دخل الإيجار شهريًا ويعكس الأداء الإيجاري لكل عقار. تُصنَّف الأرقام المحاكاة كمحاكاة حتى تفعيلها فعليًا.",
        "de": "Eigentumsanteile sind auf TON gesichert. Mieteinnahmen fallen monatlich an und spiegeln die Mietperformance jeder Immobilie wider. Simulierte Zahlen sind bis zur Live-Schaltung als simuliert gekennzeichnet.",
        "es": "Las participaciones están aseguradas en TON. El ingreso por alquiler se devenga mensualmente y refleja el rendimiento de cada propiedad. Las cifras simuladas se etiquetan como simuladas hasta su activación.",
        "fa": "سهام مالکیت روی TON امن شده است. درآمد اجاره ماهانه محاسبه می‌شود و عملکرد اجاره هر ملک را نشان می‌دهد. اعداد شبیه‌سازی‌شده تا فعال‌سازی واقعی به‌عنوان شبیه‌سازی برچسب می‌خورند.",
        "fr": "Les parts de propriété sont sécurisées sur TON. Le revenu locatif s'accumule mensuellement et reflète la performance de chaque bien. Les chiffres simulés sont étiquetés comme simulés jusqu'à la mise en ligne.",
        "hi": "स्वामित्व शेयर TON पर सुरक्षित हैं। किराया आय मासिक रूप से अर्जित होती है और प्रत्येक संपत्ति के किराया प्रदर्शन को दर्शाती है। सिम्युलेटेड आंकड़े लाइव होने तक सिम्युलेटेड के रूप में चिह्नित रहते हैं।",
        "id": "Saham kepemilikan diamankan di TON. Pendapatan sewa diakrual bulanan dan mencerminkan kinerja sewa setiap properti. Angka simulasi diberi label simulasi hingga live.",
        "pt": "As participações são garantidas na TON. A renda de aluguel acumula mensalmente e reflete o desempenho de cada propriedade. Valores simulados são rotulados como simulados até entrarem no ar.",
        "ru": "Доли владения защищены сетью TON. Арендный доход начисляется ежемесячно и отражает показатели каждого объекта. Имитационные цифры помечаются как имитационные до запуска.",
        "tr": "Mülkiyet hisseleri TON üzerinde güvence altındadır. Kira geliri aylık tahakkuk eder ve her emlağın kira performansını yansıtır. Simüle rakamlar canlıya geçene kadar simüle olarak etiketlenir.",
        "zh": "所有权股份由 TON 保障。租金收入按月累积，反映每处房产的租赁表现。模拟数据在上线前均标注为模拟。",
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
        home = data.setdefault("home", {})
        for key in REMOVE_HOME:
            home.pop(key, None)
        for key, values in KEYS.items():
            home[key] = values[locale]
        dump(path, data)
        print(f"updated {path}")


if __name__ == "__main__":
    main()