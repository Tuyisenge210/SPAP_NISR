import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/lfs/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — SPAP" },
      { name: "description", content: "ILO / NISR indicator definitions and weighted formulas used by the Statistical Production and Analytics Platform." },
      { property: "og:title", content: "Methodology — SPAP" },
      { property: "og:description", content: "ILO / NISR indicator definitions and weighted formulas used by the Statistical Production and Analytics Platform." },
    ],
  }),
  component: MethodologyPage,
});

function MethodologyPage() {
  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Methodology</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          All indicators follow ILO standards and the <span className="font-semibold text-primary">NISR Rwanda LFS conventions</span>. Every estimate is
          produced from the same weighted primitive.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">General weighted estimator</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>For any indicator <em>R = numerator / denominator</em>:</p>
            <pre className="overflow-x-auto rounded-md bg-secondary p-3 text-xs">
{`numerator   = Σ wᵢ · 1[i ∈ numerator   domain]
denominator = Σ wᵢ · 1[i ∈ denominator domain]
R           = numerator / denominator`}
            </pre>
            <p className="text-muted-foreground">
              <code>wᵢ</code> is the sampling weight of person <code>i</code>. Filters (year, quarter,
              sex, age, region, area) restrict both the numerator and denominator before summing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Population domains</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Def term="Working-age population (WAP)" def="Persons aged 16 years and above (NISR threshold)." />
            <Def term="Labour force (LF)" def="WAP that are employed or unemployed (ILO short reference period)." />
            <Def term="Employed" def="Worked at least one hour for pay/profit in the reference week, or were temporarily absent from such work." />
            <Def term="Unemployed" def="Without work, available for work, and actively seeking work." />
            <Def term="Outside labour force" def="WAP that are neither employed nor unemployed." />
            <Def term="Youth" def="Aged 16–30 years (NISR Rwanda LFS convention used in the 2025 report)." />
            <Def term="Adult" def="Aged 31 years and above." />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Indicator formulas</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Indicator</th>
                  <th className="py-2 pr-4 font-medium">Formula</th>
                  <th className="py-2 pr-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                <Row name="Labour Force Participation Rate (LFPR)" formula="LF / WAP" notes="Share of WAP in the labour force." />
                <Row name="Employment-to-Population Ratio (EPR)" formula="Employed / WAP" notes="Headline employment indicator." />
                <Row name="Unemployment Rate (UR)" formula="Unemployed / LF" notes="ILO definition." />
                <Row name="Youth Unemployment Rate" formula="Unemployed₁₆₋₃₀ / LF₁₆₋₃₀" notes="Restricted to youth domain." />
                <Row name="Female EPR" formula="Employed_F / WAP_F" notes="Sex disaggregation." />
                <Row name="Gender employment gap" formula="EPR_M − EPR_F" notes="Reported in percentage points." />
                <Row name="Labour underutilization" formula="(Unemp. + Time-related + PLF) / (LF + PLF)" notes="Phase 2 — requires extended LF variables." />
                <Row name="Informal employment rate" formula="Employed_informal / Employed" notes="Optional — requires sector / job-type variables." />
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Def({ term, def }: { term: string; def: string }) {
  return (
    <div>
      <span className="font-medium">{term}.</span> <span className="text-muted-foreground">{def}</span>
    </div>
  );
}
function Row({ name, formula, notes }: { name: string; formula: string; notes: string }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-4 font-medium">{name}</td>
      <td className="py-2 pr-4"><code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{formula}</code></td>
      <td className="py-2 pr-4 text-muted-foreground">{notes}</td>
    </tr>
  );
}
