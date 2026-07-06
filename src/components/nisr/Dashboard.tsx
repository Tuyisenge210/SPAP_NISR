import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DashboardProps {
  title: string;
  description?: string;
  children: ReactNode;
  sidebar?: ReactNode;
  headerActions?: ReactNode;
  className?: string;
}

export function Dashboard({ title, description, children, sidebar, headerActions, className }: DashboardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-primary)" }}>{title}</h1>
          {description && <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>{description}</p>}
        </div>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {sidebar && <div className="space-y-4">{sidebar}</div>}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}