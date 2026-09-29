// File responsibility: AnswerProvider CONTRACT + deterministic mock (FIFI-09).
// The provider renders prose from assembled evidence. It is NEVER the source of
// truth: with absent/insufficient evidence it must produce an unavailable-state
// response, never speculation. Vendor-neutral; future LLM providers implement
// this same interface. Display brand arrives via options (no literals here).

import type { FifiDecision } from "./decision-types";
import type { FifiEvidence, FifiNextStep, FifiResponse } from "./answer-types";

/** Minimal authorized input for answer generation. No tokens, secrets, or URLs. */
export interface AnswerRequest {
  question: string;
  locale: string;
  decision: FifiDecision;
  evidence: FifiEvidence;
  /** Display brand for user-facing copy (e.g. from rag/brand.json). */
  brandDisplay: string;
}

export interface AnswerProvider {
  readonly providerName: string;
  generate(request: AnswerRequest): Promise<FifiResponse> | FifiResponse;
}

const FA = (locale: string): boolean => locale.toLowerCase().startsWith("fa");

function clarificationText(reason: string | undefined, locale: string): string {
  if (reason === "ambiguous_property") {
    return FA(locale) ? "منظورتان کدام ویلاست؟" : "Which villa do you mean?";
  }
  return FA(locale) ? "لطفاً کمی بیشتر توضیح بدهید." : "Could you tell me a little more?";
}

function boundaryText(scope: FifiDecision["scope"], locale: string, brand: string): string {
  if (scope === "never_disclose_or_perform") {
    return FA(locale)
      ? "این را نمی‌توانم نشان بدهم، اما در مورد محصول کمکتان می‌کنم."
      : "I can't share that, but I can help with the product.";
  }
  if (scope === "out_of_scope") {
    return FA(locale)
      ? `در این مورد کمکی نمی‌توانم بکنم، ولی درباره‌ی ${brand} در خدمتم.`
      : `I can't help with that, but I'm here for questions about ${brand}.`;
  }
  // restricted
  return FA(locale)
    ? "در این مورد فقط اطلاعات تأییدشده را می‌گویم."
    : "On this topic I can only share verified information.";
}

function alternativeText(hint: string | undefined, locale: string): string {
  const map: Record<string, { en: string; fa: string }> = {
    explain_provenance_and_product: {
      en: "I can explain how ownership works and where each number comes from.",
      fa: "می‌توانم بگویم مالکیت چطور کار می‌کند و هر عدد از کجا آمده.",
    },
    explain_projections_not_promises: {
      en: "I can explain what projected figures mean — they are never promises.",
      fa: "می‌توانم بگویم اعداد پیش‌بینی‌شده چه معنایی دارند — آن‌ها قول نیستند.",
    },
    ask_which_villa: {
      en: "Tell me which villa you mean and I'll look it up.",
      fa: "بگویید کدام ویلا و برای‌تان پیدا می‌کنم.",
    },
  };
  const entry = (hint && map[hint]) || {
    en: "Ask me about the product and I'll help.",
    fa: "درباره‌ی محصول بپرسید تا کمک کنم.",
  };
  return FA(locale) ? entry.fa : entry.en;
}

/**
 * Deterministic template provider. Clearly marked `mock-template`; proves the
 * orchestration contract without any model. Composes only from evidence text
 * excerpts + provenance labels + structured hints. Never invents values.
 */
export class MockAnswerProvider implements AnswerProvider {
  readonly providerName = "mock-template-v1";

