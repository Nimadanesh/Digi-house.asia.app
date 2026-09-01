#!/usr/bin/env python3
"""Add Phase 9 Slice 4 (Estates /marketplace) estates.* keys in all 12 locale files.

Mirrors the phase9_slice2/slice3_i18n.py convention. The marketplace surface is
reframed to the "Estates" product language (Phase 9 redesign §6 / UI Mapping §4):

* adds an estates.* namespace: header, search, filters (All/Featured/New/Income/
  Owner Stay/Resale), sort (Curated/Rental income/Entry price/Newest), empty &
  no-data states, estate-card labels.
* reuses existing 12-locale translations where the string is identical
  (chips.featured <- home.featuredTag, chips.new <- common.new, chips.income <-
  property.tabIncome, chips.owner_stay <- property.ownerStayTitle, chips.resale
  <- property.resaleWord, shareFraction <- property.heroShareFraction,
  fundedCaption <- property.fundedCaption, projectedIncome <-
  home.projectedIncomePerShare, incomePending <- home.dataPending, etc.).
* removes marketplace.* keys dissolved by the reframe (fees* keys stay — still
  used by FeeInfoButton / FeeScheduleSheet).

Usage: python scripts/phase9_slice4_i18n.py
"""
import io
import json

LOCALES = ["en", "ar", "de", "es", "fa", "fr", "hi", "id", "pt", "ru", "tr", "zh"]

# marketplace.* keys dissolved by the Estates reframe (usage confined to the
# marketplace page/card, verified before removal). fees* keys are preserved.
REMOVE_MARKETPLACE = [
    "searchPlaceholder",
    "searchAria",
    "clearSearch",
    "filtersAria",
    "loadError",
    "emptyTitle",
    "emptyMessage",
    "noMatchesTitle",
    "noMatchesMessage",
    "pricePerShare",
    "monthlyPerShare",
    "nightFrom",
    "sharesSold",
    "lastPrice",
    "chips",
]

# estates.* keys copied verbatim from an existing key in the SAME locale file.
# key -> (namespace, source key)
COPY = {
    "clearSearch": ("marketplace", "clearSearch"),
    "chips.all": ("marketplace", "chips.all"),
    "chips.featured": ("home", "featuredTag"),
    "chips.new": ("common", "new"),
    "chips.income": ("property", "tabIncome"),
    "chips.owner_stay": ("property", "ownerStayTitle"),
    "chips.resale": ("property", "resaleWord"),

    "noMatchesTitle": ("marketplace", "noMatchesTitle"),
    "noMatchesMessage": ("marketplace", "noMatchesMessage"),
    "ownerStayEmptyTitle": ("property", "ownerStayTitle"),
    "featuredEmptyTitle": ("home", "featuredTag"),
    "pricePerShare": ("marketplace", "pricePerShare"),
    "lastPrice": ("marketplace", "lastPrice"),
    "projectedIncome": ("home", "projectedIncomePerShare"),
    "incomePending": ("home", "dataPending"),
    "shareFraction": ("property", "heroShareFraction"),
    "fundedCaption": ("property", "fundedCaption"),
}

