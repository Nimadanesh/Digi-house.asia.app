// File responsibility: unit tests for the Fifi UI prototype's local pieces —
// page-context mapping and the mock conversation engine (states, onboarding
// progression, restrictions, failure/retry). No DOM, no network.
import { describe, it, expect } from "vitest";
import { fifiPageContext } from "../page-context";
import {
  fifiReply,
  fifiSuggestions,
  fifiGreeting,
} from "../mock-engine";

const BASE = {
  question: "How does this work?",
  screen: "home" as const,
  estateTitle: null,
  onboarded: true,
  onboardingStep: 0,
  authenticated: true,
  availability: "available" as const,
  locale: "en",
};

describe("fifiPageContext", () => {
  it("maps tab routes", () => {
    expect(fifiPageContext("/home").screen).toBe("home");
    expect(fifiPageContext("/marketplace").screen).toBe("marketplace");
    expect(fifiPageContext("/portfolio").screen).toBe("portfolio");
    expect(fifiPageContext("/earnings").screen).toBe("earnings");
  });

  it("maps secondary routes", () => {
    expect(fifiPageContext("/club").screen).toBe("club");
    expect(fifiPageContext("/card").screen).toBe("card");
    expect(fifiPageContext("/referral").screen).toBe("referral");
    expect(fifiPageContext("/transactions").screen).toBe("transactions");
    expect(fifiPageContext("/settings").screen).toBe("settings");
  });

  it("maps an estate route and extracts the property id", () => {
    const ctx = fifiPageContext("/property/re-128862");
    expect(ctx.screen).toBe("estate");
    expect(ctx.propertyId).toBe("re-128862");
  });

  it("falls back to other for unknown routes", () => {
    expect(fifiPageContext("/somewhere-else").screen).toBe("other");
  });
});

describe("fifiReply — availability states", () => {
  it("unavailable returns a notice regardless of the question", () => {
    const r = fifiReply({ ...BASE, availability: "unavailable" });
    expect("failure" in r).toBe(false);
    if (!("failure" in r)) {
      expect(r.tone).toBe("notice");
      expect(r.text.length).toBeGreaterThan(0);
    }
  });

  it("rate_limited returns a notice", () => {
    const r = fifiReply({ ...BASE, availability: "rate_limited" });
    if (!("failure" in r)) expect(r.tone).toBe("notice");
  });

  it("degraded returns a shortened notice", () => {
    const r = fifiReply({ ...BASE, availability: "degraded" });
    if (!("failure" in r)) {
      expect(r.tone).toBe("notice");
      expect(r.text.length).toBeLessThan(200);
    }
  });

  it("live_unavailable refuses numeric questions instead of guessing", () => {
    const r = fifiReply({ ...BASE, availability: "live_unavailable", question: "What does a share cost?" });
    if (!("failure" in r)) expect(r.tone).toBe("notice");
  });

  it("live_unavailable answers non-numeric questions with an explicit note", () => {
    const r = fifiReply({ ...BASE, availability: "live_unavailable", question: "What is an Estate?" });
    if (!("failure" in r)) {
      expect(r.tone).toBe("answer");
      expect(r.text).toMatch(/Live data is off/);
    }
  });
});

describe("fifiReply — access restriction", () => {
  it("account questions from an anonymous user are restricted", () => {
    const r = fifiReply({ ...BASE, authenticated: false, question: "How much did my holdings earn?" });
    if (!("failure" in r)) expect(r.tone).toBe("restricted");
  });

  it("product questions stay answerable for an anonymous user", () => {
    const r = fifiReply({ ...BASE, authenticated: false, question: "How does income accrue?" });
    if (!("failure" in r)) expect(r.tone).not.toBe("restricted");
  });
});

describe("fifiReply — onboarding progression", () => {
  it("a new user asking 'what is this' gets the step-0 pattern", () => {
    const r = fifiReply({ ...BASE, onboarded: false, question: "What is FractionalLuxe?" });
    if (!("failure" in r)) {
      expect(r.tone).toBe("answer");
      expect(r.matchedOnboardingStep).toBe(0);
      expect(r.example).toBeTruthy();
      expect(r.nextQuestions).toHaveLength(3);
    }
  });

  it("no urgency, scarcity, guarantees, or social proof in onboarding copy", () => {
    for (const q of [
      "What is FractionalLuxe?",
      "What do I actually own?",
      "How does it generate income?",
      "What can change and isn't guaranteed?",
      "Where can I inspect it?",
      "How do I use the app?",
    ]) {
      const r = fifiReply({ ...BASE, onboarded: false, question: q });
      if (!("failure" in r)) {
        const blob = [r.text, r.example ?? "", ...(r.nextQuestions ?? [])].join(" ").toLowerCase();
        for (const banned of ["limited time", "hurry", "don't miss", "guaranteed return", "act now", "everyone is"]) {
          expect(blob).not.toContain(banned);
        }
      }
    }
  });

  it("reports the matched step so the host can advance the progression", () => {
    const r = fifiReply({ ...BASE, onboarded: false, question: "How does it generate income?" });
    if (!("failure" in r)) {
      expect(r.matchedOnboardingStep).toBe(2);
      expect(r.nextQuestions?.some((q) => /guarantee/i.test(q))).toBe(true);
    }
  });

  it("locked income model wording: monthly accrual, 1% fee, 4 weekly installments", () => {
    const r = fifiReply({ ...BASE, onboarded: false, question: "How does it generate income?" });
    if (!("failure" in r)) {
      expect(r.text.toLowerCase()).toContain("accrues monthly");
      expect(r.text).toContain("1% fee");
      expect(r.text).toContain("4 weekly installments");
    }
  });
});

