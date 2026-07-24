import { cn } from "@/lib/utils";

export function Row({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex min-h-[48px] items-center gap-2 px-4 border-t border-border mx-4 first:border-t-0 first:mx-0", className)}>{children}</div>;
}