# estates.* keys with fresh translations (no existing identical string).
NEW = {
    "title": {
        "en": "Estates", "ar": "العقارات", "de": "Immobilien", "es": "Propiedades",
        "fa": "املاک", "fr": "Biens", "hi": "संपत्तियाँ", "id": "Properti",
        "pt": "Propriedades", "ru": "Объекты", "tr": "Emlaklar", "zh": "房产",
    },
    "subtitle": {
        "en": "Own a share of exceptional properties.",
        "ar": "امتلك حصة من عقارات استثنائية.",
        "de": "Besitzen Sie einen Anteil an außergewöhnlichen Immobilien.",
        "es": "Posee una acción de propiedades excepcionales.",
        "fa": "سهمی از املاک استثنایی داشته باشید.",
        "fr": "Possédez une part de biens exceptionnels.",
        "hi": "असाधारण संपत्तियों का शेयर पाएँ।",
        "id": "Milikilah saham properti istimewa.",
        "pt": "Possua uma parte de propriedades excepcionais.",
        "ru": "Владейте долей выдающихся объектов.",
        "tr": "Olağanüstü emlakların hissesine sahip olun.",
        "zh": "拥有一处优质房产的股份。",
    },
    "searchPlaceholder": {
        "en": "Search villas, destinations or regions.",
        "ar": "ابحث عن الفلل أو الوجهات أو المناطق",
        "de": "Suchen Sie nach Villen, Reisezielen oder Regionen",
        "es": "Busca villas, destinos o regiones",
        "fa": "جستجوی ویلا، مقصد یا منطقه",
        "fr": "Recherchez villas, destinations ou régions",
        "hi": "विला, गंतव्य या क्षेत्र खोजें",
        "id": "Cari vila, destinasi, atau wilayah",
        "pt": "Busque villas, destinos ou regiões",
        "ru": "Поиск вилл, направлений или регионов",
        "tr": "Villa, destinasyon veya bölge ara",
        "zh": "搜索别墅、目的地或地区",
    },
    "searchAria": {
        "en": "Search villas, destinations or regions.",
        "ar": "ابحث عن الفلل أو الوجهات أو المناطق",
        "de": "Suchen Sie nach Villen, Reisezielen oder Regionen",
        "es": "Busca villas, destinos o regiones",
        "fa": "جستجوی ویلا، مقصد یا منطقه",
        "fr": "Recherchez villas, destinations ou régions",
        "hi": "विला, गंतव्य या क्षेत्र खोजें",
        "id": "Cari vila, destinasi, atau wilayah",
        "pt": "Busque villas, destinos ou regiões",
        "ru": "Поиск вилл, направлений или регионов",
        "tr": "Villa, destinasyon veya bölge ara",
        "zh": "搜索别墅、目的地或地区",
    },
    "filtersAria": {
        "en": "Estate filters", "ar": "فلاتر العقارات", "de": "Immobilienfilter",
        "es": "Filtros de propiedades", "fa": "فیلترهای املاک", "fr": "Filtres de biens",
        "hi": "संपत्ति फ़िल्टर", "id": "Filter properti", "pt": "Filtros de propriedades",
        "ru": "Фильтры объектов", "tr": "Emlak filtreleri", "zh": "房产筛选",
    },
    "sortAria": {
        "en": "Sort estates", "ar": "ترتيب العقارات", "de": "Immobilien sortieren",
        "es": "Ordenar propiedades", "fa": "مرتب‌سازی املاک", "fr": "Trier les biens",
        "hi": "संपत्तियाँ क्रमबद्ध करें", "id": "Urutkan properti",
        "pt": "Ordenar propriedades", "ru": "Сортировать объекты",
        "tr": "Emlakları sırala", "zh": "排序房产",
    },
    "sortLabel": {
        "en": "Sort", "ar": "ترتيب", "de": "Sortieren", "es": "Ordenar",
        "fa": "مرتب‌سازی", "fr": "Trier", "hi": "क्रम", "id": "Urutkan",
        "pt": "Ordenar", "ru": "Сортировка", "tr": "Sırala", "zh": "排序",
    },
    "sort.curated": {
        "en": "Curated", "ar": "منسَّق", "de": "Kuratierte Auswahl",
        "es": "Selección", "fa": "انتخاب‌شده", "fr": "Sélection éditoriale",
        "hi": "चुनिंदा", "id": "Kurasi", "pt": "Seleção",
        "ru": "Подборка", "tr": "Editör seçkisi", "zh": "精选推荐",
    },
    "sort.income": {
        "en": "Rental income", "ar": "دخل الإيجار", "de": "Mieteinnahmen",
        "es": "Ingresos por alquiler", "fa": "درآمد اجاره", "fr": "Revenus locatifs",
        "hi": "किराया आय", "id": "Pendapatan sewa", "pt": "Renda de aluguel",
        "ru": "Арендный доход", "tr": "Kira geliri", "zh": "租金收入",
    },
    "sort.price": {
        "en": "Entry price", "ar": "سعر الدخول", "de": "Einstiegspreis",
        "es": "Precio de entrada", "fa": "قیمت ورود", "fr": "Prix d'entrée",
        "hi": "प्रवेश मूल्य", "id": "Harga masuk", "pt": "Preço de entrada",
        "ru": "Цена входа", "tr": "Giriş fiyatı", "zh": "入门价格",
    },
    "sort.newest": {
        "en": "Newest", "ar": "الأحدث", "de": "Neueste", "es": "Más recientes",
        "fa": "جدیدترین", "fr": "Plus récents", "hi": "नवीनतम", "id": "Terbaru",
        "pt": "Mais recentes", "ru": "Самые новые", "tr": "En yeni", "zh": "最新",
    },
    "loadError": {
        "en": "Couldn't load estates.",
        "ar": "تعذر تحميل العقارات.",
        "de": "Immobilien konnten nicht geladen werden.",
        "es": "No se pudieron cargar las propiedades.",
        "fa": "امکان بارگذاری املاک وجود ندارد.",
        "fr": "Impossible de charger les biens.",
        "hi": "संपत्तियाँ लोड नहीं हो सकीं।",
        "id": "Properti tidak dapat dimuat.",
        "pt": "Não foi possível carregar as propriedades.",
        "ru": "Не удалось загрузить объекты.",
        "tr": "Emlaklar yüklenemedi.",
        "zh": "无法加载房产。",
    },
    "emptyTitle": {
        "en": "No estates yet", "ar": "لا توجد عقارات بعد", "de": "Noch keine Immobilien",
        "es": "Aún no hay propiedades", "fa": "هنوز املاکی نیست", "fr": "Aucun bien pour l'instant",
        "hi": "अभी कोई संपत्ति नहीं", "id": "Belum ada properti",
        "pt": "Ainda não há propriedades", "ru": "Пока нет объектов",
        "tr": "Henüz emlak yok", "zh": "暂无房产",
    },
    "emptyMessage": {
        "en": "New estates are added every week — check back soon.",
        "ar": "تُضاف عقارات جديدة كل أسبوع — عد قريبًا.",
        "de": "Jede Woche kommen neue Immobilien hinzu — schauen Sie bald wieder vorbei.",
        "es": "Cada semana se añaden nuevas propiedades — vuelve pronto.",
        "fa": "هر هفته املاک جدید اضافه می‌شود — به‌زودی دوباره سر بزنید.",
        "fr": "De nouveaux biens sont ajoutés chaque semaine — revenez bientôt.",
        "hi": "हर हफ़्ते नई संपत्तियाँ जोड़ी जाती हैं — जल्द वापस आएँ।",
        "id": "Properti baru ditambahkan setiap minggu — kunjungi lagi nanti.",
        "pt": "Novas propriedades são adicionadas toda semana — volte em breve.",
        "ru": "Новые объекты добавляются каждую неделю — загляните позже.",
        "tr": "Her hafta yeni emlaklar ekleniyor — yakında tekrar bakın.",
        "zh": "每周都有新的房产上架 — 敬请期待。",
    },
    "ownerStayEmptyMessage": {
        "en": "Owner Stay data is not available yet.",
        "ar": "بيانات إقامة المالك غير متاحة بعد.",
        "de": "Daten zum Eigentümer-Aufenthalt sind noch nicht verfügbar.",
        "es": "Los datos de estancia del propietario aún no están disponibles.",
        "fa": "داده‌های اقامت مالک هنوز در دسترس نیست.",
        "fr": "Les données de séjour du propriétaire ne sont pas encore disponibles.",
        "hi": "मालिक प्रवास डेटा अभी उपलब्ध नहीं है।",
        "id": "Data menginap pemilik belum tersedia.",
        "pt": "Os dados de estadia do proprietário ainda não estão disponíveis.",
        "ru": "Данные о проживании владельца пока недоступны.",
        "tr": "Sahip konaklama verisi henüz mevcut değil.",
        "zh": "业主入住数据暂不可用。",
    },
    "featuredEmptyMessage": {
        "en": "Featured curation is not available yet.",
        "ar": "الاختيار المميز غير متاح بعد.",
        "de": "Die kuratierte Auswahl ist noch nicht verfügbar.",
        "es": "La selección destacada aún no está disponible.",
        "fa": "انتخاب ویژه هنوز در دسترس نیست.",
        "fr": "La sélection à la une n'est pas encore disponible.",
        "hi": "विशेष चयन अभी उपलब्ध नहीं है।",
        "id": "Kurasi unggulan belum tersedia.",
        "pt": "A seleção em destaque ainda não está disponível.",
        "ru": "Подборка ещё недоступна.",
        "tr": "Öne çıkan seçki henüz mevcut değil.",
        "zh": "精选推荐暂不可用。",
    },
}