  generate(request: AnswerRequest): FifiResponse {
    const { decision, evidence, locale, brandDisplay } = request;
    const fa = FA(locale);
    const actions = evidence.navigation ? [evidence.navigation] : [];

    if (decision.needsClarification) {
      const clarification = clarificationText(decision.clarificationReason, locale);
      return this.base(request, {
        answer: clarification,
        status: "clarification_required",
        needsClarification: true,
        clarification,
        nextStep: { kind: "clarify", text: clarification },
      });
    }

    if (decision.scope !== "in_scope") {
      const boundary = boundaryText(decision.scope, locale, brandDisplay);
      const alternative = alternativeText(decision.nextStepHint, locale);
      return this.base(request, {
        answer: `${boundary} ${alternative}`,
        status: "out_of_scope",
        actions,
        nextStep: { kind: "redirect", text: alternative, action: actions[0] },
      });
    }

    if (decision.intent === "navigate" && evidence.navigation) {
      const answer = fa
        ? `شما را به بخش مربوط می‌برم.`
        : `Taking you to the right section.`;
      return this.base(request, {
        answer,
        status: "resolved",
        actions,
        nextStep: { kind: "navigate", text: answer, action: actions[0] },
      });
    }

    const liveFailures = evidence.live.filter((l) => !l.ok);
    const liveOk = evidence.live.filter((l) => l.ok);
    if (evidence.knowledge.length === 0 && liveOk.length === 0) {
      const reason =
        liveFailures.length > 0
          ? fa
            ? "این اطلاعات فعلاً در دسترس نیست."
            : "This information isn't available right now."
          : fa
            ? "برای این سؤال اطلاعات تأییدشده‌ای پیدا نکردم."
            : "I couldn't find verified information for this question.";
      const next: FifiNextStep = { kind: "unavailable", text: reason };
      return this.base(request, {
        answer: `${reason} ${alternativeText(decision.nextStepHint, locale)}`,
        status: "unavailable",
        actions,
        nextStep: next,
      });
    }

    const parts: string[] = [];
    const top = evidence.knowledge[0];
    if (top) {
      const excerpt = top.text.slice(0, 220).replace(/\s+/g, " ").trim();
      const label = top.defaultProvenance;
      parts.push(
        fa
          ? `${excerpt} (منبع: ${label})`
          : `${excerpt} (source: ${label})`,
      );
    }
    for (const l of liveOk) {
      parts.push(
        fa
          ? `وضعیت فعلی از منبع ${l.source} دریافت شد.`
          : `Current state received from ${l.source} source.`,
      );
    }
    if (liveFailures.length > 0) {
      parts.push(
        fa
          ? "بخشی از اطلاعات زنده در دسترس نبود و حدس زده نشد."
          : "Some live information wasn't available and wasn't guessed.",
      );
    }
    const answer = parts.join(" ");
    return this.base(request, {
      answer,
      status: "resolved",
      actions,
      nextStep: actions[0]
        ? {
            kind: "navigate",
            text: fa ? "برای ادامه به بخش مربوط بروید." : "Continue in the relevant section.",
            action: actions[0],
          }
        : { kind: "answer", text: fa ? "سؤال دیگری دارید؟" : "Anything else I can help with?" },
    });
  }

  private base(
    request: AnswerRequest,
    partial: Partial<FifiResponse> & Pick<FifiResponse, "answer" | "status" | "nextStep">,
  ): FifiResponse {
    const { decision, locale } = request;
    return {
      answer: partial.answer,
      locale,
      status: partial.status,
      scope: decision.scope,
      intent: decision.intent,
      category: decision.category,
      sources: [
        ...request.evidence.knowledge.slice(0, 3).map((h) => ({
          kind: "knowledge" as const,
          ref: `${h.docId}#${h.chunkId}`,
          provenance: h.defaultProvenance,
        })),
        ...request.evidence.live.map((l) => ({
          kind: "live" as const,
          ref: l.capability,
          provenance: l.provenance,
          ok: l.ok,
        })),
      ],
      needsClarification: partial.needsClarification ?? false,
      clarification: partial.clarification,
      actions: partial.actions ?? [],
      nextStep: partial.nextStep,
      learningLevel: decision.learningLevel,
      answerOrigin: "mock-template",
      confidence: partial.status === "resolved" && request.evidence.knowledge.length > 0 ? "medium" : null,
    };
  }
}
