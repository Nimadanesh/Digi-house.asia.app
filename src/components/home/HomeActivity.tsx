"use client";
// File responsibility: Home activity preview — header ("Activity" + "View all" to the
// existing /transactions route). Next-payout capsule removed (prod strip).
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";

export function HomeActivity() {
  const t = useTranslations("home");

  return (
    <section className="space-y-2" data-testid="home-activity">
      <Link
        href={ROUTES.transactions}
        onClick={() => haptics.selection()}
        data-testid="activity-see-all"
        aria-label={`${t("activity")} — ${t("viewAll")}`}
        className="flex h-11 w-full items-center justify-between rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.06)] px-4"
      >
        <span className="text-[15px] font-medium text-white">{t("activity")}</span>
        <span className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[rgba(255,255,255,0.60)]">
          {t("viewAll")}
          <ChevronRight size={16} strokeWidth={2.25} aria-hidden className="rtl:rotate-180" />
        </span>
      </Link>
    </section>
  );
}
