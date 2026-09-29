// File responsibility: deterministic rule-based DecisionEngine (FIFI-06).
// Default provider. Pure functions, no I/O, no model calls — fully testable.
// Ordered stages: never-disclose → out-of-scope → restricted → financial/live split
// → navigation → troubleshooting → property context → education → safe fallback.
// Routing logic is brand-neutral: no display-brand literals anywhere in this file.

import type {
  DecisionInput,
  FifiCategory,
  FifiDecision,
  FifiLearningLevel,
} from "./decision-types";
import type { DecisionEngine } from "./decision-engine";
import { safeFallbackDecision } from "./decision-types";
import { mentionsDisplayBrand, mentionsLegacyBrand } from "./brand";

type Matcher = (text: string) => boolean;

const any =
  (...patterns: RegExp[]): Matcher =>
  (text) =>
    patterns.some((p) => p.test(text));

// --- Stage matchers (ordered; first match wins) ---

const NEVER_PATTERNS = [
  /system prompt|hidden instruction|hidden rule|reveal.*rag|show me.*(memory|context|embedding|vector)|dump.*(knowledge|rag)/i,
  /api[_ -]?key|secret|credential|private key|password|seed phrase|initdata|auth token|env var|environment variable/i,
  /source code|github|repo\b|repository|codebase/i,
  /hack|exploit|bypass|jailbreak|debug mode|act as.*developer|you are (now |no longer )|pretend.*developer|unrestricted/i,
  /which (coding )?agent|what model|model config|hidden config|\blaya\b/i,
  /show me everything|entire knowledge base|list all.*(documents|knowledge)|export.*knowledge|کل دیتابیس|همه.*دانش/i,
  /کلید|رمز عبور|توکن|هک|اکسپلویت|دور زدن|سورس|گیت‌هاب|ریپو|پرامپت سیستم|دستورات مخفی/,
];

const OUT_PATTERNS = [
  /\b(sex|porn|nude|explicit|erotic)\b|سکسی|پورن|جنسی\b|تحریک/,
  /\b(election|president|parliament|senator|political party)\b|انتخابات|رئیس‌جمهور|مجلس|تحریم/,
  /weather|football score|lottery numbers|recipe for|write (me |an? )?(poem|essay|song)|homework|آب‌وهوا|فوتبال|آشپزی|دستور غذا|شعر بگو|انشا|تکلیف/,
  /write (me )?code|debug my|python|javascript|help me code|کد بنویس|برنامه‌نویسی/,
];

const RESTRICTED: Array<{ category: FifiCategory; match: Matcher; hint: string }> = [
  {
    category: "safety_trust",
    match: any(/scam|fraud|steal.*money|ponzi|prove.*not.*scam|کلاهبردار|کلاهبرداری|پانزی/),
    hint: "explain_provenance_and_product",
  },
  {
    category: "income",
    match: any(
      /guarantee|definitely make|how much will i (make|earn)|sure profit|risk.?free|should i invest|investment advice|تضمین|تضمینی|حتماً سود|قطعاً|بخرم یا نه|مشاوره.*سرمایه/,
    ),
    hint: "explain_projections_not_promises",
  },
  {
    category: "withdrawal",
    match: any(/tax (advice|classific|treatment)|legal (advice|conclusion)|is the 1%.*(tax|withholding)|lawsuit|مالیات.*(طبقه|مشاوره)|حقوقی|شکایت/),
    hint: "neutral_fee_wording_reserved",
  },
  {
    category: "referral",
    match: any(/convince.*invest|bring investors|find investors|persuade|make.*invest immediately|write.*pitch|سرمایه‌گذار.*(بیار|جذب|قانع)|متقاعد/),
    hint: "explain_product_neutrally",
  },
];