def load(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def dump(path, data):
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def get_path(data, path_parts):
    cur = data
    for part in path_parts:
        for piece in part.split("."):
            if not isinstance(cur, dict) or piece not in cur:
                return None
            cur = cur[piece]
    return cur


def main():
    for locale in LOCALES:
        path = f"messages/{locale}.json"
        data = load(path)

        # Copy existing identical strings FIRST — some sources live in the
        # marketplace.* keys we are about to remove (pre-removal resolution).
        # Fall back to English when a source key is missing in a locale.
        copies = {}
        for key, (ns, source) in COPY.items():
            src = get_path(data, (ns, source))
            if src is None:
                print(f"WARN {locale}: missing copy source {ns}.{source}; using EN")
                src = _EN_COPY[key]
            copies[key] = src

        # Remove the marketplace.* keys dissolved by the Estates reframe.
        marketplace = data.get("marketplace", {})
        for key in REMOVE_MARKETPLACE:
            if key in marketplace:
                del marketplace[key]

        estates = data.setdefault("estates", {})

        # Fresh translations + pre-resolved copies.
        for key, values in NEW.items():
            set_path(estates, key, values[locale])
        for key, value in copies.items():
            set_path(estates, key, value)

        dump(path, data)
        print(f"updated {path}")


# English fallbacks for COPY keys (identical strings across locales source).
_EN_COPY = {
    "clearSearch": "Clear search",
    "chips.all": "All",
    "chips.featured": "Featured",
    "chips.new": "New",
    "chips.income": "Income",
    "chips.owner_stay": "Owner Stay",
    "chips.resale": "Resale",

    "noMatchesTitle": "No matches",
    "noMatchesMessage": "Try another search or filter chip.",
    "ownerStayEmptyTitle": "Owner Stay",
    "featuredEmptyTitle": "Featured",
    "pricePerShare": "Price / share",
    "lastPrice": "Last price",
    "projectedIncome": "Projected income / share",
    "incomePending": "Data pending",
    "shareFraction": "1 share ≈ 1/{total} of the estate",
    "fundedCaption": "{pct}% funded · {remaining} shares remaining",
}


def set_path(data, dotted, value):
    parts = dotted.split(".")
    cur = data
    for part in parts[:-1]:
        cur = cur.setdefault(part, {})
    cur[parts[-1]] = value


if __name__ == "__main__":
    main()