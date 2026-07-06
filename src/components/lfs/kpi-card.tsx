import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type KpiVariant = "labour" | "employment" | "unemployment" | "trend" | "neutral";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: ReactNode;
  delta?: number;
  deltaSuffix?: string;
  variant?: KpiVariant;
  invertDelta?: boolean;
  className?: string;
}

const variantStyles = {
  labour: {
    border: "border-l-primary",
    indicator: "text-primary",
    bgAccent: "bg-primary/5",
  },
  employment: {
    border: "border-l-success",
    indicator: "text-success",
    bgAccent: "bg-success/5",
  },
  unemployment: {
    border: "border-l-warning",
    indicator: "text-warning",
    bgAccent: "bg-warning/5",
  },
  trend: {
    border: "border-l-accent",
    indicator: "text-accent-foreground",
    bgAccent: "bg-accent/10",
  },
  neutral: {
    border: "border-l-muted",
    indicator: "text-muted-foreground",
    bgAccent: "bg-muted/10",
  },
};

export function KpiCard({ 
  label, 
  value, 
  hint, 
  delta, 
  deltaSuffix = " pp", 
  variant = "neutral",
  invertDelta,
  className 
}: KpiCardProps) {
  const styles = variantStyles[variant];
  const sign = delta == null ? 0 : Math.sign(delta);
  const isPositive = invertDelta ? sign < 0 : sign > 0;
  const isNegative = invertDelta ? sign > 0 : sign < 0;
  const iconColor = isPositive ? "text-success" : isNegative ? "text-destructive" : "text-muted-foreground";
  const Icon = sign === 0 ? Minus : sign > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className={cn("h-full transition-shadow hover:shadow-md", styles.border, styles.bgAccent, className)}>
      <CardContent className="space-y-2 p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
        {(delta != null || hint) && (
          <div className="flex items-center gap-2 text-xs">
            {delta != null && (
              <span className={cn("inline-flex items-center gap-1 font-semibold", iconColor)}>
                <Icon className="h-3.5 w-3.5" />
                {delta > 0 ? "+" : ""}{delta.toFixed(1)}{deltaSuffix}
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
