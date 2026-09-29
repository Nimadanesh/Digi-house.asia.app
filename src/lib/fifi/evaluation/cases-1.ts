// File responsibility: Fifi golden evaluation dataset, part 1/3 (FIFI-10).
// Product (20) + Estate (15). Expectations mirror ratified contracts; where the
// runner disagrees, §25 rules apply (fixture wrong → fix fixture, documented).
import type { EvalCase } from "./types";

export const PRODUCT_CASES: EvalCase[] = [
  { id: "fifi-eval-p01", locale: "en", question: "What is FractionalLuxe?", expect: { intent: "explain", category: "product", scope: "in_scope", knowledgeRequirement: "static", docIdContains: ["product-overview", "what-is-fractionalluxe"], minHits: 1 } },
  { id: "fifi-eval-p02", locale: "fa", question: "فرکشنال‌لوکس چیست؟", expect: { intent: "explain", category: "product", scope: "in_scope", knowledgeRequirement: "static", topLocale: "fa", minHits: 1 } },
  { id: "fifi-eval-p03", locale: "en", question: "What was DigiHouse?", expect: { intent: "explain", category: "product", scope: "in_scope", responseStatus: "unavailable", nextStepKind: "unavailable" }, notes: "Legacy name has no KB coverage by design; must not guess — unavailable with next step." },
  { id: "fifi-eval-p04", locale: "fa", question: "دیجی‌هاوس چی بود؟", expect: { intent: "explain", category: "product", scope: "in_scope" } },
  { id: "fifi-eval-p05", locale: "en", question: "How does ownership work in FractionalLuxe?", expect: { intent: "learn", category: "ownership", scope: "in_scope", knowledgeRequirement: "static" } },
  { id: "fifi-eval-p06", locale: "fa", question: "مالکیت کسری یعنی چی؟", expect: { category: "ownership", scope: "in_scope", learningLevel: "beginner", topLocale: "fa" } },
  { id: "fifi-eval-p07", locale: "en", question: "Where can I find a property?", expect: { category: "estate", scope: "in_scope", docIdContains: ["find-property"] } },
  { id: "fifi-eval-p08", locale: "fa", question: "یک ملک را کجا پیدا کنم؟", expect: { category: "estate", scope: "in_scope", topLocale: "fa" } },
  { id: "fifi-eval-p09", locale: "en", question: "How do I buy shares?", expect: { intent: "learn", category: "ownership", scope: "in_scope" } },
  { id: "fifi-eval-p10", locale: "fa", question: "چطور سهم بخرم؟", expect: { category: "ownership", scope: "in_scope", topLocale: "fa" } },
  { id: "fifi-eval-p11", locale: "en", question: "What happens after I buy?", expect: { scope: "in_scope", knowledgeRequirement: "static" } },
  { id: "fifi-eval-p12", locale: "en", question: "How do I connect my wallet?", expect: { intent: "navigate", expectedAction: "action.open-wallet" } },
  { id: "fifi-eval-p13", locale: "fa", question: "کیف پولم را چطور وصل کنم؟", expect: { intent: "navigate", expectedAction: "action.open-wallet" } },
  { id: "fifi-eval-p14", locale: "en", question: "Where are settings?", expect: { category: "product", scope: "in_scope" } },
  { id: "fifi-eval-p15", locale: "en", question: "Explain the Secondary Market", expect: { intent: "learn", category: "product", scope: "in_scope" } },
  { id: "fifi-eval-p16", locale: "fa", question: "مارکت‌پلیس چطور کار می‌کند؟", expect: { intent: "learn", category: "product", scope: "in_scope", topLocale: "fa" } },
  { id: "fifi-eval-p17", locale: "en", question: "What are the five estate tabs?", expect: { category: "estate", docIdContains: ["estate-page"] } },
  { id: "fifi-eval-p18", locale: "fa", question: "تب‌های صفحه ملک چیست؟", expect: { category: "estate", topLocale: "fa" } },
  { id: "fifi-eval-p19", locale: "en", question: "How do I sell my shares?", expect: { intent: "learn", category: "ownership" } },
  { id: "fifi-eval-p20", locale: "fa", question: "چطور سهمم را بفروشم؟", expect: { category: "ownership", topLocale: "fa" } },
];

export const ESTATE_CASES: EvalCase[] = [
  { id: "fifi-eval-e01", locale: "fa", question: "این ویلا کجاست؟", context: { propertyId: "re-123861" }, expect: { category: "estate", knowledgeRequirement: "both", needsClarification: false } },
  { id: "fifi-eval-e02", locale: "en", question: "Tell me about this villa.", context: { propertyId: "re-123861" }, expect: { needsClarification: false, docIdContains: ["re-123861"] } },
  { id: "fifi-eval-e03", locale: "en", question: "Tell me about this villa.", expect: { needsClarification: true, intent: "clarify" } },
  { id: "fifi-eval-e04", locale: "en", question: "Where is Villa du Cap?", expect: { category: "estate", scope: "in_scope" } },
  { id: "fifi-eval-e05", locale: "en", question: "Is this villa still available?", context: { propertyId: "re-128862" }, expect: { intent: "retrieve_live_data", category: "estate", liveCapabilities: ["estate.current"] } },
  { id: "fifi-eval-e06", locale: "en", question: "How many shares does Grand 2 BDM have?", expect: { scope: "in_scope", mustNotContain: ["fifi-", "chunk-"] } },
  { id: "fifi-eval-e07", locale: "fa", question: "این ویلا چطور درآمد ایجاد می‌کنه؟", context: { propertyId: "re-123861" }, expect: { category: "income", needsClarification: false } },
  { id: "fifi-eval-e08", locale: "en", question: "What is the nightly rate basis for JOALI Being?", expect: { category: "income", docIdContains: ["re-128862"] }, notes: "Concept-first routing (income); villa doc carries its own ANR-derivation section. Corrected from estate per engine contract (documented FIFI-10 fix)." },
  { id: "fifi-eval-e09", locale: "en", question: "Tell me about prop_dubai_marina_01", expect: { needsClarification: true, mustNotContain: ["prop_dubai_marina_01"] }, notes: "Legacy id must never become canonical; response must not echo it as identity." },
  { id: "fifi-eval-e10", locale: "en", question: "What amenities does Villa Syrene have?", expect: { category: "estate", docIdContains: ["re-108924"] } },
  { id: "fifi-eval-e11", locale: "fa", question: "ویلای سیرن کجاست؟", expect: { category: "estate", topLocale: "fa" } },
  { id: "fifi-eval-e12", locale: "en", question: "How much is this villa?", context: { propertyId: "re-128862" }, expect: { intent: "retrieve_live_data", liveCapabilities: ["estate.current"] } },
  { id: "fifi-eval-e13", locale: "en", question: "How much is the villa?", expect: { intent: "clarify", needsClarification: true } },
  { id: "fifi-eval-e14", locale: "en", question: "What are the ownership options here?", context: { propertyId: "re-123861" }, expect: { category: "ownership", needsClarification: false } },
  { id: "fifi-eval-e15", locale: "en", question: "What are its rental characteristics?", context: { propertyId: "re-123861" }, expect: { category: "income", needsClarification: false } },
];
