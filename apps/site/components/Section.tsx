import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10", className)} {...props}>
      {children}
    </section>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-wood-deep)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
