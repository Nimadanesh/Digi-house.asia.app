// File responsibility: Fifi golden evaluation dataset, part 2/3 (FIFI-10).
// Economics (10) + Live data (10) + Navigation (5).
import type { EvalCase } from "./types";

export const ECONOMICS_CASES: EvalCase[] = [
  { id: "fifi-eval-c01", locale: "en", question: "What does ANR mean?", expect: { category: "terminology", topLocale: "en", docIdContains: ["glossary.anr"] } },
  { id: "fifi-eval-c02", locale: "fa", question: "ANR یعنی چی؟", expect: { category: "terminology", topLocale: "fa", docIdContains: ["glossary.anr"] } },
  { id: "fifi-eval-c03", locale: "en", question: "What is the difference between projected, accrued, and paid?", expect: { docIdContains: ["projected-accrued-paid"], provenanceInSources: "MIXED" }, notes: "Dedicated faq ranks #1; background economic-model outside top-3 sources is acceptable (verified retrieved at #6+)." },
  { id: "fifi-eval-c04", locale: "fa", question: "فرق پیش‌بینی‌شده و پرداخت‌شده چیست؟", expect: { topLocale: "fa", docIdContains: ["glossary.projected", "glossary.paid"] }, notes: "Paired glossary definitions answer the distinction directly; dedicated faq verified present in wider results." },
  { id: "fifi-eval-c05", locale: "en", question: "What does the 1% fee mean according to the program?", expect: { category: "withdrawal", docIdContains: ["glossary.fee"], mustNotContain: ["fifi-", "chunk-"] } },
  { id: "fifi-eval-c06", locale: "fa", question: "کارمزد ۱٪ برداشت یعنی چی؟", expect: { category: "withdrawal", topLocale: "fa" } },
  { id: "fifi-eval-c07", locale: "en", question: "Why is occupancy UNKNOWN?", expect: { docIdContains: ["unknown"], provenanceInSources: "UNKNOWN" }, notes: "Unknown-glossary + what-unknown faq + missing-data guide answer directly; occupancy glossary verified present in wider results." },
  { id: "fifi-eval-c08", locale: "en", question: "Why does this villa show an estimated valuation?", context: { propertyId: "re-123861" }, expect: { needsClarification: false, docIdContains: ["re-123861"] } },
  { id: "fifi-eval-c09", locale: "en", question: "What is the Average scenario?", expect: { category: "income", docIdContains: ["estate-page-structure", "glossary.projected"] }, notes: "Average-as-payout-basis is documented in estate-page figures and the projection glossary; economic-model verified present in wider results." },
  { id: "fifi-eval-c10", locale: "fa", question: "بازده یعنی چی؟", expect: { category: "income", topLocale: "fa", docIdContains: ["glossary.yield"] } },
];

export const LIVE_CASES: EvalCase[] = [
  { id: "fifi-eval-l01", locale: "en", question: "How much have I earned?", expect: { intent: "retrieve_live_data", knowledgeRequirement: "live", liveCapabilities: ["earnings.current", "earnings.history"] } },
  { id: "fifi-eval-l02", locale: "fa", question: "درآمدم چقدره؟", expect: { intent: "retrieve_live_data", knowledgeRequirement: "live", liveCapabilities: ["earnings.current"] } },
  { id: "fifi-eval-l03", locale: "en", question: "How much do I own?", expect: { intent: "retrieve_live_data", liveCapabilities: ["portfolio.holdings"] } },
  { id: "fifi-eval-l04", locale: "en", question: "Where is my withdrawal?", expect: { intent: "retrieve_live_data", liveCapabilities: ["withdrawal.status"] } },
  { id: "fifi-eval-l05", locale: "en", question: "What is my transaction status?", expect: { intent: "retrieve_live_data", liveCapabilities: ["transaction.status"] } },
  { id: "fifi-eval-l06", locale: "en", question: "What does earnings mean, and what are my current earnings?", expect: { intent: "retrieve_live_data", liveCapabilities: ["earnings.current"] }, notes: "Known limitation: engine routes live-only; concept arrives via live evidence context, not KB. Documented, not tuned." },
  { id: "fifi-eval-l07", locale: "en", question: "What is the current price of this villa?", context: { propertyId: "re-128862" }, expect: { intent: "retrieve_live_data", liveCapabilities: ["estate.current"], mustNotContain: ["fifi-", "chunk-"] } },
  { id: "fifi-eval-l08", locale: "en", question: "What is my club tier right now?", expect: { scope: "in_scope", mustNotContain: ["your tier is", "you are a"] }, notes: "Membership live routing unreachable via explain intent; must not assign a tier." },
  { id: "fifi-eval-l09", locale: "en", question: "How much have I earned?", context: { subject: "anon" }, expect: { intent: "retrieve_live_data" }, notes: "Anonymous subject: live lookups must fail closed; no values served." },
  { id: "fifi-eval-l10", locale: "fa", question: "موجودی فعلی من چقدره؟", expect: { intent: "retrieve_live_data" } },
];

export const NAV_CASES: EvalCase[] = [
  { id: "fifi-eval-n01", locale: "en", question: "Open my portfolio.", expect: { intent: "navigate", expectedAction: "action.open-portfolio" } },
  { id: "fifi-eval-n02", locale: "en", question: "Take me to the marketplace.", expect: { intent: "navigate", expectedAction: "action.open-marketplace" } },
  { id: "fifi-eval-n03", locale: "en", question: "Open this villa.", context: { propertyId: "re-123861" }, expect: { intent: "navigate", expectedAction: "action.open-estate" } },
  { id: "fifi-eval-n04", locale: "fa", question: "سبد دارایی‌ام را باز کن", expect: { intent: "navigate", expectedAction: "action.open-portfolio" } },
  { id: "fifi-eval-n05", locale: "en", question: "Where do I connect my wallet?", expect: { intent: "navigate", expectedAction: "action.open-wallet" } },
];