describe("fifiReply — simulated failure + retry", () => {
  it("fails deterministically on the trigger, and a retry succeeds", () => {
    const first = fifiReply({ ...BASE, question: "show me an error" });
    expect("failure" in first).toBe(true);
    const retried = fifiReply({ ...BASE, question: "show me an error", retryOf: true });
    expect("failure" in retried).toBe(false);
  });
});

describe("fifiReply — page awareness", () => {
  it("estate answers refer to the estate the user is viewing (no 'which estate?')", () => {
    const r = fifiReply({ ...BASE, screen: "estate", estateTitle: "Palm Vista", question: "Tell me about this place" });
    if (!("failure" in r)) expect(r.text).toContain("Palm Vista");
  });

  it("earnings answers distinguish projected / accrued / paid", () => {
    const r = fifiReply({ ...BASE, screen: "earnings", question: "What's the state of my income?" });
    if (!("failure" in r)) {
      expect(r.text.toLowerCase()).toContain("projected");
      expect(r.text.toLowerCase()).toContain("accrued");
      expect(r.text.toLowerCase()).toContain("paid");
    }
  });

  it("club answers frame it as the membership/benefits layer", () => {
    const r = fifiReply({ ...BASE, screen: "club", question: "What is this?" });
    if (!("failure" in r)) {
      expect(r.text.toLowerCase()).toContain("membership");
      expect(r.text.toLowerCase()).toContain("benefit");
    }
  });
});

describe("fifiReply — locales", () => {
  it("answers in Persian for fa", () => {
    const r = fifiReply({ ...BASE, locale: "fa", screen: "marketplace", question: "اینجا کجاست؟" });
    if (!("failure" in r)) {
      expect(r.text).toMatch(/[\u0600-\u06FF]/);
    }
  });

  it("non-en/fa locales fall back to English prose", () => {
    const r = fifiReply({ ...BASE, locale: "de", screen: "marketplace", question: "Wo bin ich?" });
    if (!("failure" in r)) {
      expect(r.text).toMatch(/^[A-Za-z]/);
    }
  });
});

describe("fifiSuggestions", () => {
  it("onboarding users get progression starters", () => {
    const s = fifiSuggestions({ screen: "home", onboarded: false, onboardingStep: 0, locale: "en" });
    expect(s).toHaveLength(3);
    expect(s[0]).toMatch(/what is/i);
  });

  it("screens get contextual suggestions (estate, earnings, club)", () => {
    const estate = fifiSuggestions({ screen: "estate", onboarded: true, onboardingStep: 0, locale: "en" });
    expect(estate.some((q) => /this Estate/i.test(q))).toBe(true);
    const earnings = fifiSuggestions({ screen: "earnings", onboarded: true, onboardingStep: 0, locale: "en" });
    expect(earnings[0]).toMatch(/calculated/i);
    expect(earnings[1]).toMatch(/paid vs projected/i);
    const club = fifiSuggestions({ screen: "club", onboarded: true, onboardingStep: 0, locale: "en" });
    expect(club[0]).toMatch(/Club/i);
  });

  it("every contextual suggestion maps to a real engine answer (no dead chips)", () => {
    for (const screen of ["marketplace", "estate", "earnings", "club", "portfolio"] as const) {
      const suggestions = fifiSuggestions({ screen, onboarded: true, onboardingStep: 0, locale: "en" });
      for (const q of suggestions) {
        const r = fifiReply({ ...BASE, screen, question: q });
        if (!("failure" in r)) {
          expect(r.text).not.toMatch(/^I focus on FractionalLuxe/);
        }
      }
    }
  });

  it("estate ownership and marketplace share/choose questions answer concretely", () => {
    const own = fifiReply({ ...BASE, screen: "estate", estateTitle: "Palm Vista", question: "What does ownership of this Estate include?" });
    if (!("failure" in own)) expect(own.text).toContain("Palm Vista");
    const represent = fifiReply({ ...BASE, screen: "marketplace", question: "What does a share represent?" });
    if (!("failure" in represent)) expect(represent.text).toMatch(/fractional slice/i);
    const choose = fifiReply({ ...BASE, screen: "marketplace", question: "How do I choose an Estate?" });
    if (!("failure" in choose)) expect(choose.text).toMatch(/compare/i);
  });

  it("unknown screens fall back to product starters", () => {
    const s = fifiSuggestions({ screen: "other", onboarded: true, onboardingStep: 0, locale: "en" });
    expect(s[0]).toMatch(/FractionalLuxe/);
  });

  it("suggestions are Persian for fa", () => {
    const s = fifiSuggestions({ screen: "estate", onboarded: true, onboardingStep: 0, locale: "fa" });
    expect(s.every((q) => /[\u0600-\u06FF]/.test(q))).toBe(true);
  });
});

describe("fifiGreeting", () => {
  it("names the estate on an estate page", () => {
    const g = fifiGreeting({ screen: "estate", estateTitle: "Palm Vista", locale: "en" });
    expect(g).toContain("Palm Vista");
  });

  it("is Persian for fa", () => {
    const g = fifiGreeting({ screen: "home", locale: "fa" });
    expect(g).toMatch(/[\u0600-\u06FF]/);
  });

  it("greets a guided (new) user like a guide, not a salesperson", () => {
    const en = fifiGreeting({ screen: "home", onboarding: true, locale: "en" });
    expect(en).toMatch(/guide/i);
    const fa = fifiGreeting({ screen: "home", onboarding: true, locale: "fa" });
    expect(fa).toMatch(/[\u0600-\u06FF]/);
  });
});