/** Live-state questions: runtime data only, never KB text. */
const LIVE: Array<{ category: FifiCategory; match: Matcher }> = [
  { category: "income", match: any(/how much have i earned|my (current )?earnings|my accrued|earnings so far|درآمدم چقدر|سودم چقدر/) },
  { category: "ownership", match: any(/how much do i own|my holdings|portfolio balance|دارایی.*من|سهام.*من|سبدم|موجودی/) },
  { category: "withdrawal", match: any(/where.*my withdrawal|withdrawal status|my installments|وضعیت برداشت|قسط.*من/) },
  { category: "troubleshooting", match: any(/my transaction|transaction status|tx status|وضعیت تراکنش|تراکنش.*من/) },
  { category: "club", match: any(/my (tier|membership|club status)|سطح.*من|عضویت.*من/) },
];

const PRICE = /price|cost|how much is|how much|worth|funded|available|قیمت|چنده|چقدر(?!\s*(طول|زمان|وقت|روز|ماه|سال))|موجودی ملک/;

const NAV: Array<{ category: FifiCategory; actionId: string; match: Matcher }> = [
  { category: "product", actionId: "action.open-portfolio", match: any(/open.*portfolio|portfolio.*open|take me to (my )?portfolio|(سبد|پرتفوی).*(باز|ببین|نشان)/) },
  { category: "income", actionId: "action.open-earnings", match: any(/open.*earning|earnings.*(page|tab|screen)|take me to (my )?earnings|درآمد.*(باز|ببین|کجا)/) },
  { category: "product", actionId: "action.open-marketplace", match: any(/open.*marketplace|browse.*(villa|estate|propert)|take me to (the )?marketplace|go to (the )?marketplace|(مارکت‌پلیس|مارکت|بازار).*(باز|ببین|برو|کجا)/) },
  { category: "club", actionId: "action.open-club", match: any(/open.*club|where.*club|club.*(page|section)|کلاب.*(باز|کجا)/) },
  { category: "referral", actionId: "action.open-invite", match: any(/invite|referral.*(page|link|screen)|دعوت.*(لینک|کجا|باز)/) },
  { category: "product", actionId: "action.open-card", match: any(/open.*card|کارت.*باز/) },
  { category: "account", actionId: "action.open-wallet", match: any(/connect.*wallet|open.*wallet|wallet.*(page|screen)|کیف.*(وصل|باز|کجا)/) },
  { category: "estate", actionId: "action.open-estate", match: any(/open.*(that |this )?(villa|estate|propert)|show.*(that |this )?(villa|estate)|take me.*(villa|estate)|(that|this) (villa|estate).*open|ویلاها.*باز|ملک.*باز/) },
];

const TROUBLE = any(
  /won't connect|can't connect|connection fail|stuck|pending|failed|went wrong|error|not loading|can't find|doesn't work|نمی‌شه|وصل نمی|گیر کرده|خطا|باز نمی|کار نمی|خراب/,
);

const THIS_VILLA = any(/(this|that) (villa|estate|one|property)|همین|این ویلا|این ملک/);

const CATEGORY_HINTS: Array<{ category: FifiCategory; match: Matcher }> = [
  { category: "withdrawal", match: any(/withdraw|برداشت|installment|قسط|fee|1%|۱٪/) },
  { category: "club", match: any(/club|tier|membership|luxe circle|کلاب|عضویت|سطح/) },
  { category: "referral", match: any(/referral|invite|دعوت|رفرال/) },
  { category: "income", match: any(/income|earning|yield|rent|profit|payout|rate|valuation|scenario|average|درآمد|سود|اجاره|بازده|پرداخت|نرخ|ارزش|سناریو/) },
  { category: "ownership", match: any(/ownership|\bshares?\b|fraction|buy|sell|order|lock|unlock|مالکیت|سهم|خرید|فروش|قفل|سفارش/) },
  { category: "estate", match: any(/villa|estate|property|tabs?|ویلا|ویلای|ویلاها|ملک|تب/) },
  { category: "account", match: any(/wallet|connect|account|کیف|حساب|اتصال/) },
  { category: "troubleshooting", match: TROUBLE },
  { category: "product", match: any(/marketplace|\bmarket\b|\bhome\b|onboarding|settings|\btabs?\b|اپ|برنامه|مارکت|تنظیمات/) },
  { category: "terminology", match: any(/what is|what are|what does|یعنی چی|به چه معن|تعریف/) },
];

