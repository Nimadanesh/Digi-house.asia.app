// File responsibility: Fifi UI PROTOTYPE mock conversation engine (FIFI-05 UX
// Foundation). Purely local deterministic content — no network, no LLM, no Laya,
// no real provider. Prose is en/fa only, mirroring the en/fa Knowledge Base;
// UI chrome strings live in messages/*.json (12 locales). This module is a
// stand-in for the real orchestration (lib/fifi/*) in a later slice.
import type { FifiScreen } from "./page-context";

/** Prototype runtime availability of the assistant (demo-cyclable). */
export type FifiAvailability =
  | "available"
  | "degraded"
  | "rate_limited"
  | "unavailable"
  | "live_unavailable";

export type FifiMessageTone = "answer" | "notice" | "restricted" | "error";

export interface FifiReply {
  text: string;
  /** One worked example paragraph (onboarding pattern: answer → example). */
  example?: string;
  /** 2–3 natural follow-up questions replacing the suggested chips. */
  nextQuestions?: string[];
  /** Optional navigation action chip (canonical route, never a raw URL). */
  action?: { label: string; route: string };
  tone: FifiMessageTone;
  /** Onboarding progression step that was answered (component advances past it). */
  matchedOnboardingStep?: number;
}

export interface FifiReplyInput {
  question: string;
  screen: FifiScreen;
  /** Estate display title when on an estate page (fetched from the app's own mock repo). */
  estateTitle?: string | null;
  onboarded: boolean;
  /** Onboarding progression position 0–5 (component-owned). */
  onboardingStep: number;
  authenticated: boolean;
  availability: FifiAvailability;
  locale: string;
  /** True when this send is a retry after a simulated failure. */
  retryOf?: boolean;
}

// ---------------------------------------------------------------------------
// Normalization + matching
// ---------------------------------------------------------------------------

const fa = (locale: string): boolean => locale.toLowerCase().startsWith("fa");

