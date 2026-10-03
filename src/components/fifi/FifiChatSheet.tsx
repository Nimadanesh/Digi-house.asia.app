"use client";
// File responsibility: the single global Fifi ChatSheet (FIFI-05 UX Foundation).
// UI PROTOTYPE: answers come from the local mock engine (mock-engine.ts) — no
// real LLM, Laya, server, or live-data backend. Hosted permanently in AppShell so
// the conversation survives open/close within a session; page awareness comes
// from the current route (page-context.ts). The header status chip cycles the
// prototype availability states so every runtime state is demonstrable.
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ChevronRight,
  CreditCard,
  Crown,
  Home,
  Landmark,
  PieChart,
  ReceiptText,
  RotateCcw,
  SendHorizontal,
  Settings2,
  ShieldAlert,
  Sparkles,
  Store,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Sheet } from "@/components/common/Sheet";
import { FifiAvatar } from "./FifiAvatar";
import { fifiPageContext, type FifiScreen } from "./page-context";
import {
  fifiGreeting,
  fifiReply,
  fifiSuggestions,
  type FifiAvailability,
  type FifiMessageTone,
} from "./mock-engine";
import { getRepo } from "@/lib/api/getRepo";
import { haptics } from "@/lib/telegram/haptics";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

/** Prototype-only simulated latency (no network involved). */
const THINKING_MS = 900;
const AVAILABILITY_CYCLE: readonly FifiAvailability[] = [
  "available",
  "degraded",
  "rate_limited",
  "unavailable",
  "live_unavailable",
];
/**
 * Onboarding-awareness (prototype-local): a user the prototype hasn't guided
 * yet gets Fifi's explanatory progression on first open. It ends when the six
 * steps are completed or the conversation is reset. Settings' `onboarded`
 * alone can't drive this — the onboarding carousel completes before the app
 * chrome (and Fifi) is ever reachable.
 */
const GUIDE_DONE_KEY = "fifi-prototype-guide-done";
const LAST_ONBOARDING_STEP = 5;

interface ChatMessage {
  id: string;
  role: "user" | "fifi";
  text: string;
  tone: FifiMessageTone;
  example?: string;
  nextQuestions?: string[];
  action?: { label: string; route: string };
  /** Set on error bubbles: the question a Retry should re-send. */
  retryQuestion?: string;
}

let seq = 0;
const uid = (): string => `fifi-msg-${++seq}`;

