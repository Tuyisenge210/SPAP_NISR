import type { ReactNode } from "react";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  tagline?: string;
  actions?: ReactNode;
  className?: string;
}

export function HeroBanner({ title, subtitle, tagline, actions, className }: HeroBannerProps) {
  return (
    <section className={cn("relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-card to-secondary/5 p-8 md:p-12", className)} style={{ borderColor: "var(--color-border)" }}>
      {/* Imigongo-inspired subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "url('/imigongo-pattern.jpg')", backgroundSize: "250px" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold mb-4" style={{ borderColor: "var(--color-border)" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
          <span style={{ color: "var(--color-primary)" }}>National Institute of Statistics of Rwanda</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--color-primary)" }}>
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-2xl text-base" style={{ color: "var(--color-foreground)" }}>
            {subtitle}
          </p>
        )}

        {tagline && (
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            {tagline}
          </p>
        )}

        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}