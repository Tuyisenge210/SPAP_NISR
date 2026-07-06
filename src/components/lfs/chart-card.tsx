import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

export function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="border border-border bg-card transition-shadow hover:shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
        {description && <p className="text-xs font-medium text-muted-foreground mt-1">{description}</p>}
      </CardHeader>
      <CardContent className="h-[320px] p-4">{children}</CardContent>
    </Card>
  );
}
