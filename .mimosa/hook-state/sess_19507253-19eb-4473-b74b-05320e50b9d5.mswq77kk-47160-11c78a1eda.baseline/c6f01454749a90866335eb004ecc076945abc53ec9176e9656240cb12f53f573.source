"use client";
// File responsibility: primary empty-state CTA → Marketplace with selection haptic.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export function BrowseMarketplaceCta({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const t = useTranslations("common");
  const text = label ?? t("browseMarketplace");

  return (
    <Link
      href={ROUTES.marketplace}
      onClick={() => haptics.selection()}
      className={cn(
        "inline-flex h-[44px] items-center justify-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out",
        className,
      )}
    >
      {text}
    </Link>
  );
}
