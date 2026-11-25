import { jsPDF } from "jspdf";

export type ScanModality = "xray" | "ct";

interface ReportData {
  modality?: ScanModality;
  prediction: string;
  confidence: number;
  findings: string;
  timestamp: string;
  filename: string;
  imageDataUrl?: string | null;
  heatmapDataUrl?: string | null;
  classProbabilities?: Record<string, number>;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
  patientNotes?: string;
  practitioner?: string;
  hospital?: string;
  modelUsed?: string;
  isBorderline?: boolean;
  clinicalSummary?: string;
  clinicalNextSteps?: string[];
}

export const generateReport = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const modality: ScanModality = data.modality === "ct" ? "ct" : "xray";
  const scanLabel = modality === "ct" ? "Chest CT" : "Chest X-ray";

  // Header (Dentivo Deep Emerald)
  doc.setFillColor(7, 34, 30);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MedVision", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`AI-Powered ${scanLabel} Diagnostic Report`, 14, 25);
  doc.setFontSize(9);
  doc.text(`Report ID: MV-${Date.now()}`, pageWidth - 14, 18, { align: "right" });
  doc.text(data.timestamp, pageWidth - 14, 25, { align: "right" });

  doc.setTextColor(20, 20, 20);
  let y = 42;

  // Patient section (compute height dynamically so wrapped notes never overflow)
  doc.setFontSize(10);
  const patientRows: Array<[string, string]> = [
    ["Patient Name", data.patientName || "Not specified"],
    ["Age / Gender", `${data.patientAge ?? "N/A"}  /  ${data.patientGender || "Unspecified"}`],
    ["Scan Type", modality === "ct" ? "Chest CT (Lung-Cancer Subtype Classification)" : "Chest X-ray (Pneumonia Classification)"],
    ["Attending Practitioner", data.practitioner || "Not specified"],
    ["Hospital", data.hospital || "Not specified"],
    ["Clinical Notes", data.patientNotes || "None"],
  ];
  const wrappedRows = patientRows.map(([k, v]) => {
    const wrapped = doc.splitTextToSize(String(v), pageWidth - 90);
    return { k, wrapped, rowH: Math.max(6, wrapped.length * 5) };
  });
  const patientBoxH = 12 + wrappedRows.reduce((sum, r) => sum + r.rowH, 0);

  doc.setFillColor(240, 245, 243);
  doc.roundedRect(14, y - 6, pageWidth - 28, patientBoxH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Patient Information", 18, y);
  y += 7;
  doc.setFontSize(10);
  wrappedRows.forEach(({ k, wrapped, rowH }) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, 18, y);
    doc.setFont("helvetica", "normal");
    doc.text(wrapped, 70, y);
    y += rowH;
  });

  y += 8;

  // Diagnostic result box
  const p = data.prediction;
  const isNormal = p === "Normal";
  const isInvalid = p === "Invalid";
  const [r, g, b] = isNormal
    ? [16, 185, 129]
    : isInvalid || data.isBorderline
      ? [217, 119, 6]
      : [220, 38, 38];
  const [br, bg, bb] = isNormal
    ? [240, 253, 244]
    : isInvalid || data.isBorderline
      ? [254, 249, 195]
      : [254, 226, 226];
  const boxH = data.isBorderline && !isInvalid ? 34 : 28;
  doc.setFillColor(br, bg, bb);
  doc.setDrawColor(r, g, b);
  doc.roundedRect(14, y, pageWidth - 28, boxH, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(r, g, b);
  doc.text(`Diagnosis: ${p}`, 20, y + 12);
  doc.setFontSize(12);
  doc.text(`Confidence: ${Number(data.confidence).toFixed(2)}%`, 20, y + 22);
  if (data.isBorderline && !isInvalid) {
    doc.setFontSize(9);
    doc.text("Borderline / low-confidence prediction — correlate with radiologist review.", 20, y + 30);
  }
  doc.setFontSize(10);
  doc.text(`Modality: ${scanLabel}`, pageWidth - 20, y + 12, { align: "right" });
  y += boxH + 8;

  doc.setTextColor(20, 20, 20);

  // Class probabilities (wider label column so CT class names never overlap bars)
  if (data.classProbabilities && Object.keys(data.classProbabilities).length) {
    if (y > pageHeight - 55) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Classification Breakdown", 14, y);
    y += 6;
    doc.setFontSize(9.5);
    const barX = 76;
    const barMaxW = pageWidth - 14 - barX - 16;
    Object.entries(data.classProbabilities).forEach(([cls, prob]) => {
      doc.setFont("helvetica", "normal");
      doc.text(cls, 14, y + 4);
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(barX, y, barMaxW, 5, 1, 1, "F");
      doc.setFillColor(16, 150, 115);
      doc.roundedRect(barX, y, (barMaxW * Math.max(0, Math.min(100, Number(prob)))) / 100, 5, 1, 1, "F");
      doc.text(`${Number(prob).toFixed(1)}%`, pageWidth - 14, y + 4, { align: "right" });
      y += 8;
    });
    y += 4;
  }

  // Findings
  if (y > pageHeight - 40) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("AI Findings", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const findings = doc.splitTextToSize(data.findings || "No findings.", pageWidth - 28);
  doc.text(findings, 14, y);
  y += findings.length * 5 + 6;

  // Clinical Interpretation & Suggested Workup
  if (data.clinicalSummary || (data.clinicalNextSteps && data.clinicalNextSteps.length)) {
    if (y > pageHeight - 50) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Clinical Interpretation & Suggested Workup", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    if (data.clinicalSummary) {
      const summaryLines = doc.splitTextToSize(data.clinicalSummary, pageWidth - 28);
      doc.text(summaryLines, 14, y);
      y += summaryLines.length * 4.5 + 3;
    }
    if (data.clinicalNextSteps?.length) {
      data.clinicalNextSteps.forEach((step) => {
        const stepLines = doc.splitTextToSize(`• ${step}`, pageWidth - 32);
        if (y + stepLines.length * 4.5 > pageHeight - 22) { doc.addPage(); y = 20; }
        doc.text(stepLines, 16, y);
        y += stepLines.length * 4.5 + 1.5;
      });
    }
    y += 5;
  }

  // Images side-by-side
  if (data.imageDataUrl || data.heatmapDataUrl) {
    if (y > pageHeight - 105) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Imaging & Spatial Attribution", 14, y);
    y += 4;
    const imgW = data.heatmapDataUrl && data.imageDataUrl ? 85 : 120;
    const imgH = 85;
    try {
      if (data.imageDataUrl) {
        const imgFmt = data.imageDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        doc.addImage(data.imageDataUrl, imgFmt, 14, y, imgW, imgH);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text(`Original ${scanLabel}`, 14, y + imgH + 5);
      }
      if (data.heatmapDataUrl) {
        const x2 = data.imageDataUrl ? 14 + imgW + 8 : 14;
        doc.addImage(data.heatmapDataUrl, "PNG", x2, y, imgW, imgH);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Grad-CAM Saliency Overlay", x2, y + imgH + 5);
      }
      y += imgH + 12;
    } catch (e) {
      console.error("Image embed failed:", e);
    }
  }

  // Meta
  if (y > pageHeight - 40) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Technical Details", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Scan Type: ${scanLabel}`, 14, y); y += 5;
  doc.text(
    `Model: ${data.modelUsed || (modality === "ct" ? "MobileNetV2 (4-class CT, fine-tuned)" : "MobileNetV2 (3-class, fine-tuned)")}`,
    14,
    y
  );
  y += 5;
  doc.text(`Source File: ${data.filename}`, 14, y); y += 5;
  doc.text(`Generated: ${data.timestamp}`, 14, y); y += 5;

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footY = pageHeight - 14;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, footY - 4, pageWidth - 14, footY - 4);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("AI-assisted analysis · not a substitute for professional medical diagnosis.", 14, footY);
    doc.text(`MedVision © ${new Date().getFullYear()}  ·  Page ${i}/${pageCount}`, pageWidth - 14, footY, { align: "right" });
  }

  doc.save(`medvision-${modality}-report-${(data.patientName || "patient").replace(/\s+/g, "_")}-${Date.now()}.pdf`);
};
