import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface NisrCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
}

export function NisrCard({ title, description, children, className, headerAction, footer }: NisrCardProps) {
  return (
    <Card className={cn("rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md", className)} style={{ borderColor: "var(--color-border)" }}>
      {(title || description || headerAction) && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              {title && <CardTitle className="text-base font-bold" style={{ color: "var(--color-primary)" }}>{title}</CardTitle>}
              {description && <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>{description}</p>}
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(!title && !description && !headerAction ? "p-5" : "pt-0 pb-5")}>
        {children}
      </CardContent>
      {footer && (
        <div className="border-t px-5 py-3" style={{ borderColor: "var(--color-border)" }}>
          {footer}
        </div>
      )}
    </Card>
  );
}