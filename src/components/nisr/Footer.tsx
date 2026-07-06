import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t relative" style={{ borderColor: "var(--color-border)" }}>
      {/* Subtle imigongo pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "url('/imigongo-pattern.jpg')", backgroundSize: "300px" }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 relative">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/nisr-logo.jpg" alt="NISR Logo" className="h-10 w-auto object-contain" />
              <div>
                <div className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>NISR</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-muted-foreground)" }}>
                  National Institute of Statistics
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
              The National Institute of Statistics of Rwanda (NISR) is the official agency responsible for
              collecting, analyzing, and disseminating statistical information.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-primary)" }}>Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-xs hover:underline" style={{ color: "var(--color-muted-foreground)" }}>Home</Link></li>
              <li><Link to="/dashboard" className="text-xs hover:underline" style={{ color: "var(--color-muted-foreground)" }}>Dashboards</Link></li>
              <li><Link to="/upload" className="text-xs hover:underline" style={{ color: "var(--color-muted-foreground)" }}>Data Upload</Link></li>
              <li><Link to="/methodology" className="text-xs hover:underline" style={{ color: "var(--color-muted-foreground)" }}>Methodology</Link></li>
              <li><Link to="/about" className="text-xs hover:underline flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                About NISR <ExternalLink className="h-3 w-3" />
              </Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-primary)" }}>Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                <span>Kigali, Rwanda</span>
              </li>
              <li className="flex items-start gap-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                <span>+250 788 000 000</span>
              </li>
              <li className="flex items-start gap-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                <span>info@nisr.gov.rw</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            © {new Date().getFullYear()} National Institute of Statistics of Rwanda. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-primary)" }}>
              SPAP
            </span>
            <span className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
              Statistical Production and Analytics Platform
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}