const LEARN = any(/how does|how do|how many|tell me about|teach|explain|guide|walk me through|چطور|چگونه|چطوری|یاد بده|توضیح|راهنما|بگو/);
const BEGINNER = any(/what is|what are|what does|what do|یعنی چی|beginner|new here|تازه|اولین|مبتدی|ساده بگو/);
const ADVANCED = any(/\badr\b|allocation|75\/25|envelope|derivation|compliance|تخصیص|انحراف/);

function learningLevel(text: string, signal?: FifiLearningLevel): FifiLearningLevel {
  if (signal && signal !== "unspecified") return signal;
  if (BEGINNER(text)) return "beginner";
  if (ADVANCED(text)) return "advanced";
  return "intermediate";
}

function base(input: DecisionInput): { locale: string; text: string } {
  const raw = input.message.trim();
  // Lowercase once for matching (all patterns are lowercase; fa script unaffected).
  const text = raw.toLowerCase();
  const locale = input.locale || (/[\u0600-\u06FF]/.test(text) ? "fa" : "en");
  return { locale, text };
}

/** Deterministic default provider. Pure, synchronous, side-effect free. */
export class RuleBasedDecisionEngine implements DecisionEngine {
  readonly providerName = "rule-based-v1";

  decide(input: DecisionInput): FifiDecision {
    const { text } = base(input);
    if (text.length === 0) return safeFallbackDecision();

    const level = (l: FifiLearningLevel): FifiLearningLevel =>
      input.learningSignal && input.learningSignal !== "unspecified" ? input.learningSignal : l;

    // Stage 1 — never disclose / never perform.
    if (any(...NEVER_PATTERNS)(text)) {
      return {
        intent: "restricted",
        category: "safety_trust",
        scope: "never_disclose_or_perform",
        knowledgeRequirement: "neither",
        needsClarification: false,
        learningLevel: level("unspecified"),
        nextStepHint: "decline_and_offer_capabilities",
        source: "deterministic",
        fallback: "none",
      };
    }

    // Stage 2 — out of scope.
    if (any(...OUT_PATTERNS)(text)) {
      return {
        intent: "out_of_scope",
        category: "other",
        scope: "out_of_scope",
        knowledgeRequirement: "neither",
        needsClarification: false,
        learningLevel: level("unspecified"),
        nextStepHint: "redirect_to_product_help",
        source: "deterministic",
        fallback: "none",
      };
    }

    // Stage 3 — restricted (controlled handling, useful redirect).
    for (const r of RESTRICTED) {
      if (r.match(text)) {
        return {
          intent: "restricted",
          category: r.category,
          scope: "restricted",
          knowledgeRequirement: "static",
          needsClarification: false,
          learningLevel: level(learningLevel(text)),
          nextStepHint: r.hint,
          source: "deterministic",
          fallback: "none",
        };
      }
    }

    // Legacy-brand mention → migration context, never current identity.
    if (mentionsLegacyBrand(text)) {
      return {
        intent: "explain",
        category: "product",
        scope: "in_scope",
        knowledgeRequirement: "static",
        needsClarification: false,
        learningLevel: level(learningLevel(text)),
        nextStepHint: "explain_legacy_name_context",
        source: "deterministic",
        fallback: "none",
      };
    }

    // Stage 5 — navigation first: an explicit open/show/go-to wins over
    // live-state keywords ("Open my portfolio" navigates; "How much have I
    // earned?" below still routes to live data).
    for (const n of NAV) {
      if (n.match(text)) {
        const params =
          n.actionId === "action.open-estate" && input.propertyId
            ? { propertyId: input.propertyId }
            : undefined;
        return {
          intent: "navigate",
          category: n.category,
          scope: "in_scope",
          knowledgeRequirement: input.propertyId ? "both" : "static",
          needsClarification: false,
          navigation: params ? { actionId: n.actionId, params } : { actionId: n.actionId },
          learningLevel: level(learningLevel(text)),
          source: "deterministic",
          fallback: "none",
        };
      }
    }

    // Stage 4b — live user/product state (never from KB text).
    for (const l of LIVE) {
      if (l.match(text)) {
        return {
          intent: "retrieve_live_data",
          category: l.category,
          scope: "in_scope",
          knowledgeRequirement: "live",
          needsClarification: false,
          learningLevel: level(learningLevel(text)),
          source: "deterministic",
          fallback: "none",
        };
      }
    }

    // Price/availability: live when a property is known, else clarify.
    if (PRICE.test(text)) {
      if (input.propertyId || /re-\d+/.test(text)) {
        return {
          intent: "retrieve_live_data",
          category: "estate",
          scope: "in_scope",
          knowledgeRequirement: "both",
          needsClarification: false,
          learningLevel: level(learningLevel(text)),
          nextStepHint: "explain_price_concept",
          source: "deterministic",
          fallback: "none",
        };
      }
      return {
        intent: "clarify",
        category: "estate",
        scope: "in_scope",
        knowledgeRequirement: "neither",
        needsClarification: true,
        clarificationReason: "ambiguous_property",
        learningLevel: level(learningLevel(text)),
        nextStepHint: "ask_which_villa",
        source: "deterministic",
        fallback: "none",
      };
    }

    // (Navigation handled above in Stage 5.)

    // Stage 6 — troubleshooting.
    if (TROUBLE(text)) {
      return {
        intent: "troubleshoot",
        category: "troubleshooting",
        scope: "in_scope",
        knowledgeRequirement: "static",
        needsClarification: false,
        learningLevel: level(learningLevel(text)),
        source: "deterministic",
        fallback: "none",
      };
    }

    // Stage 7 — property context ("this villa").
    if (THIS_VILLA(text)) {
      if (input.propertyId) {
        const category: FifiCategory = /where|location|کجا|موقعیت/.test(text)
          ? "estate"
          : /income|earn|rent|سود|درآمد|اجاره/.test(text)
            ? "income"
            : /own|buy|share|مالک|خرید|سهم/.test(text)
              ? "ownership"
              : "estate";
        return {
          intent: /where|location|کجا/.test(text) ? "explain" : "learn",
          category,
          scope: "in_scope",
          knowledgeRequirement: "both",
          needsClarification: false,
          learningLevel: level(learningLevel(text)),
          source: "deterministic",
          fallback: "none",
        };
      }
      return {
        intent: "clarify",
        category: "estate",
        scope: "in_scope",
        knowledgeRequirement: "neither",
        needsClarification: true,
        clarificationReason: "ambiguous_property",
        learningLevel: level(learningLevel(text)),
        nextStepHint: "ask_which_villa",
        source: "deterministic",
        fallback: "none",
      };
    }

    // Stage 8 — education / explanation by category hints.
    // Display-brand questions ("what is <brand>?") resolve to the product
    // overview via data-driven brand recognition — no hard-coded literals.
    // Gated to identity-questions so brand mentions never hijack other topics.
    if (
      mentionsDisplayBrand(text) &&
      /what is|what was|what are|tell me about|یعنی|چیست|چی بود/.test(text)
    ) {
      return {
        intent: "explain",
        category: "product",
        scope: "in_scope",
        knowledgeRequirement: "static",
        needsClarification: false,
        learningLevel: level(learningLevel(text)),
        source: "deterministic",
        fallback: "none",
      };
    }
    for (const c of CATEGORY_HINTS) {
      if (c.match(text)) {
        return {
          intent: LEARN(text) ? "learn" : "explain",
          category: c.category,
          scope: "in_scope",
          knowledgeRequirement: "static",
          needsClarification: false,
          learningLevel: level(learningLevel(text)),
          source: "deterministic",
          fallback: "none",
        };
      }
    }

    // Stage 9 — safe fallback (never an invented category).
    return safeFallbackDecision();
  }
}
