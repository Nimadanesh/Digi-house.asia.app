import { cn } from "@/lib/utils";

export function Block({
  className,
  children,
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-card rounded-[12px]", className)} {...rest}>
      {children}
    </div>
  );
}
