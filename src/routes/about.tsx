import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/lfs/app-shell";
import { NisrCard } from "@/components/nisr/ui/Card";
import { NisrButton } from "@/components/nisr/ui/Button";
import { HeroBanner } from "@/components/nisr/HeroBanner";
import { Mail, Phone, MapPin, Users, Target, Award } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About NISR — SPAP" },
      { name: "description", content: "Learn about the National Institute of Statistics of Rwanda and our mission." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell>
      <HeroBanner
        title="About NISR"
        subtitle="The National Institute of Statistics of Rwanda is the official agency responsible for collecting, analyzing, and disseminating statistical information."
        tagline="Established to support evidence-based decision making in Rwanda"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <NisrCard
          title="Our Mission"
          description="What drives us"
          headerAction={<Target className="h-5 w-5" style={{ color: "var(--color-primary)" }} />}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
            To lead the development and coordination of the National Statistical System in Rwanda, producing high-quality,
            timely, and reliable statistics for policy formulation, planning, and monitoring.
          </p>
        </NisrCard>

        <NisrCard
          title="Our Vision"
          description="Where we are headed"
          headerAction={<Award className="h-5 w-5" style={{ color: "var(--color-primary)" }} />}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
            To be a world-class statistical institution recognized for excellence in data production, innovation,
            and service to the people of Rwanda and the global community.
          </p>
        </NisrCard>

        <NisrCard
          title="Our Mandate"
          description="Legal foundation"
          headerAction={<Users className="h-5 w-5" style={{ color: "var(--color-primary)" }} />}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
            NISR operates under the laws of Rwanda to coordinate all official statistical activities, maintain
            standards, and ensure the production of reliable social and economic data.
          </p>
        </NisrCard>
      </div>

      <NisrCard title="Contact Information" description="Get in touch with NISR">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Address</div>
              <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Kigali, Rwanda</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Phone</div>
              <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>+250 788 000 000</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Email</div>
              <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>info@nisr.gov.rw</div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <NisrButton asChild><Link to="/">Return to SPAP Home</Link></NisrButton>
        </div>
      </NisrCard>
    </AppShell>
  );
}