function normalize(question: string): string {
  return question
    .toLowerCase()
    .replace(/[\u200c\u064a]/g, (c) => (c === "\u064a" ? "\u06cc" : ""))
    .replace(/\u0643/g, "\u06a9")
    .replace(/[?!.,;:،؛؟"'`()\-_/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const has = (n: string, words: readonly string[]): boolean =>
  words.some((w) => n.includes(w));

// ---------------------------------------------------------------------------
// Onboarding progression (answer → explanation → example → next questions)
// ---------------------------------------------------------------------------

interface OnboardingStep {
  match: readonly string[];
  /** The canonical question that opens this step (used by suggestions). */
  starter: { en: string; fa: string };
  answer: { en: string; fa: string };
  example: { en: string; fa: string };
  next: { en: readonly string[]; fa: readonly string[] };
  action?: { en: string; fa: string; route: string };
}

const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    match: [
      "what is", "what's this", "this app", "about the product", "tell me about",
      "fractionalluxe", "فرکشنال", "این اپ", "این برنامه", "چیه", "چیست", "درباره",
    ],
    starter: { en: "What is FractionalLuxe?", fa: "فرکشنال‌لوکس چیست؟" },
    answer: {
      en: "FractionalLuxe is a marketplace for fractional ownership of luxury villas. Instead of buying a whole property, you buy shares in an Estate from $80 — and this app is where you browse Estates, own your shares, and follow the income they generate.",
      fa: "فرکشنال‌لوکس بازار مالکیت جزئی ویلاهای لوکس است. به‌جای خرید یک ملک کامل، از ۸۰ دلار سهمِ یک Estate را می‌خرید — و این اپ جایی است که Estateها را می‌بینید، سهم‌هایتان را دارید و درآمدشان را دنبال می‌کنید.",
    },
    example: {
      en: "For example: a Dubai villa offered as an Estate is divided into many shares — holding a slice of them means owning that same slice of the villa itself.",
      fa: "برای مثال: ویلایی در دبی که به‌صورت Estate عرضه شده به سهم‌های ریز تقسیم می‌شود — نگه‌داشتن بخشی از آن سهم‌ها یعنی مالکیت همان بخش از خود ویلا.",
    },
    next: {
      en: ["What do I actually own?", "How does it generate income?", "What can change and isn't guaranteed?"],
      fa: ["دقیقاً چه چیزی مال من می‌شود؟", "چطور درآمد تولید می‌کند؟", "چه چیزی ممکن است تغییر کند و تضمینی نیست؟"],
    },
  },
  {
    match: ["what do i own", "what do i get", "own", "holdings", "share mean", "مالک", "چه چیزی دارم", "دریافت", "سهمم", "دارایی"],
    starter: { en: "What do I actually own?", fa: "دقیقاً چه چیزی مال من می‌شود؟" },
    answer: {
      en: "You own shares of a specific Estate — a real villa — in proportion to the shares you hold. Your Portfolio page lists what you own, and the ownership percentage updates with every share you buy.",
      fa: "شما سهمِ یک Estate مشخص — یک ویلای واقعی — را دارید؛ متناسب با سهم‌هایی که نگه می‌دارید. صفحه‌ی سبد (Portfolio) فهرست دارایی‌هایتان را نشان می‌دهد و درصد مالکیت با هر خرید سهم به‌روز می‌شود.",
    },
    example: {
      en: "If an Estate has 10,000 shares and you hold 100, you own 1% of it — and 1% of the rent it earns.",
      fa: "اگر یک Estate ده‌هزار سهم داشته باشد و شما ۱۰۰ سهم داشته باشید، ۱٪ آن ویلای شماست — و ۱٪ از اجاره‌ای که می‌گیرد.",
    },
    next: {
      en: ["How does it generate income?", "What can change and isn't guaranteed?", "Where can I inspect it?"],
      fa: ["چطور درآمد تولید می‌کند؟", "چه چیزی ممکن است تغییر کند و تضمینی نیست؟", "کجا می‌توانم بررسی‌اش کنم؟"],
    },
  },
  {
    match: ["income", "earn", "rent", "yield", "generate", "payout", "درآمد", "سود", "اجاره", "بازده", "پرداخت"],
    starter: { en: "How does it generate income?", fa: "چطور درآمد تولید می‌کند؟" },
    answer: {
      en: "Guests stay in the villa and pay rent. That rental income is distributed to shareholders in proportion to their shares, and it accrues monthly. When you want the money, you can request a withdrawal — a 1% fee applies, paid in 4 weekly installments.",
      fa: "مهمان‌ها در ویلا اقامت می‌کنند و اجاره می‌پردازند. این درآمد اجاره به‌تناسب سهم‌ها بین دارندگان تقسیم می‌شود و ماهانه حساب می‌شود. هر وقت بخواهید می‌توانید برداشت بخواهید — کارمزد ۱٪ دارد و در ۴ قسط هفتگی پرداخت می‌شود.",
    },
    example: {
      en: "If the Estate earns rent this month, your share of it is added to your balance as part of that month's accrual.",
      fa: "اگر Estate در این ماه اجاره درآورد، سهم شما از آن بخشی از حساب‌شدگی همان ماه به موجودی‌تان اضافه می‌شود.",
    },
    next: {
      en: ["What can change and isn't guaranteed?", "Where can I inspect it?", "How do I use the app?"],
      fa: ["چه چیزی ممکن است تغییر کند و تضمینی نیست؟", "کجا می‌توانم بررسی‌اش کنم؟", "چطور از اپ استفاده کنم؟"],
    },
  },
  {
    match: ["guarantee", "risk", "what can change", "not promised", "sure", "تضمین", "ریسک", "تغییر", "قطعی", "مطمئن"],
    starter: { en: "What can change and isn't guaranteed?", fa: "چه چیزی ممکن است تغییر کند و تضمینی نیست؟" },
    answer: {
      en: "The income figures you see are projections — they are never promises. Occupancy, seasonality and costs change, so real payouts can be higher or lower. Valuations are estimates too, and every number in the app carries a provenance label showing how it was established.",
      fa: "اعداد درآمدی که می‌بینید پیش‌بینی‌اند — هرگز قول نیستند. اشغال، فصل و هزینه‌ها تغییر می‌کنند، پس پرداخت واقعی می‌تواند کمتر یا بیشتر باشد. ارزش‌گذاری‌ها هم تخمین‌اند و هر عدد در اپ برچسب منشأ دارد که نشان می‌دهد چطور به دست آمده.",
    },
    example: {
      en: "A projected 8% yield is an estimate of a typical period — a quiet season can pay less, and a high-demand season can pay more.",
      fa: "بازده پیش‌بینی‌شده‌ی ۸٪ تخمینِ یک دوره‌ی معمولی است — فصل خلوت کمتر و فصل پرتقاضا بیشتر می‌پردازد.",
    },
    next: {
      en: ["Where can I inspect it?", "What do I actually own?", "How does it generate income?"],
      fa: ["کجا می‌توانم بررسی‌اش کنم؟", "دقیقاً چه چیزی مال من می‌شود؟", "چطور درآمد تولید می‌کند؟"],
    },
  },
  {
    match: ["inspect", "verify", "check", "provenance", "where does", "source", "trust", "بررسی", "منبع", "منشأ", "اعتماد", "اثبات"],
    starter: { en: "Where can I inspect it?", fa: "کجا می‌توانم بررسی‌اش کنم؟" },
    answer: {
      en: "Every figure carries a provenance label — APPROVED, OBSERVED, ESTIMATED or PROJECTED — so you always know whether a number is confirmed or forecast. Your Portfolio and Earnings pages show your holdings and payout history, and each Estate page breaks down its own data.",
      fa: "هر عدد برچسب منشأ دارد — تأییدشده، مشاهده‌شده، تخمینی یا پیش‌بینی‌شده — تا همیشه بدانید کدام عدد قطعی است و کدام پیش‌بینی. صفحات سبد و درآمد دارایی‌ها و تاریخچه‌ی پرداخت‌هایتان را نشان می‌دهند و صفحه‌ی هر Estate داده‌های خودش را تفکیک می‌کند.",
    },
    example: {
      en: "On an Estate page, the share price reflects the current market state, while the yield is PROJECTED — the labels tell you which is which.",
      fa: "در صفحه‌ی یک Estate، قیمت سهم وضعیت فعلی بازار را نشان می‌دهد، اما بازده «پیش‌بینی‌شده» است — برچسب‌ها این دو را از هم جدا می‌کنند.",
    },
    next: {
      en: ["How do I use the app?", "What can change and isn't guaranteed?", "How does it generate income?"],
      fa: ["چطور از اپ استفاده کنم؟", "چه چیزی ممکن است تغییر کند و تضمینی نیست؟", "چطور درآمد تولید می‌کند؟"],
    },
  },
  {
    match: ["how do i use", "how to use", "how do i buy", "how to buy", "get started", "start", "استفاده", "خرید", "شروع کنم", "از کجا شروع"],
    starter: { en: "How do I use the app?", fa: "چطور از اپ استفاده کنم؟" },
    answer: {
      en: "Start in the Marketplace to browse Estates, open one to read its numbers and provenance, and buy shares when you're ready. Portfolio tracks what you own, Earnings tracks income, and Settings holds language and wallet choices.",
      fa: "از مارکت‌پلیس شروع کنید و Estateها را ببینید، یکی را باز کنید و اعداد و منشأشان را بخوانید، و هر وقت آماده بودید سهم بخرید. سبد (Portfolio) دارایی‌ها را دنبال می‌کند، درآمد (Earnings) درآمد را، و تنظیمات هم زبان و کیف پول.",
    },
    example: {
      en: "A first session can be as simple as: open an Estate that interests you, read its projected figures and their labels, and follow the share price for a few days before deciding.",
      fa: "یک جلسه‌ی اول می‌تواند همین‌قدر ساده باشد: یک Estate جالب را باز کنید، اعداد پیش‌بینی و برچسب‌هایشان را بخوانید، و چند روز قیمت سهم را دنبال کنید و بعد تصمیم بگیرید.",
    },
    next: {
      en: ["What do I actually own?", "How does it generate income?", "What can change and isn't guaranteed?"],
      fa: ["دقیقاً چه چیزی مال من می‌شود؟", "چطور درآمد تولید می‌کند؟", "چه چیزی ممکن است تغییر کند و تضمینی نیست؟"],
    },
    action: { en: "Open Marketplace", fa: "رفتن به مارکت‌پلیس", route: "/marketplace" },
  },
] as const;

// ---------------------------------------------------------------------------
// Per-screen conversation content
// ---------------------------------------------------------------------------

interface ScreenContent {
  match?: readonly string[];
  answer: { en: string; fa: string };
  example?: { en: string; fa: string };
  next?: { en: readonly string[]; fa: readonly string[] };
  tone?: FifiMessageTone;
  /** Only apply when authenticated (account questions). */
  auth?: "required";
  /** Number-asking intent: degraded/live-off handling applies. */
  numeric?: boolean;
}

const SCREEN_CONTENT: Readonly<Record<FifiScreen, readonly ScreenContent[]>> = {
  estate: [
    {
      match: ["price", "cost", "how much", "expensive", "قیمت", "چقدر", "گران"],
      numeric: true,
      answer: {
        en: "You're looking at {title}. Its current share price is on this page with its provenance label — the price moves with the market, so the page always shows the live state.",
        fa: "شما همین حالا {title} را می‌بینید. قیمت فعلی سهم در همین صفحه با برچسب منشأ نشان داده می‌شود — قیمت با بازار حرکت می‌کند و صفحه همیشه وضعیت زنده را نشان می‌دهد.",
      },
    },
    {
      match: ["ownership include", "what does ownership", "include", "مالکیت"],
      answer: {
        en: "A share of {title} represents proportional ownership: your fraction of the villa itself, your share of the rental income it earns, and the ownership specifics broken out on this page.",
        fa: "هر سهم از {title} مالکیت متناسب است: کسری از خود ویلا، سهم شما از درآمد اجاره‌ای که می‌سازد، و جزئیات مالکیت که در همین صفحه تفکیک شده است.",
      },
    },
    {
      match: ["yield", "income", "rent", "earn", "سود", "درآمد", "اجاره"],
      numeric: true,
      answer: {
        en: "{title} earns rental income from guest stays. The projected yield on this page is an estimate — income accrues monthly to shareholders in proportion to their shares.",
        fa: "{title} از اقامت مهمان‌ها درآمد اجاره دارد. بازده پیش‌بینی‌شده در این صفحه یک تخمین است — درآمد به‌صورت ماهانه و به‌تناسب سهم‌ها بین دارندگان تقسیم می‌شود.",
      },
    },
    {
      match: ["valuation", "worth", "apprais", "ارزش"],
      numeric: true,
      answer: {
        en: "The valuation of {title} is an estimate with its own provenance — the Estate page shows the legs it rests on. It guides the numbers you see, but it is not a guaranteed resale price.",
        fa: "ارزش‌گذاری {title} یک تخمین با منشأ مشخص است — صفحه‌ی Estate پایه‌هایش را نشان می‌دهد. این عدد راهنمای ارقام صفحه است، اما قیمت تضمین‌شده‌ی فروش مجدد نیست.",
      },
    },
    {
      match: ["buy", "purchase", "خرید"],
      answer: {
        en: "You can buy shares of {title} from this page — choose a quantity, review the quote, and confirm. Nothing is executed until you confirm.",
        fa: "خرید سهم‌های {title} از همین صفحه انجام می‌شود — تعداد را انتخاب کنید، پیش‌فاکتور را ببینید و تأیید کنید. تا وقتی تأیید نکنید هیچ تراکنشی انجام نمی‌شود.",
      },
    },
    {
      answer: {
        en: "You're viewing {title}. I can explain its share price, projected income, valuation, or how buying shares of this Estate works.",
        fa: "شما در صفحه‌ی {title} هستید. می‌توانم قیمت سهم، درآمد پیش‌بینی‌شده، ارزش‌گذاری یا نحوه‌ی خرید سهم همین Estate را توضیح بدهم.",
      },
      next: {
        en: ["What does a share of this Estate cost?", "How is its valuation checked?", "How do I buy shares of this Estate?"],
        fa: ["سهم این Estate چقدر است؟", "ارزش‌گذاری‌اش چطور بررسی می‌شود؟", "چطور سهم همین Estate را بخرم؟"],
      },
    },
  ],
  marketplace: [
    {
      match: ["choose", "compare", "انتخاب", "مقایسه"],
      answer: {
        en: "Compare Estates by three things on each card: the price per share, how much of the Estate is already funded, and the provenance labels on its projected figures. That comparison tells you most of what you need before opening one.",
        fa: "Estateها را با سه چیز روی هر کارت مقایسه کنید: قیمت هر سهم، میزان تأمین‌شده‌ی Estate، و برچسب‌های منشأ روی اعداد پیش‌بینی. همین مقایسه پیش از بازکردن، بیشتر آنچه لازم دارید را می‌گوید.",
      },
    },
    {
      match: ["represent", "share mean", "what is a share", "نمایانگر", "بازنمایی"],
      answer: {
        en: "A share represents a fractional slice of a real villa — proportional ownership of it, and a proportional share of the rental income it earns, starting from $80.",
        fa: "یک سهم نمایانگر کسری از یک ویلای واقعی است — مالکیت متناسب از آن، و سهمی متناسب از درآمد اجاره‌ای که می‌سازد؛ با شروع از ۸۰ دلار.",
      },
    },
    {
      match: ["what is an estate", "estate mean", "استیت", "ایستیت", "estate چیه"],
      answer: {
        en: "An Estate is a luxury villa offered as shares. Each card in the Marketplace shows its price per share and how much of it has been funded, so you can compare before you open one.",
        fa: "یک Estate ویلایی لوکس است که به‌صورت سهم عرضه می‌شود. هر کارت در مارکت‌پلیس قیمت هر سهم و میزان تأمین‌شده را نشان می‌دهد تا پیش از بازکردن، مقایسه کنید.",
      },
    },
    {
      answer: {
        en: "You're browsing the Marketplace — the list of Estates you can buy shares in. I can explain what an Estate is, how to compare them, or how buying works.",
        fa: "شما در حال گشتن در مارکت‌پلیس هستید — فهرست Estateهایی که می‌توانید سهم‌شان را بخرید. می‌توانم بگویم Estate چیست، چطور مقایسه‌شان کنید یا خرید چطور انجام می‌شود.",
      },
      next: {
        en: ["What is an Estate?", "How do I compare Estates?", "How do I buy shares?"],
        fa: ["Estate چیست؟", "چطور Estateها را مقایسه کنم؟", "چطور سهم بخرم؟"],
      },
    },
  ],
  portfolio: [
    {
      auth: "required",
      match: ["my", "mine", "holdings", "balance", "دارایی", "موجودی", "سهم‌های من", "مال من"],
      tone: "restricted",
      answer: {
        en: "Your own holdings are only visible in your signed-in account. I can explain how ownership and holdings work in general, if that helps.",
        fa: "دارایی‌های شخصی شما فقط در حساب واردشده‌ی خودتان دیده می‌شود. اگر کمک می‌کند، می‌توانم مالکیت و سهم‌ها را به‌صورت کلی توضیح بدهم.",
      },
    },
    {
      match: ["earn", "income", "سود", "درآمد"],
      answer: {
        en: "Holdings and earnings are separate views: Portfolio shows what you own; Earnings shows the income those holdings generate. Both update as rent accrues monthly.",
        fa: "دارایی و درآمد دو نمای جدا هستند: سبد نشان می‌دهد چه چیزی دارید؛ درآمد نشان می‌دهد آن دارایی چه درآمدی تولید می‌کند. هر دو با حساب‌شدگی ماهانه‌ی اجاره به‌روز می‌شوند.",
      },
    },
    {
      answer: {
        en: "This is the ownership view. I can explain how holdings are shown, the difference between what you own and what it earns, or where the payout history lives.",
        fa: "این نمای مالکیت است. می‌توانم بگویم سهم‌ها چطور نمایش داده می‌شوند، تفاوت «چه دارید» و «چه درآمدی می‌سازد» چیست، یا تاریخچه‌ی پرداخت‌ها کجاست.",
      },
      next: {
        en: ["What do my shares earn?", "How is my ownership shown?", "Where is the payout history?"],
        fa: ["سهم‌هایم چه درآمدی می‌سازند؟", "مالکیت‌ام چطور نمایش داده می‌شود؟", "تاریخچه‌ی پرداخت‌ها کجاست؟"],
      },
    },
  ],
  earnings: [
    {
      match: ["withdraw", "برداشت"],
      answer: {
        en: "Withdrawals are on request: a 1% fee applies and the amount is paid in 4 weekly installments. The Earnings page shows what is available right now.",
        fa: "برداشت‌ها درخواستی‌اند: کارمزد ۱٪ دارد و مبلغ در ۴ قسط هفتگی پرداخت می‌شود. صفحه‌ی درآمد نشان می‌دهد همین حالا چه چیزی قابل برداشت است.",
      },
    },
    {
      numeric: true,
      answer: {
        en: "Three different states: projected is an estimate of what the Estate may earn; accrued is what has built up for you in the current period; paid is what has actually landed in your balance. Only paid is money you can withdraw (1% fee, 4 weekly installments).",
        fa: "سه حالت متفاوت: «پیش‌بینی» تخمین درآمد احتمالی Estate است؛ «تسویه‌شده» آن چیزی است که در دوره‌ی جاری برای شما حساب شده؛ «پرداخت‌شده» پولی است که واقعاً به موجودی‌تان رسیده. فقط پرداخت‌شده قابل برداشت است (کارمزد ۱٪، در ۴ قسط هفتگی).",
      },
    },
  ],
  club: [
    {
      answer: {
        en: "The Private Club is the membership and benefits layer of the product — it wraps around ownership rather than replacing it. Your holdings remain the core; the Club adds privileges on top. I can explain what it includes or how it relates to ownership.",
        fa: "کلاب خصوصی لایه‌ی عضویت و مزایای محصول است — دور مالکیت می‌پیچد، نه اینکه جای آن را بگیرد. سهم‌های شما هسته‌اند و کلاب مزایایی روی آن اضافه می‌کند. می‌توانم بگویم شامل چه می‌شود یا چه نسبتی با مالکیت دارد.",
      },
      next: {
        en: ["What benefits does the Club include?", "How does membership relate to ownership?", "What do I own as a shareholder?"],
        fa: ["کلاب چه مزایایی دارد؟", "عضویت چه نسبتی با مالکیت دارد؟", "به‌عنوان سهامدار چه چیزی دارم؟"],
      },
    },
  ],
  card: [
    {
      answer: {
        en: "This is the premium card surface — a card tied to your fractional portfolio. I can explain how it relates to your holdings, or anything else about the product.",
        fa: "این صفحه‌ی کارت پریمیوم است — کارتی متصل به سبد جزئی شما. می‌توانم رابطه‌اش با دارایی‌هایتان را توضیح بدهم یا هر چیز دیگری درباره‌ی محصول.",
      },
    },
  ],
  referral: [
    {
      answer: {
        en: "Referrals let you invite friends to the product. I can explain how the referral section works or where your invite options live on this page.",
        fa: "معرفی به شما امکان می‌دهد دوستانتان را به محصول دعوت کنید. می‌توانم بگویم بخش معرفی چطور کار می‌کند یا گزینه‌های دعوت کجای این صفحه است.",
      },
    },
  ],
  transactions: [
    {
      answer: {
        en: "This page lists your transaction history. Every entry shows its own status, so you can always see what is completed, pending or failed.",
        fa: "این صفحه تاریخچه‌ی تراکنش‌های شماست. هر ردیف وضعیت خودش را نشان می‌دهد تا همیشه ببینید چه چیزی کامل، در جریان یا ناموفق است.",
      },
    },
  ],
  home: [
    {
      match: ["hi", "hello", "hey", "who are you", "welcome", "سلام", "درود", "کی هستی"],
      answer: {
        en: "Welcome. This is FractionalLuxe — I'm Fifi. I can explain the product, Estates, ownership or income whenever you want.",
        fa: "خوش آمدید. این فرکشنال‌لوکس است — من فیفی‌ام. هر وقت بخواهید می‌توانم محصول، Estateها، مالکیت یا درآمد را توضیح بدهم.",
      },
      next: {
        en: ["What do I actually own?", "How does it generate income?", "What can change and isn't guaranteed?"],
        fa: ["دقیقاً چه چیزی مال من می‌شود؟", "چطور درآمد تولید می‌کند؟", "چه چیزی ممکن است تغییر کند و تضمینی نیست؟"],
      },
    },
  ],
  settings: [
    {
      answer: {
        en: "I'm here for questions about the product — Estates, shares, income and how the app works.",
        fa: "من برای سؤال‌های درباره‌ی محصول اینجا هستم — Estateها، سهم‌ها، درآمد و کارکرد اپ.",
      },
    },
  ],
  other: [
    {
      answer: {
        en: "I focus on FractionalLuxe — Estates, shares, income and the app itself. Try one of the questions below.",
        fa: "من روی فرکشنال‌لوکس تمرکز دارم — Estateها، سهم‌ها، درآمد و خود اپ. یکی از سؤال‌های زیر را امتحان کنید.",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Availability / state notices
// ---------------------------------------------------------------------------

const NOTICE = {
  unavailable: {
    en: "Fifi is temporarily unavailable. Please try again in a moment.",
    fa: "فیفی موقتاً در دسترس نیست. چند لحظه بعد دوباره امتحان کنید.",
  },
  rate_limited: {
    en: "You've sent several questions in a row — take a short pause and try again.",
    fa: "چند سؤال پشت‌سرهم فرستاده‌اید — کمی مکث کنید و دوباره امتحان کنید.",
  },
  degraded: {
    en: "I'm running with reduced capacity right now, so this is the short version: shares of a villa, monthly rental income, no guarantees. Ask again later for the full detail.",
    fa: "الان با ظرفیت کم پاسخ می‌دهم، پس خلاصه می‌گویم: سهمِ ویلا، درآمد اجاره‌ی ماهانه، بدون تضمین. بعداً برای توضیح کامل بپرسید.",
  },
  live_unavailable: {
    en: "I can't fetch current figures right now, so I won't quote numbers I can't verify. I can still explain how things work.",
    fa: "الان نمی‌توانم اعداد زنده را بگیرم، پس عددی که نتوانم تأیید کنم نقل نمی‌کنم. اما می‌توانم توضیح بدهم چطور کار می‌کند.",
  },
  live_unavailable_note: {
    en: "(Live data is off right now, so no current figures.)",
    fa: "(داده‌ی زنده فعلاً خاموش است، بنابراین عدد لحظه‌ای نمی‌گویم.)",
  },
} as const;

const FAILURE_TRIGGER = ["error", "خطا"];

export type FifiReplyResult = FifiReply | { failure: true };

/** Pick the en/fa variant of a bilingual content record. */
const pick = (isFa: boolean, x: { en: string; fa: string }): string => (isFa ? x.fa : x.en);

export function fifiReply(input: FifiReplyInput): FifiReplyResult {
  const isFa = fa(input.locale);
  const L = (x: { en: string; fa: string }): string => pick(isFa, x);
  const n = normalize(input.question);
  const title = input.estateTitle?.trim() || "this Estate";

  // Simulated failure + retry (deterministic trigger; first attempt fails, retry succeeds).
  if (!input.retryOf && FAILURE_TRIGGER.some((w) => n.includes(w))) {
    return { failure: true };
  }

  // Global availability notices.
  if (input.availability === "unavailable") {
    return { text: L(NOTICE.unavailable), tone: "notice" };
  }
  if (input.availability === "rate_limited") {
    return { text: L(NOTICE.rate_limited), tone: "notice" };
  }
  if (input.availability === "degraded") {
    return { text: L(NOTICE.degraded), tone: "notice" };
  }

  const numericQuestion = has(n, [
    "price", "cost", "how much", "yield", "income", "earn", "worth", "valuation", "payout", "balance",
    "قیمت", "چقدر", "سود", "درآمد", "ارزش", "موجودی", "بازده",
  ]);

  // Live-data-unavailable: numeric questions get the honesty notice; others get
  // a normal answer with an explicit note.
  if (input.availability === "live_unavailable" && numericQuestion) {
    return { text: L(NOTICE.live_unavailable), tone: "notice" };
  }

  // Access restriction: account-specific questions need a signed-in account.
  if (!input.authenticated && has(n, ["my ", "mine", "holdings", "balance", "withdraw", "sell", "مال من", "سهم‌های من", "دارایی", "موجودی", "برداشت", "بفروشم"])) {
    return {
      text: isFa
        ? "این بخش به حساب واردشده‌ی شما نیاز دارد — من فقط اطلاعات عمومی محصول را می‌بینم. بعد از ورود، اعداد شخصی شما در سبد و درآمد نمایش داده می‌شود."
        : "That part needs your signed-in account — I can only see product-level information here. Once you're signed in, your own numbers appear in Portfolio and Earnings.",
      tone: "restricted",
      nextQuestions: isFa
        ? ["مالکیت چطور کار می‌کند؟", "درآمد چطور حساب می‌شود؟", "Estate چیست؟"]
        : ["How does ownership work?", "How does income accrue?", "What is an Estate?"],
    };
  }

  const stepReply = (i: number): FifiReply => {
    const step = ONBOARDING_STEPS[i];
    const reply: FifiReply = {
      text: pick(isFa, step.answer),
      example: pick(isFa, step.example),
      nextQuestions: isFa ? [...step.next.fa] : [...step.next.en],
      tone: "answer",
      matchedOnboardingStep: i,
    };
    if (step.action) {
      reply.action = { label: isFa ? step.action.fa : step.action.en, route: step.action.route };
    }
    return reply;
  };

  // A step matches its keyword list OR its own starter question (the exact
  // text the suggestion chips send, in either language).
  const stepIndex = ONBOARDING_STEPS.findIndex((s) => {
    if (has(n, s.match)) return true;
    return n.includes(normalize(s.starter.en)) || n.includes(normalize(s.starter.fa));
  });

  const coreAnswer = (): FifiReply => {
    // Brand/product-identity questions always get the product overview (step 0),
    // for new and existing users alike.
    if (has(n, ["fractionalluxe", "فرکشنال"])) return stepReply(0);

    // Onboarding progression: a new user is guided through the six questions in
    // order, so progression matching outranks screen-specific content. Existing
    // users get screen content first, with the progression as a fallback.
    if (stepIndex >= 0 && !input.onboarded) return stepReply(stepIndex);

    // Screen-specific content.
    for (const entry of SCREEN_CONTENT[input.screen] ?? []) {
      if (entry.auth === "required") continue; // restricted case handled above
      if (entry.match && !has(n, entry.match)) continue;
      const reply: FifiReply = {
        text: (isFa ? entry.answer.fa : entry.answer.en).replaceAll("{title}", title),
        tone: entry.tone ?? "answer",
      };
      if (entry.example) reply.example = isFa ? entry.example.fa : entry.example.en;
      if (entry.next) reply.nextQuestions = isFa ? [...entry.next.fa] : [...entry.next.en];
      return reply;
    }

    // Progression fallback for existing users when no screen content matched.
    if (stepIndex >= 0) return stepReply(stepIndex);

    // Generic fallback: stay in product scope, never dead-end.
    return {
      text: isFa
        ? "من روی فرکشنال‌لوکس تمرکز دارم — Estateها، سهم‌ها، درآمد و خود اپ. یکی از سؤال‌های زیر را امتحان کنید."
        : "I focus on FractionalLuxe — Estates, shares, income and the app itself. Try one of the questions below.",
      tone: "answer",
    };
  };

  const reply = coreAnswer();
  // Live-data-unavailable honesty note on any full answer.
  if (input.availability === "live_unavailable" && reply.tone === "answer") {
    reply.text = `${reply.text} ${L(NOTICE.live_unavailable_note)}`;
  }
  return reply;
}

// ---------------------------------------------------------------------------
// Suggestions + greeting
// ---------------------------------------------------------------------------

const SUGGESTIONS: Readonly<Partial<Record<FifiScreen, { en: readonly string[]; fa: readonly string[] }>>> = {
  marketplace: {
    en: ["How do I choose an Estate?", "What does a share represent?", "How do I buy shares?"],
    fa: ["چطور یک Estate انتخاب کنم؟", "یک سهم چه چیزی را نشان می‌دهد؟", "چطور سهم بخرم؟"],
  },
  estate: {
    en: ["What does ownership of this Estate include?", "How is its valuation calculated?", "How do I earn from this Estate?"],
    fa: ["مالکیت این Estate چه چیزهایی شامل می‌شود؟", "ارزش‌گذاری‌اش چطور محاسبه می‌شود؟", "از این Estate چطور درآمد داشته باشم؟"],
  },
  portfolio: {
    en: ["What do my shares earn?", "How is my ownership shown?", "Where is the payout history?"],
    fa: ["سهم‌هایم چه درآمدی می‌سازند؟", "مالکیت‌ام چطور نمایش داده می‌شود؟", "تاریخچه‌ی پرداخت‌ها کجاست؟"],
  },
  earnings: {
    en: ["How are earnings calculated?", "What is paid vs projected?", "How do withdrawals work?"],
    fa: ["درآمدها چطور محاسبه می‌شوند؟", "پرداخت‌شده و پیش‌بینی چه فرقی دارند؟", "برداشت‌ها چطور انجام می‌شود؟"],
  },
  club: {
    en: ["What is the Private Club?", "What benefits does it include?", "How does membership relate to ownership?"],
    fa: ["کلاب خصوصی چیست؟", "چه مزایایی دارد؟", "عضویت چه نسبتی با مالکیت دارد؟"],
  },
};

const PRODUCT_STARTERS = {
  en: ["What is FractionalLuxe?", "What do I actually own?", "How does it generate income?"],
  fa: ["فرکشنال‌لوکس چیست؟", "دقیقاً چه چیزی مال من می‌شود؟", "چطور درآمد تولید می‌کند؟"],
} as const;

export function fifiSuggestions(input: {
  screen: FifiScreen;
  onboarded: boolean;
  onboardingStep: number;
  locale: string;
}): string[] {
  const isFa = fa(input.locale);
  if (!input.onboarded) {
    // Suggest the current progression step and the two after it (each step's
    // own opening question, so the natural order is preserved).
    const idx = Math.min(Math.max(input.onboardingStep, 0), ONBOARDING_STEPS.length - 1);
    const picks = [idx, Math.min(idx + 1, 5), Math.min(idx + 2, 5)].filter(
      (v, i, a) => a.indexOf(v) === i,
    );
    return picks.map((i) => pick(isFa, ONBOARDING_STEPS[i].starter));
  }
  const screenSet = SUGGESTIONS[input.screen];
  if (screenSet) return isFa ? [...screenSet.fa] : [...screenSet.en];
  return isFa ? [...PRODUCT_STARTERS.fa] : [...PRODUCT_STARTERS.en];
}

export function fifiGreeting(input: {
  screen: FifiScreen;
  estateTitle?: string | null;
  onboarding?: boolean;
  locale: string;
}): string {
  const isFa = fa(input.locale);
  const title = input.estateTitle?.trim() || "this Estate";
  if (input.onboarding) {
    return isFa
      ? "سلام، من فیفی هستم — راهنمای شما در فرکشنال‌لوکس. هر چیزی درباره‌ی محصول می‌خواهید بپرسید، یا از سؤال‌های زیر شروع کنید."
      : "Hi, I'm Fifi — your guide to FractionalLuxe. Ask me anything about the product, or start with one of the questions below.";
  }
  if (input.screen === "estate") {
    return isFa
      ? `شما صفحه‌ی ${title} را می‌بینید. هر چیزی درباره‌ی همین Estate می‌خواهید بپرسید — قیمت سهم، درآمد یا نحوه‌ی خرید.`
      : `You're viewing ${title}. Ask me anything about this Estate — its share price, income, or how to buy shares.`;
  }
  if (input.screen === "portfolio") {
    return isFa
      ? "این نمای مالکیت شماست. درباره‌ی سهم‌ها، درآمد یا تاریخچه‌ی پرداخت‌ها بپرسید."
      : "This is your ownership view. Ask me about holdings, earnings, or your payout history.";
  }
  if (input.screen === "earnings") {
    return isFa
      ? "این نمای درآمد است. درباره‌ی پیش‌بینی، تسویه‌شده و پرداخت‌شده — یا برداشت — بپرسید."
      : "This is your income view. Ask me about projected, accrued and paid — or withdrawals.";
  }
  if (input.screen === "club") {
    return isFa
      ? "این کلاب خصوصی است — لایه‌ی عضویت و مزایا. خوشحال می‌شوم توضیحش بدهم."
      : "This is the Private Club — the membership and benefits layer. Happy to explain it.";
  }
  if (input.screen === "marketplace") {
    return isFa
      ? "شما در مارکت‌پلیس هستید. درباره‌ی Estateها، مقایسه‌شان یا خرید سهم بپرسید."
      : "You're in the Marketplace. Ask me about Estates, comparing them, or buying shares.";
  }
  return isFa
    ? "هر چیزی درباره‌ی فرکشنال‌لوکس می‌خواهید بپرسید — Estateها، سهم‌ها یا درآمد."
    : "Ask me anything about FractionalLuxe — Estates, shares, or income.";
}