export function FifiChatSheet() {
  const open = useUiStore((s) => s.fifiOpen);
  const closeFifi = useUiStore((s) => s.closeFifi);
  const close = useCallback(() => {
    closeFifi();
    haptics.selection();
  }, [closeFifi]);

  // Conversation state lives on the always-mounted host: closing the sheet
  // keeps the thread; "New conversation" resets it.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState("");
  const [availability, setAvailability] = useState<FifiAvailability>("available");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [guideMode, setGuideMode] = useState<boolean>(
    () => typeof window === "undefined" || window.localStorage.getItem(GUIDE_DONE_KEY) === null,
  );

  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const onboarded = useSettingsStore((s) => s.onboarded);
  const user = useAuthStore((s) => s.user);
  const authenticated = user !== null;

  const ctx = fifiPageContext(pathname);
  const propertyId = ctx.screen === "estate" ? ctx.propertyId : undefined;
  const [fetchedEstate, setFetchedEstate] = useState<{ id: string; title: string | null } | null>(null);
  // Derived: a fetched title only applies while the user is still on that estate.
  const estateTitle =
    propertyId && fetchedEstate?.id === propertyId ? fetchedEstate.title : null;

  // Page awareness: name the estate the user is looking at (app's own mock repo).
  useEffect(() => {
    if (!open || !propertyId) return;
    let alive = true;
    getRepo()
      .marketplace.get(propertyId)
      .then((l) => {
        if (alive) setFetchedEstate({ id: propertyId, title: l.title });
      })
      .catch(() => {
        if (alive) setFetchedEstate({ id: propertyId, title: null });
      });
    return () => {
      alive = false;
    };
  }, [open, propertyId]);

  const send = useCallback(
    (raw: string, retryOf = false) => {
      const question = raw.trim();
      if (!question || thinking || availability === "unavailable") return;
      haptics.impact("light");
      if (!retryOf) {
        setMessages((m) => [...m, { id: uid(), role: "user", text: question, tone: "answer" }]);
        setInput("");
      }
      setThinking(true);
      // Prototype-only simulated latency (no network involved).
      window.setTimeout(() => {
        setThinking(false);
        const result = fifiReply({
          question,
          screen: ctx.screen,
          estateTitle,
          onboarded: !(guideMode || !onboarded),
          onboardingStep,
          authenticated,
          availability,
          locale,
          retryOf,
        });
        if ("failure" in result) {
          setMessages((m) => [
            ...m,
            { id: uid(), role: "fifi", tone: "error", text: "", retryQuestion: question },
          ]);
          return;
        }
        const nextStep =
          result.matchedOnboardingStep !== undefined
            ? Math.max(onboardingStep, Math.min(result.matchedOnboardingStep + 1, LAST_ONBOARDING_STEP))
            : onboardingStep;
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "fifi",
            tone: result.tone,
            text: result.text,
            example: result.example,
            nextQuestions: result.nextQuestions,
            action: result.action,
          },
        ]);
        setOnboardingStep(nextStep);
        // Progression complete → the guide has done its job.
        if (result.matchedOnboardingStep === LAST_ONBOARDING_STEP) {
          setGuideMode(false);
          window.localStorage.setItem(GUIDE_DONE_KEY, "1");
        }
      }, THINKING_MS);
    },
    [availability, authenticated, ctx.screen, estateTitle, guideMode, locale, onboarded, onboardingStep, thinking],
  );

  const resetConversation = useCallback(() => {
    setMessages([]);
    setInput("");
    setThinking(false);
    setOnboardingStep(0);
    setGuideMode(false);
    window.localStorage.setItem(GUIDE_DONE_KEY, "1");
    haptics.impact("light");
  }, []);

  const lastGuided = [...messages].reverse().find((m) => m.role === "fifi" && m.tone === "answer" && m.nextQuestions?.length);
  const guided = guideMode || !onboarded;
  const suggestions = lastGuided?.nextQuestions ?? fifiSuggestions({
    screen: ctx.screen,
    onboarded: !guided,
    onboardingStep,
    locale,
  });
  const greeting = fifiGreeting({ screen: ctx.screen, estateTitle, onboarding: guided, locale });

  return (
    <Sheet
      open={open}
      onClose={close}
      labelledBy="fifi-title"
      className="flex h-[min(92svh,800px)] flex-col"
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-visible px-0 pt-1"
    >
      <FifiChatBody
        messages={messages}
        thinking={thinking}
        input={input}
        setInput={setInput}
        send={send}
        suggestions={suggestions}
        greeting={greeting}
        availability={availability}
        setAvailability={setAvailability}
        resetConversation={resetConversation}
        close={close}
        navigate={router.push}
        screen={ctx.screen}
        estateTitle={estateTitle}
      />
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Body (mounted only while open)
// ---------------------------------------------------------------------------

function FifiChatBody({
  messages,
  thinking,
  input,
  setInput,
  send,
  suggestions,
  greeting,
  availability,
  setAvailability,
  resetConversation,
  close,
  navigate,
  screen,
  estateTitle,
}: {
  messages: ChatMessage[];
  thinking: boolean;
  input: string;
  setInput: (v: string) => void;
  send: (q: string, retryOf?: boolean) => void;
  suggestions: string[];
  greeting: string;
  availability: FifiAvailability;
  setAvailability: (v: FifiAvailability) => void;
  resetConversation: () => void;
  close: () => void;
  navigate: (route: string) => void;
  screen: FifiScreen;
  estateTitle: string | null;
}) {
  const t = useTranslations("fifi");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages.length, thinking]);

  const cycleAvailability = () => {
    const next = AVAILABILITY_CYCLE[(AVAILABILITY_CYCLE.indexOf(availability) + 1) % AVAILABILITY_CYCLE.length];
    setAvailability(next);
    haptics.selection();
  };

  return (
    <>
      <header className="flex items-center gap-2.5 border-b border-border/40 px-3.5 pb-2.5 pt-2">
        <FifiAvatar size="md" glow sheen />
        <div className="min-w-0 flex-1">
          {/* Brand styling: the assistant wordmark is lowercase — "fifi". */}
          <p id="fifi-title" className="text-[15px] font-semibold lowercase leading-tight tracking-wide">
            {t("sheet.title")}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-tight text-muted-foreground">{t("sheet.tagline")}</p>
        </div>
        {/* Prototype affordance: tap to cycle the demonstrable runtime states. */}
        <button
          type="button"
          data-testid="fifi-state-chip"
          onClick={cycleAvailability}
          className="flex min-h-[28px] items-center gap-1.5 rounded-full bg-surface-2/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
        >
          <span aria-hidden className={cn("size-1.5 rounded-full", DOT_CLASS[availability])} />
          {t(`state.${availability}`)}
        </button>
        {messages.length > 0 ? (
          <button
            type="button"
            aria-label={t("sheet.newConversation")}
            data-testid="fifi-new-conversation"
            onClick={resetConversation}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-surface-2"
          >
            <RotateCcw className="size-4.5" />
          </button>
        ) : null}
        <button
          type="button"
          aria-label={t("sheet.close")}
          data-testid="fifi-close"
          onClick={close}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-surface-2"
        >
          <X className="size-5" />
        </button>
      </header>

      {/* Premium context indicator — where the user is, in product language. */}
      {screen !== "other" ? (
        <div key={`${screen}-${estateTitle ?? ""}`} className="flex justify-center px-3 pt-2.5">
          <div
            data-testid="fifi-context-badge"
            className="fifi-badge-in flex min-h-[30px] items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/25 backdrop-blur-md"
          >
            {(() => {
              const Icon = CONTEXT_ICON[screen] ?? Sparkles;
              return <Icon aria-hidden className="size-3.5 shrink-0 text-primary" />;
            })()}
            <span className="whitespace-nowrap text-[11px] font-medium tracking-wide text-primary">
              {screen === "estate" && estateTitle
                ? `${t("context.estate")} · ${estateTitle}`
                : t(`context.${screen}`)}
            </span>
          </div>
        </div>
      ) : null}

      {availability !== "available" ? (
        <div
          data-testid="fifi-banner"
          className={cn(
            "mx-3 mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] leading-snug",
            availability === "unavailable" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning",
          )}
        >
          <AlertTriangle aria-hidden className="size-4 shrink-0" />
          <span className="flex-1">{t(`banner.${availability}`)}</span>
          {availability === "unavailable" || availability === "rate_limited" ? (
            <button
              type="button"
              onClick={() => setAvailability("available")}
              className="min-h-[32px] shrink-0 rounded-full bg-surface-2 px-3 text-[12px] font-medium text-foreground"
            >
              {t("banner.retry")}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        data-testid="fifi-messages"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-3"
      >
        {messages.length === 0 && !thinking ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-6 text-center">
            <FifiAvatar size="lg" glow sheen />
            <p data-testid="fifi-greeting" className="max-w-[38ch] text-[15px] leading-relaxed text-foreground/90">
              {greeting}
            </p>
            {suggestions.length > 0 && availability !== "unavailable" ? (
              <div data-testid="fifi-suggestions" className="flex flex-wrap justify-center gap-1.5">
                {suggestions.map((q) => (
                  <SuggestionChip key={q} question={q} onSend={send} />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          // mt-auto anchors a short conversation to the bottom (native chat feel);
          // once content overflows, the auto margin is zero and scrolling is normal.
          <div className="mt-auto flex flex-col gap-3">
            {messages.map((m) => (
              <Bubble
                key={m.id}
                message={m}
                onRetry={(q) => send(q, true)}
                onNavigate={(route) => {
                  navigate(route);
                  close();
                }}
              />
            ))}
            {thinking ? (
              <ThinkingRow />
            ) : suggestions.length > 0 && availability !== "unavailable" ? (
              // Suggestions live in the conversation flow — right after the last
              // assistant message, scrolling with it. The input is the only fixed
              // bottom element.
              <div data-testid="fifi-suggestions" className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("sheet.suggestedLabel")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((q) => (
                    <SuggestionChip key={q} question={q} onSend={send} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 px-3 pb-3 pt-1.5"
      >
        <input
          data-testid="fifi-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("sheet.inputPlaceholder")}
          disabled={availability === "unavailable"}
          className="h-11 min-w-0 flex-1 rounded-full border border-border/70 bg-surface-2 px-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 disabled:opacity-50"
          enterKeyHint="send"
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label={t("sheet.send")}
          data-testid="fifi-send"
          disabled={!input.trim() || thinking || availability === "unavailable"}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <SendHorizontal aria-hidden className="size-5 rtl:-scale-x-100" />
        </button>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// Message bubbles
// ---------------------------------------------------------------------------

/** Contextual question chip — part of the conversation flow, not app chrome. */
function SuggestionChip({ question, onSend }: { question: string; onSend: (q: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSend(question)}
      className="min-h-[38px] rounded-full border border-border/70 bg-surface-2/60 px-3 py-1.5 text-start text-[13px] leading-tight text-foreground/90 transition-colors active:bg-surface-2"
    >
      {question}
    </button>
  );
}

function Bubble({
  message,
  onRetry,
  onNavigate,
}: {
  message: ChatMessage;
  onRetry: (question: string) => void;
  onNavigate: (route: string) => void;
}) {
  const t = useTranslations("fifi");

  if (message.role === "user") {
    return (
      <div className="ms-auto max-w-[82%] rounded-2xl rounded-ee-sm bg-primary px-3.5 py-2.5 text-[14px] leading-relaxed text-primary-foreground">
        {message.text}
      </div>
    );
  }

  if (message.tone === "error") {
    return (
      <div
        data-testid="fifi-error"
        className="me-auto flex max-w-[88%] flex-col gap-2 rounded-2xl rounded-es-sm border border-danger/30 bg-danger/10 px-3.5 py-2.5"
      >
        <span className="text-[14px] leading-relaxed text-foreground">{t("message.error")}</span>
        <button
          type="button"
          onClick={() => onRetry(message.retryQuestion ?? "")}
          className="min-h-[36px] self-start rounded-full bg-surface-2 px-3.5 text-[13px] font-medium text-foreground"
        >
          {t("message.retry")}
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="fifi-answer"
      className={cn(
        "me-auto flex max-w-[88%] flex-col rounded-2xl rounded-es-sm px-3.5 py-2.5 text-[14px] leading-relaxed",
        message.tone === "notice"
          ? "border border-warning/30 bg-warning/10"
          : message.tone === "restricted"
            ? "border border-warning/30 bg-surface-2"
            : "bg-surface-2",
      )}
    >
      {message.tone === "restricted" ? (
        <span className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-warning">
          <ShieldAlert aria-hidden className="size-3.5" />
          {t("message.restrictedLabel")}
        </span>
      ) : null}
      <span className="text-foreground">{message.text}</span>
      {message.example ? (
        <span className="mt-2 border-t border-border/50 pt-2 text-[13px] leading-relaxed text-muted-foreground">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide">
            {t("sheet.exampleLabel")}
          </span>
          {message.example}
        </span>
      ) : null}
      {message.action ? (
        <button
          type="button"
          onClick={() => onNavigate(message.action!.route)}
          className="mt-2 inline-flex min-h-[36px] w-fit items-center gap-1 rounded-full bg-primary/15 px-3 text-[13px] font-medium text-primary"
        >
          {message.action.label}
          <ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />
        </button>
      ) : null}
    </div>
  );
}

function ThinkingRow() {
  return (
    <div data-testid="fifi-thinking" className="me-auto flex items-end gap-2">
      <FifiAvatar size="sm" />
      <div className="flex items-center gap-1 rounded-2xl rounded-es-sm bg-surface-2 px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className="size-1.5 rounded-full bg-muted-foreground"
            style={{ animation: "dh-loader-dot 1.2s ease-in-out infinite", animationDelay: `${i * 180}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

const DOT_CLASS: Readonly<Record<FifiAvailability, string>> = {
  available: "bg-success",
  degraded: "bg-warning",
  rate_limited: "bg-warning",
  unavailable: "bg-danger",
  live_unavailable: "bg-muted-foreground",
};

/** Context-badge icon per screen (internal map — never rendered as a route/name). */
const CONTEXT_ICON: Readonly<Partial<Record<FifiScreen, LucideIcon>>> = {
  home: Home,
  marketplace: Store,
  estate: Landmark,
  portfolio: PieChart,
  earnings: Wallet,
  club: Crown,
  card: CreditCard,
  referral: Users,
  transactions: ReceiptText,
  settings: Settings2,
};
