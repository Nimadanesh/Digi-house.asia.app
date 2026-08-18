import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// DESIGN_SYSTEM §"Empty state": ~120px monochrome line-illustration in --muted-foreground,
// headline H2 (0.9375rem/600), one muted sentence, one Primary button.
export function EmptyState({
  title,
  message,
  action,
  className,
  ...rest
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
      {...rest}
    >
      <Building2 size={120} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-[0.9375rem] font-semibold leading-snug text-foreground">{title}</h2>
      <p className="mt-2 mb-0.5 max-w-xs text-sm leading-relaxed text-muted-foreground">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
