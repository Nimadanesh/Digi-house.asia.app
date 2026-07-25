import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger";
const VARIANT: Record<Variant, string> = {
  success: "text-success bg-success/12",
  warning: "text-warning bg-warning/12",
  danger: "text-danger bg-danger/10",
};

export function StatusPill({ label, variant, simulated = false }: { label: string; variant: Variant; simulated?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200 ease-out", VARIANT[variant])}>{label}</span>
      {simulated ? (
        <span className="rounded-full bg-muted px-1.5 py-0 text-[0.625rem] uppercase tracking-wide text-muted-foreground">simulated</span>
      ) : null}
    </span>
  );
}