import { cn } from "@/lib/utils";

export function Block({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("bg-card rounded-[12px]", className)}>{children}</div>;
}