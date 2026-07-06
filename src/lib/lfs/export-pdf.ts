import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { IndicatorBundle } from "./indicators";
import { compact, pct } from "./indicators";
import type { NamedTable } from "./crosstabs";

export function buildQuarterlyReport(opts: {
  title: string;
  period: string;
  indicators: IndicatorBundle;
  tables: NamedTable[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(opts.title, 40, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(110);
  doc.text(opts.period, 40, y);
  doc.setTextColor(0);
  y += 26;

  // KPI block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Key indicators", 40, y);
  y += 12;
  const kpis: [string, string][] = [
    ["Working-age population (16+)", compact(opts.indicators.wap)],
    ["Labour force", compact(opts.indicators.labourForce)],
    ["Employed", compact(opts.indicators.employed)],
    ["Unemployed", compact(opts.indicators.unemployed)],
    ["Labour Force Participation Rate", pct(opts.indicators.lfpr)],
    ["Employment-to-Population Ratio", pct(opts.indicators.epr)],
    ["Unemployment Rate", pct(opts.indicators.unemploymentRate)],
    ["Youth (16–30) Unemployment Rate", pct(opts.indicators.youthUnemploymentRate)],
    ["Female / Male EPR", `${pct(opts.indicators.femaleEPR)} / ${pct(opts.indicators.maleEPR)}`],
    ["Gender employment gap", `${(opts.indicators.genderEmploymentGap * 100).toFixed(1)} pp`],
  ];
  autoTable(doc, {
    startY: y + 4,
    head: [["Indicator", "Value"]],
    body: kpis,
    headStyles: { fillColor: [40, 55, 110], textColor: 255 },
    styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: 40, right: 40 },
  });

  for (const t of opts.tables) {
    const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
    let yy = lastY + 24;
    if (yy > 700) { doc.addPage(); yy = 56; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(t.name, 40, yy);
    autoTable(doc, {
      startY: yy + 6,
      head: [t.headers],
      body: t.rows.map((r) => r.map((c) => String(c))),
      headStyles: { fillColor: [40, 55, 110], textColor: 255 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
      margin: { left: 40, right: 40 },
    });
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(
      `Rwanda LFS Analytics — generated ${new Date().toISOString().slice(0, 10)}`,
      40,
      doc.internal.pageSize.getHeight() - 24,
    );
    doc.text(`Page ${i} of ${pages}`, W - 40, doc.internal.pageSize.getHeight() - 24, { align: "right" });
  }
  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
