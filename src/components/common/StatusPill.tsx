import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger";
const VARIANT: Record<Variant, string> = {
  success: "text-success bg-success/12",
  warning: "text-warning bg-warning/12",
  danger: "text-danger bg-danger/10",
};

export function StatusPill({ label, variant }: { label: string; variant: Variant }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200 ease-out", VARIANT[variant])}>{label}</span>
  );
}